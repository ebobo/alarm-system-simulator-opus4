// .faconfig file parser and validator
import type { FAConfig, FAConfigDevice } from '../types/faconfig';
import type { PlacedDevice } from '../types/devices';

export type ParseResult =
    | { success: true; config: FAConfig }
    | { success: false; error: string };

/**
 * Parse and validate a .faconfig JSON string
 */
export function parseFAConfig(jsonString: string): ParseResult {
    try {
        const parsed = JSON.parse(jsonString);

        // Validate required fields
        const validation = validateFAConfig(parsed);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        return { success: true, config: parsed as FAConfig };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Invalid JSON format'
        };
    }
}

/**
 * Validate that an object matches the FAConfig schema (UUID-based format)
 */
export function validateFAConfig(obj: unknown): { valid: true } | { valid: false; error: string } {
    if (!obj || typeof obj !== 'object') {
        return { valid: false, error: 'Configuration must be an object' };
    }

    const config = obj as Record<string, unknown>;

    // Check required fields
    if (typeof config.version !== 'string') {
        return { valid: false, error: 'Missing or invalid "version" field' };
    }

    if (typeof config.projectName !== 'string') {
        return { valid: false, error: 'Missing or invalid "projectName" field' };
    }

    if (typeof config.createdAt !== 'string') {
        return { valid: false, error: 'Missing or invalid "createdAt" field' };
    }

    if (!Array.isArray(config.devices)) {
        return { valid: false, error: 'Missing or invalid "devices" array' };
    }

    // Validate each device
    for (let i = 0; i < config.devices.length; i++) {
        const device = config.devices[i] as unknown;
        const deviceValidation = validateDevice(device, i);
        if (!deviceValidation.valid) {
            return deviceValidation;
        }
    }

    // Validate zones
    if (!config.zones || typeof config.zones !== 'object') {
        return { valid: false, error: 'Missing or invalid "zones" object' };
    }

    const zones = config.zones as Record<string, unknown>;
    if (!Array.isArray(zones.detection)) {
        return { valid: false, error: 'Missing or invalid "zones.detection" array' };
    }
    if (!Array.isArray(zones.alarm)) {
        return { valid: false, error: 'Missing or invalid "zones.alarm" array' };
    }

    // Validate detection zones
    for (let i = 0; i < zones.detection.length; i++) {
        const zone = zones.detection[i] as Record<string, unknown>;
        if (typeof zone.uuid !== 'string') {
            return { valid: false, error: `Detection zone ${i}: missing "uuid"` };
        }
        if (!Array.isArray(zone.devices)) {
            return { valid: false, error: `Detection zone ${i}: missing "devices" array` };
        }
    }

    // Validate alarm zones
    for (let i = 0; i < zones.alarm.length; i++) {
        const zone = zones.alarm[i] as Record<string, unknown>;
        if (typeof zone.uuid !== 'string') {
            return { valid: false, error: `Alarm zone ${i}: missing "uuid"` };
        }
        if (!Array.isArray(zone.devices)) {
            return { valid: false, error: `Alarm zone ${i}: missing "devices" array` };
        }
    }

    // Validate causeEffect
    if (!Array.isArray(config.causeEffect)) {
        return { valid: false, error: 'Missing or invalid "causeEffect" array' };
    }

    // Validate each C&E rule
    for (let i = 0; i < config.causeEffect.length; i++) {
        const rule = config.causeEffect[i] as Record<string, unknown>;
        if (typeof rule.inputZone !== 'string') {
            return { valid: false, error: `C&E rule ${i}: missing "inputZone" UUID` };
        }
        if (typeof rule.outputZone !== 'string') {
            return { valid: false, error: `C&E rule ${i}: missing "outputZone" UUID` };
        }
    }

    return { valid: true };
}

/**
 * Validate a single device entry (UUID-based format)
 */
