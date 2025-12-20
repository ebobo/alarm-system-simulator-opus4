/**
 * Loop Discovery Utility
 * Simulates real fire alarm loop discovery behavior when powered on.
 * Devices are discovered from the loop driver's LOOP-OUT terminal first,
 * then from LOOP-IN for break detection.
 */

import type { PlacedDevice, Connection } from '../types/devices';

/**
 * Discovered device with assigned communication address
 */
export interface DiscoveredDevice {
    instanceId: string;           // Reference to PlacedDevice
    cAddress: number;             // Assigned communication address (1-255)
    discoveredFrom: 'out' | 'in'; // Which direction discovered
    label: string;
    typeId: string;
    sn: number;
}

/**
 * Traverse from a specific terminal of the loop driver, discovering devices in order.
 * Returns devices in the order they are connected (for loop-out) or 
 * reverse order (for loop-in, since we're coming from the other end).
 */
function traverseFromTerminal(
    loopDriverId: string,
    startTerminal: 'loop-out' | 'loop-in',
    connections: Connection[],
    placedDevices: PlacedDevice[],
    alreadyDiscovered: Set<string>
): PlacedDevice[] {
    const discovered: PlacedDevice[] = [];
    const visited = new Set<string>([loopDriverId]);

    // Find connection from loop driver's specified terminal
    let currentDeviceId = loopDriverId;
    let currentTerminal: string = startTerminal;  // Starts as loop-out/in, then can be any terminal

    // BFS/chain traversal from the starting terminal
    while (true) {
        // Find connection from current device's terminal
        const connection = connections.find(c =>
            (c.fromDeviceId === currentDeviceId && c.fromTerminalId === currentTerminal) ||
            (c.toDeviceId === currentDeviceId && c.toTerminalId === currentTerminal)
        );

        if (!connection) break;

        // Get the next device
        const nextDeviceId = connection.fromDeviceId === currentDeviceId
            ? connection.toDeviceId
            : connection.fromDeviceId;

        // Skip if already visited or already discovered from other direction
        if (visited.has(nextDeviceId) || alreadyDiscovered.has(nextDeviceId)) break;

        const nextDevice = placedDevices.find(d => d.instanceId === nextDeviceId);
        if (!nextDevice) break;

        // Don't traverse through other loop drivers or panels
        if (nextDevice.typeId === 'loop-driver' || nextDevice.typeId === 'panel') break;

        // Add to discovered list
        discovered.push(nextDevice);
        visited.add(nextDeviceId);

        // Find the exit terminal - the terminal that the connection came into
        const entryTerminal = connection.fromDeviceId === currentDeviceId
            ? connection.toTerminalId
            : connection.fromTerminalId;

        // Find connection exiting from a different terminal of this device
        const exitConnection = connections.find(c =>
            ((c.fromDeviceId === nextDeviceId && c.fromTerminalId !== entryTerminal) ||
                (c.toDeviceId === nextDeviceId && c.toTerminalId !== entryTerminal)) &&
            // Don't go back to already visited
            !visited.has(c.fromDeviceId === nextDeviceId ? c.toDeviceId : c.fromDeviceId)
        );

        if (!exitConnection) break;

        // Move to next device
        currentDeviceId = nextDeviceId;
        currentTerminal = exitConnection.fromDeviceId === nextDeviceId
            ? exitConnection.fromTerminalId
            : exitConnection.toTerminalId;
    }

    return discovered;
}

/**
 * Discover all devices connected to a loop driver.
 * Simulates the real discovery process:
 * 1. Start from LOOP-OUT (baby blue) terminal - this is the "negative" side
 * 2. Assign addresses 1, 2, 3... to each device found
 * 3. If loop is broken, try from LOOP-IN (orange) - the "positive" side
 * 4. Continue addressing from where phase 1 stopped
 * 
 * @param loopDriverId The loop driver device instance ID
 * @param connections All wire connections
 * @param placedDevices All placed devices
 * @returns Array of discovered devices with assigned addresses
 */
export function discoverLoopDevices(
    loopDriverId: string,
    connections: Connection[],
    placedDevices: PlacedDevice[]
): DiscoveredDevice[] {
    const discovered: DiscoveredDevice[] = [];
    let addressCounter = 1;
    const discoveredIds = new Set<string>();

    // Helper: Get the device to report for discovery
    // If device is an AG-socket with mounted detector, report the detector instead
    const getDeviceToReport = (device: PlacedDevice): PlacedDevice => {
        if (device.typeId === 'AG-socket' && device.mountedDetectorId) {
            const mountedDetector = placedDevices.find(d => d.instanceId === device.mountedDetectorId);
            if (mountedDetector) {
                return mountedDetector;
            }
        }
        return device;
    };

    // Phase 1: Discover from LOOP-OUT (baby blue / negative)
    const outDevices = traverseFromTerminal(
        loopDriverId,
        'loop-out',
        connections,
        placedDevices,
        discoveredIds
    );

    for (const device of outDevices) {
        const reportDevice = getDeviceToReport(device);
        // Use the original device's instanceId (socket for mounted detectors)
        // but report properties from the head/detector for display
        discovered.push({
            instanceId: device.instanceId,  // Always use socket ID for lookup
            cAddress: addressCounter++,
            discoveredFrom: 'out',
            label: reportDevice.label || device.label || reportDevice.deviceType,
            typeId: device.typeId === 'AG-socket' && device.mountedDetectorId ? 'AG-detector' : device.typeId,
            sn: reportDevice.sn
        });
        discoveredIds.add(device.instanceId); // Track original socket ID to avoid re-discovery
        if (reportDevice.instanceId !== device.instanceId) {
            discoveredIds.add(reportDevice.instanceId); // Also track detector ID
        }
    }

    // Phase 2: Discover from LOOP-IN (orange / positive)
    // This finds devices on the other side of a break
    const inDevices = traverseFromTerminal(
        loopDriverId,
        'loop-in',
        connections,
        placedDevices,
        discoveredIds
    );

    // Reverse the in-devices since we're coming from the other end
    // In a complete loop, these would have been discovered in phase 1
    // In a broken loop, these are the devices reachable from the other side
    for (const device of inDevices.reverse()) {
        if (!discoveredIds.has(device.instanceId)) {
            const reportDevice = getDeviceToReport(device);
            // Use the original device's instanceId (socket for mounted detectors)
            // but report properties from the head/detector for display
            discovered.push({
                instanceId: device.instanceId,  // Always use socket ID for lookup
                cAddress: addressCounter++,
                discoveredFrom: 'in',
                label: reportDevice.label || device.label || reportDevice.deviceType,
                typeId: device.typeId === 'AG-socket' && device.mountedDetectorId ? 'AG-detector' : device.typeId,
                sn: reportDevice.sn
            });
            discoveredIds.add(device.instanceId);
            if (reportDevice.instanceId !== device.instanceId) {
                discoveredIds.add(reportDevice.instanceId);
            }
        }
    }

    return discovered;
}

/**
 * Get all loop drivers and their discovered devices
 */
export function discoverAllLoops(
    placedDevices: PlacedDevice[],
    connections: Connection[]
): Map<string, DiscoveredDevice[]> {
    const result = new Map<string, DiscoveredDevice[]>();

    const loopDrivers = placedDevices.filter(d => d.typeId === 'loop-driver');

    for (const ld of loopDrivers) {
        const discovered = discoverLoopDevices(ld.instanceId, connections, placedDevices);
        result.set(ld.instanceId, discovered);
    }

    return result;
}
