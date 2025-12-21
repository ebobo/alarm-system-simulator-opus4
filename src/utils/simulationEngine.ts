// Simulation Engine - Cause & Effect rule evaluation
// Evaluates which alarm zones should be triggered based on activated devices

import type { FAConfig, FAConfigDetectionZone } from '../types/faconfig';
import type { PlacedDevice } from '../types/devices';

/**
 * Find the detection zone(s) that contain a device with the given address
 */
export function findDeviceDetectionZones(
    config: FAConfig,
    deviceAddress: string
): FAConfigDetectionZone[] {
    return config.zones.detection.filter(zone =>
        zone.devices.includes(deviceAddress)
    );
}

/**
 * Check if a detection zone is triggered based on activated devices and logic
 * 
 * @param config The loaded FAConfig
 * @param zoneUuid Detection zone UUID to check
 * @param activatedAddresses Set of activated device addresses
 * @param logic 'OR' = any device triggers, 'AND' = all devices must be active
 */
export function isZoneTriggered(
    config: FAConfig,
    zoneUuid: string,
    activatedAddresses: Set<string>,
    logic: 'OR' | 'AND'
): boolean {
    const zone = config.zones.detection.find(z => z.uuid === zoneUuid);
    if (!zone || zone.devices.length === 0) return false;

    // Get only detector/MCP devices from the zone (not sounders)
    const triggerDevices = zone.devices.filter(addr => {
        const device = config.devices.find(d => d.address === addr);
        return device && (device.type === 'detector' || device.type === 'mcp');
    });

    if (triggerDevices.length === 0) return false;

    if (logic === 'OR') {
        // Any device in the zone being active triggers it
        return triggerDevices.some(addr => activatedAddresses.has(addr));
    } else {
        // AND logic: ALL trigger devices must be active
        return triggerDevices.every(addr => activatedAddresses.has(addr));
    }
}

/**
 * Get all alarm zone UUIDs that should be triggered based on C&E rules
 */
export function getTriggeredAlarmZoneUuids(
    config: FAConfig,
    activatedAddresses: Set<string>
): Set<string> {
    const triggeredAlarmZones = new Set<string>();

    for (const rule of config.causeEffect) {
        if (isZoneTriggered(config, rule.inputZone, activatedAddresses, rule.logic)) {
            triggeredAlarmZones.add(rule.outputZone);
        }
    }

    return triggeredAlarmZones;
}

/**
 * Get all sounder device addresses from an alarm zone
 */
export function getAlarmZoneSounders(
    config: FAConfig,
    alarmZoneUuid: string
): string[] {
    const zone = config.zones.alarm.find(z => z.uuid === alarmZoneUuid);
    if (!zone) return [];

    // Filter to only sounder devices
    return zone.devices.filter(addr => {
        const device = config.devices.find(d => d.address === addr);
        return device && device.type === 'sounder';
    });
}

/**
 * Map device addresses to placed device instance IDs
 */
export function mapAddressesToInstanceIds(
    placedDevices: PlacedDevice[],
    addresses: string[]
): string[] {
    const instanceIds: string[] = [];

    for (const addr of addresses) {
        // Device label matches config address
        const device = placedDevices.find(d => d.label === addr);
        if (device) {
            instanceIds.push(device.instanceId);
        }
    }

    return instanceIds;
}

/**
 * Get activated device addresses from instance IDs
 */
export function getActivatedAddresses(
    placedDevices: PlacedDevice[],
    activatedDeviceIds: Set<string>
): Set<string> {
    const addresses = new Set<string>();

    for (const instanceId of activatedDeviceIds) {
        const device = placedDevices.find(d => d.instanceId === instanceId);
        if (device && device.label) {
            addresses.add(device.label);
        }
    }

    return addresses;
}

/**
 * Main function: Compute all sounder instance IDs that should be activated
 * based on the current set of activated detectors/MCPs
 */
export function computeActivatedSounders(
    config: FAConfig | null,
    placedDevices: PlacedDevice[],
    activatedDeviceIds: Set<string>
): Set<string> {
    if (!config || activatedDeviceIds.size === 0) {
        return new Set();
    }

    // Step 1: Convert activated instance IDs to device addresses
    const activatedAddresses = new Set<string>();
    for (const instanceId of activatedDeviceIds) {
        const device = placedDevices.find(d => d.instanceId === instanceId);
        if (device && device.label) {
            activatedAddresses.add(device.label);
        }
    }

    // Step 2: Get triggered alarm zones
    const triggeredAlarmZones = getTriggeredAlarmZoneUuids(config, activatedAddresses);

    // Step 3: Collect all sounder addresses from triggered alarm zones
    const sounderAddresses: string[] = [];
    for (const alarmZoneUuid of triggeredAlarmZones) {
        const zoneSounders = getAlarmZoneSounders(config, alarmZoneUuid);
        sounderAddresses.push(...zoneSounders);
    }

    // Step 4: Map addresses to instance IDs
    const sounderInstanceIds = mapAddressesToInstanceIds(placedDevices, sounderAddresses);

    return new Set(sounderInstanceIds);
}
