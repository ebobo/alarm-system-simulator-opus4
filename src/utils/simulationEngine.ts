// Simulation Engine - Cause & Effect rule evaluation
// Evaluates which alarm zones should be triggered based on activated devices
// v2.0: Function-based logic for multi-function devices

import type { FAConfig, FAConfigDetectionZone, FAConfigDevice, DeviceFunction } from '../types/faconfig';
import { isInputFunctionType, isOutputFunctionType } from '../types/faconfig';
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
 * Check if a device has any input functions that can trigger a zone
 */
function hasInputTriggerFunction(device: FAConfigDevice): boolean {
    return device.functions.some(fn =>
        fn.role === 'input' || isInputFunctionType(fn.type)
    );
}

/**
 * Check if a zone is triggered based on activated devices and logic
 * v2.0: Now uses function roles instead of device types
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

    // Get devices with input functions (detectors, MCPs, CO sensors)
    const triggerDevices = zone.devices.filter(addr => {
        const device = config.devices.find(d => d.address === addr);
        return device && hasInputTriggerFunction(device);
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
 * Get all output device addresses from an alarm zone
 * v2.0: Returns devices with any output function (sounders, beacons, voice)
 */
export function getAlarmZoneOutputDevices(
    config: FAConfig,
    alarmZoneUuid: string
): string[] {
    const zone = config.zones.alarm.find(z => z.uuid === alarmZoneUuid);
    if (!zone) return [];

    // Filter to devices with output functions
    return zone.devices.filter(addr => {
        const device = config.devices.find(d => d.address === addr);
        if (!device) return false;

        return device.functions.some(fn =>
            fn.role === 'output' || isOutputFunctionType(fn.type)
        );
    });
}

/**
 * Legacy alias for backward compatibility
 */
export function getAlarmZoneSounders(
    config: FAConfig,
    alarmZoneUuid: string
): string[] {
    return getAlarmZoneOutputDevices(config, alarmZoneUuid);
}

/**
 * Get all output functions from an alarm zone
 * Returns function details for each output device
 */
export function getAlarmZoneOutputFunctions(
    config: FAConfig,
    alarmZoneUuid: string
): { address: string; function: DeviceFunction }[] {
    const zone = config.zones.alarm.find(z => z.uuid === alarmZoneUuid);
    if (!zone) return [];

    const outputFunctions: { address: string; function: DeviceFunction }[] = [];

    for (const addr of zone.devices) {
        const device = config.devices.find(d => d.address === addr);
        if (!device) continue;

        for (const fn of device.functions) {
            if (fn.role === 'output' || isOutputFunctionType(fn.type)) {
                outputFunctions.push({ address: addr, function: fn });
            }
        }
    }

    return outputFunctions;
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
 * Main function: Compute all output device instance IDs that should be activated
 * based on the current set of activated detectors/MCPs
 * v2.0: Now handles all output types (sounders, beacons, voice)
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

    // Step 3: Collect all output device addresses from triggered alarm zones
    const outputAddresses: string[] = [];
    for (const alarmZoneUuid of triggeredAlarmZones) {
        const zoneOutputs = getAlarmZoneOutputDevices(config, alarmZoneUuid);
        outputAddresses.push(...zoneOutputs);
    }

    // Step 4: Map addresses to instance IDs
    const outputInstanceIds = mapAddressesToInstanceIds(placedDevices, outputAddresses);

    return new Set(outputInstanceIds);
}

/**
 * Alias for backward compatibility
 */
export const computeActivatedOutputs = computeActivatedSounders;