function validateDevice(device: unknown, index: number): { valid: true } | { valid: false; error: string } {
    if (!device || typeof device !== 'object') {
        return { valid: false, error: `Device at index ${index} is not an object` };
    }

    const d = device as Record<string, unknown>;

    if (typeof d.uuid !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "uuid"` };
    }

    if (typeof d.address !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "address"` };
    }

    const validTypes = ['detector', 'mcp', 'sounder'];
    if (!validTypes.includes(d.type as string)) {
        return { valid: false, error: `Device ${index}: invalid type "${d.type}". Must be one of: ${validTypes.join(', ')}` };
    }

    if (typeof d.location !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "location"` };
    }

    return { valid: true };
}

/**
 * Get summary statistics from a config
 */
export function getConfigSummary(config: FAConfig): {
    totalDevices: number;
    detectors: number;
    mcps: number;
    sounders: number;
    detectionZones: number;
    alarmZones: number;
    ceRules: number;
} {
    const devices = config.devices;
    return {
        totalDevices: devices.length,
        detectors: devices.filter(d => d.type === 'detector').length,
        mcps: devices.filter(d => d.type === 'mcp').length,
        sounders: devices.filter(d => d.type === 'sounder').length,
        detectionZones: config.zones.detection.length,
        alarmZones: config.zones.alarm.length,
        ceRules: config.causeEffect.length,
    };
}

/**
 * Build a lookup map from device address to device
 */
export function buildDeviceAddressMap(config: FAConfig): Map<string, FAConfigDevice> {
    const map = new Map<string, FAConfigDevice>();
    for (const device of config.devices) {
        map.set(device.address, device);
    }
    return map;
}

/**
 * Result of device matching validation
 */
export interface DeviceMatchResult {
    valid: boolean;
    matched: string[];              // Device addresses that match (address + type)
    missing: string[];              // Config devices not found in placed devices
    extra: string[];                // Placed devices not in config
    typeMismatch: string[];         // Devices where address matches but type doesn't
    placedTypes: Map<string, string>; // Map of address to actual placed device typeId
}

/**
 * Map placed device typeId to config device type
 * Note: AG-socket (socket) is NOT the same as detector (socket + head)
 * The config type must match exactly with the placed device typeId
 */
function mapDeviceTypeIdToConfigType(typeId: string): string {
    // Return the typeId as-is - no mapping needed
    // Config should use the same type names: AG-socket, mcp, sounder, etc.
    return typeId;
}

/**
 * Validate that placed devices match the config
 * Devices are matched by address (the loop label like "A.001.001") AND type
 */
export function validateDeviceMatch(
    config: FAConfig,
    placedDevices: PlacedDevice[]
): DeviceMatchResult {
    // Build a map of config devices by address
    const configDeviceMap = new Map<string, FAConfigDevice>();
    for (const device of config.devices) {
        configDeviceMap.set(device.address, device);
    }

    // Build a map of placed devices by address (label)
    const placedDeviceMap = new Map<string, PlacedDevice>();
    for (const device of placedDevices) {
        // Skip non-loop devices (panel, loop-driver)
        if (device.typeId === 'panel' || device.typeId === 'loop-driver') {
            continue;
        }
        // Use the device's label if it looks like an address
        if (device.label && /^[A-Z]\.\d{3}\.\d{3}$/.test(device.label)) {
            placedDeviceMap.set(device.label, device);
        }
    }

    const matched: string[] = [];
    const missing: string[] = [];
    const extra: string[] = [];
    const typeMismatch: string[] = [];
    const placedTypes = new Map<string, string>();

    // Check each config device
    for (const [addr, configDevice] of configDeviceMap) {
        const placedDevice = placedDeviceMap.get(addr);
        if (!placedDevice) {
            // Device address not found in placed devices
            missing.push(addr);
        } else {
            // Store the placed device typeId
            const placedType = mapDeviceTypeIdToConfigType(placedDevice.typeId);
            placedTypes.set(addr, placedType);

            // Check if type matches
            if (placedType === configDevice.type) {
                matched.push(addr);
            } else {
                // Address matches but type doesn't
                typeMismatch.push(addr);
            }
        }
    }

    // Find extra devices (placed but not in config)
    for (const [addr, device] of placedDeviceMap) {
        if (!configDeviceMap.has(addr)) {
            extra.push(addr);
            placedTypes.set(addr, device.typeId);
        }
    }

    return {
        valid: missing.length === 0 && typeMismatch.length === 0,
        matched,
        missing,
        extra,
        typeMismatch,
        placedTypes
    };
}

/**
 * Get device addresses for a zone UUID
 */
export function getZoneDeviceAddresses(config: FAConfig, zoneUuid: string): string[] {
    // Check detection zones
    for (const zone of config.zones.detection) {
        if (zone.uuid === zoneUuid) {
            return zone.devices;
        }
    }
    // Check alarm zones
    for (const zone of config.zones.alarm) {
        if (zone.uuid === zoneUuid) {
            return zone.devices;
        }
    }
    return [];
}

/**
 * Get all output device addresses for a given input device address
 * Based on C&E rules: find which DZ the device belongs to, then find linked AZ devices
 */
export function getOutputDevicesForInput(config: FAConfig, inputAddress: string): string[] {
    const outputs = new Set<string>();

    // Find which detection zone contains this device
    for (const dz of config.zones.detection) {
        if (dz.devices.includes(inputAddress)) {
            // Find C&E rules that use this DZ as input
            for (const rule of config.causeEffect) {
                if (rule.inputZone === dz.uuid) {
                    // Get all devices in the output zone
                    const outputDevices = getZoneDeviceAddresses(config, rule.outputZone);
                    outputDevices.forEach(addr => outputs.add(addr));
                }
            }
        }
    }

    return Array.from(outputs);
}
