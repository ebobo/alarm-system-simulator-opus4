# Loop Discovery and C_Address Assignment Design

## Overview

Simulate realistic fire alarm loop discovery behavior when the loop is powered on. Devices are discovered one-by-one from the loop driver's negative terminal (baby blue/loop-out), each device's VMOS switch passing power to the next. C_Address is assigned incrementally starting from 1.

## Terminal Semantics

Based on existing code:
- `loop-out` = Baby blue (negative) = **Primary discovery direction**
- `loop-in` = Orange (positive) = **Fallback for break detection**

```
Loop Driver (Address 0)
    │
    ├───[LOOP-OUT (baby blue)]──► Device 1 ──► Device 2 ──► Device 3 ──┐
    │                            (addr=1)     (addr=2)     (addr=3)    │
    │                                                                  │
    └───[LOOP-IN (orange)] ◄──────────────────────────────────────────┘
```

## Key Behaviors

1. **Before Power On**: No devices shown in loop driver card (not yet discovered)
2. **On Power On**: 
   - Traverse from LOOP-OUT terminal following wires
   - Assign C_Address 1, 2, 3... to each device in order
   - If wire broken (no more devices reachable), continue from LOOP-IN side
3. **C_Address Reset**: Addresses are re-assigned on every power cycle

## Data Model

### DiscoveredDevice Interface
```typescript
interface DiscoveredDevice {
    instanceId: string;           // Reference to PlacedDevice
    cAddress: number;             // Assigned communication address (1-255)
    discoveredFrom: 'out' | 'in'; // Which direction discovered
    label: string;
    typeId: string;
    sn: number;
}
```

## Discovery Algorithm

```
function discoverLoopDevices(loopDriverId, connections, placedDevices):
    discovered = []
    addressCounter = 1
    
    # Phase 1: Discover from LOOP-OUT (baby blue)
    outDevices = traverseFromTerminal(loopDriverId, 'loop-out', connections, placedDevices)
    for device in outDevices:
        discovered.push({ ...device, cAddress: addressCounter++, discoveredFrom: 'out' })
    
    # Phase 2: Discover from LOOP-IN (orange) 
    # (handles break scenario - finds devices on the other side of break)
    inDevices = traverseFromTerminal(loopDriverId, 'loop-in', connections, placedDevices)
    for device in reverse(inDevices):  # Reverse because coming from other end
        if not already discovered:
            discovered.push({ ...device, cAddress: addressCounter++, discoveredFrom: 'in' })
    
    return discovered
```

## UI Display

When printed on shows discovered devices with assigned addresses:

| Device | C_Addr | Serial Number |
|--------|--------|---------------|
| AG socket | 001 | 00AB12CD34EF |
| AG socket | 002 | 00CD34EF56AB |
