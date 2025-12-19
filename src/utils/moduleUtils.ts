// Module detection utilities
// Derives panel modules from placed devices and connections

import type { PlacedDevice, Connection } from '../types/devices';
import type { PanelModule, ModuleStatus, ConnectedDeviceInfo } from '../types/modules';
import { discoverLoopDevices } from './loopDiscovery';

/**
 * Get default modules that come with a panel (Controller + Power Supply)
 */
export function getDefaultPanelModules(): PanelModule[] {
    return [
        {
            id: 'ctrl-1',
            type: 'controller',
            slotPosition: 1,
            status: 'online',
            label: 'Controller'
        },
        {
            id: 'psu-1',
            type: 'power-supply',
            slotPosition: 2,
            status: 'online',
            label: 'Power Supply'
        }
    ];
}

/**
 * Check if a loop driver is connected to the panel via wire
 */
export function isLoopDriverConnectedToPanel(
    loopDriverId: string,
    panelId: string,
    connections: Connection[]
): boolean {
    return connections.some(conn =>
        (conn.fromDeviceId === panelId && conn.toDeviceId === loopDriverId) ||
        (conn.toDeviceId === panelId && conn.fromDeviceId === loopDriverId)
    );
}

/**
 * Count devices connected to a loop driver (for display before power on)
 * Uses simple BFS without address assignment
 */
function countConnectedLoopDevices(
    loopDriverId: string,
    panelId: string | undefined,
    connections: Connection[],
    placedDevices: PlacedDevice[]
): number {
    const visited = new Set<string>();
    const queue: string[] = [loopDriverId];

    // Build adjacency list for fast lookup
    const adjacency = new Map<string, string[]>();
    for (const conn of connections) {
        if (!adjacency.has(conn.fromDeviceId)) {
            adjacency.set(conn.fromDeviceId, []);
        }
        if (!adjacency.has(conn.toDeviceId)) {
            adjacency.set(conn.toDeviceId, []);
        }
        adjacency.get(conn.fromDeviceId)!.push(conn.toDeviceId);
        adjacency.get(conn.toDeviceId)!.push(conn.fromDeviceId);
    }

    let count = 0;

    // BFS from loop driver
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        // Get all neighbors
        const neighbors = adjacency.get(currentId) || [];
        for (const neighborId of neighbors) {
            if (visited.has(neighborId)) continue;

            // Skip panel - don't traverse through panel
            if (neighborId === panelId) continue;

            // Find the device
            const device = placedDevices.find(d => d.instanceId === neighborId);
            if (device) {
                // Only count loop devices (not loop driver itself)
                if (device.typeId !== 'loop-driver' && device.typeId !== 'panel') {
                    count++;
                }
                // Continue traversal through this device
                queue.push(neighborId);
            }
        }
    }

    return count;
}

/**
 * Derive all panel modules from the current floor plan state
 * 
 * Logic:
 * - If panel is placed: Controller + Power Supply modules are added
 * - For each loop driver: Add Loop Driver module
 *   - Status is 'online' if connected to panel, 'offline' otherwise
 *   - If isPoweredOn: Shows discovered devices with assigned C_Address
 *   - If not powered on: Shows device count only (not discovered yet)
 * 
 * @param placedDevices All placed devices on the floor plan
 * @param connections All wire connections
 * @param isPoweredOn Whether the loop is powered on (for discovery)
 */
export function deriveModulesFromFloorPlan(
    placedDevices: PlacedDevice[],
    connections: Connection[],
    isPoweredOn: boolean = false
): PanelModule[] {
    const modules: PanelModule[] = [];

    // Find panel device
    const panel = placedDevices.find(d => d.typeId === 'panel');

    // No panel = no modules
    if (!panel) {
        return modules;
    }

    // Panel exists: add default modules
    modules.push(...getDefaultPanelModules());

    // Find all loop drivers
    const loopDrivers = placedDevices.filter(d => d.typeId === 'loop-driver');

    // Add loop driver modules
    loopDrivers.forEach((ld, idx) => {
        const isConnected = isLoopDriverConnectedToPanel(
            ld.instanceId,
            panel.instanceId,
            connections
        );

        const status: ModuleStatus = isConnected ? 'online' : 'offline';

        // Only discover devices and assign addresses when powered on
        let connectedDevices: ConnectedDeviceInfo[] | undefined;
        let connectedDeviceCount: number;

        if (isPoweredOn && isConnected) {
            // Power on: run discovery algorithm with C_Address assignment
            const discovered = discoverLoopDevices(ld.instanceId, connections, placedDevices);
            connectedDevices = discovered.map(d => ({
                instanceId: d.instanceId,
                label: d.label,
                typeId: d.typeId,
                sn: d.sn,
                cAddress: d.cAddress,
                discoveredFrom: d.discoveredFrom
            }));
            connectedDeviceCount = discovered.length;
        } else {
            // Not powered on: just count wired devices (not yet discovered)
            connectedDeviceCount = countConnectedLoopDevices(
                ld.instanceId,
                panel.instanceId,
                connections,
                placedDevices
            );
            connectedDevices = undefined;  // No discovery data until power on
        }

        modules.push({
            id: `ld-${idx + 1}`,
            type: 'loop-driver',
            slotPosition: 3 + idx,  // Slots 3+ for loop drivers
            status,
            label: ld.label || `Loop Driver ${idx + 1}`,
            connectedDeviceCount,
            connectedDevices,
            ipAddress: ld.ipAddress
        });
    });

    return modules;
}
