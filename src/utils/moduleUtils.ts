// Module detection utilities
// Derives panel modules from placed devices and connections

import type { PlacedDevice, Connection } from '../types/devices';
import type { PanelModule, ModuleStatus, ConnectedDeviceInfo } from '../types/modules';

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
 * Count devices connected to a loop driver (for display before discovery)
 * Uses simple BFS without address assignment
 */
export function countConnectedLoopDevices(
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

        // Get all neighbors
        const neighbors = adjacency.get(currentId) || [];
        for (const neighborId of neighbors) {
            if (visited.has(neighborId)) continue;

            // Skip panel - don't traverse through panel
            if (neighborId === panelId) continue;

            // Mark as visited BEFORE adding to prevent duplicates from multiple connections
            visited.add(neighborId);

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
 * Discovered device info for external state
 */
export interface DiscoveredDeviceEntry {
    cAddress: number;
    discoveredFrom: 'out' | 'in';
}

/**
 * Derive all panel modules from the current floor plan state
 * 
 * Logic:
 * - If panel is placed: Controller + Power Supply modules are added
 * - For each loop driver: Add Loop Driver module
 *   - Status is 'online' if connected to panel, 'offline' otherwise
 *   - If discoveredDevices provided: Shows discovered devices with assigned C_Address
 *   - If not: Shows "Unknown" (discovery not yet run)
 * 
 * @param placedDevices All placed devices on the floor plan
 * @param connections All wire connections
 * @param discoveredDevices Map of instanceId -> discovery info (from Raise Loop click)
 */
export function deriveModulesFromFloorPlan(
    placedDevices: PlacedDevice[],
    connections: Connection[],
    discoveredDevices?: Map<string, DiscoveredDeviceEntry>
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

        // Use externally provided discovered devices if available
        let connectedDevices: ConnectedDeviceInfo[] | undefined;
        let connectedDeviceCount: number | undefined;

        if (discoveredDevices && discoveredDevices.size > 0) {
            // Discovery has been run - show only discovered devices
            // Filter to devices that belong to this loop driver's chain
            const allConnectedIds = getConnectedDeviceIds(ld.instanceId, panel.instanceId, connections, placedDevices);

            connectedDevices = [];
            for (const deviceId of allConnectedIds) {
                const discoveryInfo = discoveredDevices.get(deviceId);
                const device = placedDevices.find(d => d.instanceId === deviceId);
                if (device && discoveryInfo) {
                    // Determine the effective type - AG-socket with mounted head becomes AG-detector
                    let effectiveTypeId = device.typeId;
                    let headSn: number | undefined;

                    if (device.typeId === 'AG-socket' && device.mountedDetectorId) {
                        effectiveTypeId = 'AG-detector';
                        // Find the mounted head to get its SN
                        const mountedHead = placedDevices.find(d => d.instanceId === device.mountedDetectorId);
                        if (mountedHead) {
                            headSn = mountedHead.sn;
                        }
                    }

                    // Get label - prefer head's label for detectors, fall back to socket label
                    // Don't fall back to deviceType - let empty labels show as "-"
                    let displayLabel = device.label || '';
                    if (device.typeId === 'AG-socket' && device.mountedDetectorId) {
                        const mountedHead = placedDevices.find(d => d.instanceId === device.mountedDetectorId);
                        if (mountedHead?.label) {
                            displayLabel = mountedHead.label;
                        } else if (!displayLabel) {
                            displayLabel = ''; // Will show as "-" in UI
                        }
                    }

                    connectedDevices.push({
                        instanceId: device.instanceId,
                        label: displayLabel,
                        typeId: effectiveTypeId,
                        sn: device.sn,
                        headSn,
                        cAddress: discoveryInfo.cAddress,
                        discoveredFrom: discoveryInfo.discoveredFrom
                    });
                }
            }
            // Sort by cAddress
            connectedDevices.sort((a, b) => (a.cAddress ?? 999) - (b.cAddress ?? 999));
            connectedDeviceCount = connectedDevices.length;
        } else {
            // No discovery yet - show as Unknown
            connectedDevices = undefined;
            connectedDeviceCount = undefined;
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

/**
 * Get all device IDs connected to a loop driver (helper function)
 */
function getConnectedDeviceIds(
    loopDriverId: string,
    panelId: string,
    connections: Connection[],
    placedDevices: PlacedDevice[]
): string[] {
    const ids: string[] = [];
    const visited = new Set<string>();
    const queue: string[] = [loopDriverId];

    // Build adjacency list
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

    while (queue.length > 0) {
        const currentId = queue.shift()!;

        const neighbors = adjacency.get(currentId) || [];
        for (const neighborId of neighbors) {
            if (visited.has(neighborId)) continue;
            if (neighborId === panelId) continue;

            // Mark as visited BEFORE adding to prevent duplicates from multiple connections
            visited.add(neighborId);

            const device = placedDevices.find(d => d.instanceId === neighborId);
            if (device) {
                if (device.typeId !== 'loop-driver' && device.typeId !== 'panel') {
                    ids.push(device.instanceId);
                }
                queue.push(neighborId);
            }
        }
    }

    return ids;
}
