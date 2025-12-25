/**
 * Loop Discovery Utility
 * Simulates real fire alarm loop discovery behavior when powered on.
 * Devices are discovered from the loop driver's LOOP-OUT terminal first,
 * then from LOOP-IN for break detection.
 */

import type { PlacedDevice, Connection, AGHeadFeature } from '../types/devices';

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
    features?: AGHeadFeature[];   // Features from AG Head (when mounted)
}

/**
 * Traverse from a specific terminal of the loop driver, discovering devices in order.
 * Uses DFS to discover ALL connected devices including branch/spur connections.
 * Returns devices in the order they are discovered.
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

    /**
     * DFS traversal from a device, exploring all connected terminals
     * @param deviceId Current device being explored
     * @param entryTerminal The terminal we entered through (null for starting device)
     */
    function dfs(deviceId: string, entryTerminal: string | null) {
        // Find ALL connections from this device (except the entry terminal we came from)
        const exitConnections = connections.filter(c => {
            // Check if connection is from this device
            const isFromDevice = c.fromDeviceId === deviceId;
            const isToDevice = c.toDeviceId === deviceId;

            if (!isFromDevice && !isToDevice) return false;

            // Skip the terminal we entered through
            const terminalOnThisDevice = isFromDevice ? c.fromTerminalId : c.toTerminalId;
            if (terminalOnThisDevice === entryTerminal) return false;

            // Get the next device ID
            const nextId = isFromDevice ? c.toDeviceId : c.fromDeviceId;

            // Skip if already visited or already discovered from other direction
            return !visited.has(nextId) && !alreadyDiscovered.has(nextId);
        });

        // Visit each connected device (explores all branches)
        for (const conn of exitConnections) {
            const nextId = conn.fromDeviceId === deviceId ? conn.toDeviceId : conn.fromDeviceId;
            const nextDevice = placedDevices.find(d => d.instanceId === nextId);

            // Skip if device not found
            if (!nextDevice) continue;

            // Don't traverse through other loop drivers or panels
            if (nextDevice.typeId === 'loop-driver' || nextDevice.typeId === 'panel') continue;

            // Mark as visited and add to discovered list
            visited.add(nextId);
            discovered.push(nextDevice);

            // Get the terminal we're entering the next device through
            const nextEntryTerminal = conn.fromDeviceId === deviceId
                ? conn.toTerminalId
                : conn.fromTerminalId;

            // Recursively explore all branches from this device
            dfs(nextId, nextEntryTerminal);
        }
    }

    // Find the initial connection from the loop driver's starting terminal
    const initialConnection = connections.find(c =>
        (c.fromDeviceId === loopDriverId && c.fromTerminalId === startTerminal) ||
        (c.toDeviceId === loopDriverId && c.toTerminalId === startTerminal)
    );

    if (initialConnection) {
        // Start DFS from the first connected device
        const firstDeviceId = initialConnection.fromDeviceId === loopDriverId
            ? initialConnection.toDeviceId
            : initialConnection.fromDeviceId;

        const firstDevice = placedDevices.find(d => d.instanceId === firstDeviceId);

        if (firstDevice && firstDevice.typeId !== 'loop-driver' && firstDevice.typeId !== 'panel') {
            visited.add(firstDeviceId);
            discovered.push(firstDevice);

            // Get entry terminal for first device
            const firstEntryTerminal = initialConnection.fromDeviceId === loopDriverId
                ? initialConnection.toTerminalId
                : initialConnection.fromTerminalId;

            // Start DFS exploration
            dfs(firstDeviceId, firstEntryTerminal);
        }
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
            sn: reportDevice.sn,
            features: device.typeId === 'AG-socket' && device.mountedDetectorId ? reportDevice.features : undefined
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
                sn: reportDevice.sn,
                features: device.typeId === 'AG-socket' && device.mountedDetectorId ? reportDevice.features : undefined
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
