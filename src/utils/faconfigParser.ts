// .faconfig file parser and validator
// Supports v1.0 (legacy) and v2.0 (multi-function) formats

import type { FAConfig, FAConfigDevice, DeviceFunction } from '../types/faconfig';
import { isInputFunctionType, isOutputFunctionType } from '../types/faconfig';
import type { PlacedDevice } from '../types/devices';

export type ParseResult =
    | { success: true; config: FAConfig }
    | { success: false; error: string };

/**
 * Parse and validate a .faconfig JSON string
 * Automatically migrates v1.0 format to v2.0
 */
export function parseFAConfig(jsonString: string): ParseResult {
    try {
        const parsed = JSON.parse(jsonString);

        // Validate required fields
        const validation = validateFAConfig(parsed);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Migrate v1.0 format if needed
        const config = migrateToV2(parsed);

        return { success: true, config };
    } catch (e) {
        return {
            success: false,
            error: e instanceof Error ? e.message : 'Invalid JSON format'
        };
    }
}

/**
 * Migrate v1.0 format to v2.0
 * - Rename 'uuid' to 'primaryUuid' for devices
 * - Add functions array if missing
 */
function migrateToV2(parsed: Record<string, unknown>): FAConfig {
    const version = parsed.version as string;
    const devices = parsed.devices as Record<string, unknown>[];

    // Migrate devices
    const migratedDevices: FAConfigDevice[] = devices.map(d => {
        // Handle uuid -> primaryUuid migration
        const primaryUuid = (d.primaryUuid as string) || (d.uuid as string) || '';
        const deviceType = d.type as string;

        // Create functions array if missing
        let functions = d.functions as DeviceFunction[] | undefined;
        if (!functions || functions.length === 0) {
            // Generate default function based on device type
            functions = createDefaultFunctions(primaryUuid, deviceType);
        }

        return {
            address: d.address as string,
            primaryUuid,
            type: deviceType,
            subType: d.subType as string | undefined,
            location: d.location as string,
            label: d.label as string | undefined,
            functions,
        };
    });

    return {
        version: version === '1.0' ? '2.0' : version, // Upgrade version
        projectName: parsed.projectName as string,
        createdAt: parsed.createdAt as string,
        devices: migratedDevices,
        zones: parsed.zones as FAConfig['zones'],
        causeEffect: parsed.causeEffect as FAConfig['causeEffect'],
    };
}

/**
 * Create default functions array based on device type (for v1.0 migration)
 */
function createDefaultFunctions(uuid: string, deviceType: string): DeviceFunction[] {
    const type = deviceType.toLowerCase();

    if (type === 'detector') {
        return [{ uuid, type: 'detector', role: 'input' }];
    } else if (type === 'mcp') {
        return [{ uuid, type: 'mcp', role: 'input' }];
    } else if (type === 'sounder') {
        return [{ uuid, type: 'sounder', role: 'output' }];
    }

    // Unknown type - default to detector
    return [{ uuid, type: 'detector', role: 'input' }];
}

/**
 * Validate that an object matches the FAConfig schema
 * Supports both v1.0 and v2.0 formats
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
 * Validate a single device entry (supports both v1.0 and v2.0)
 */
function validateDevice(device: unknown, index: number): { valid: true } | { valid: false; error: string } {
    if (!device || typeof device !== 'object') {
        return { valid: false, error: `Device at index ${index} is not an object` };
    }

    const d = device as Record<string, unknown>;

    // Accept either 'uuid' (v1.0) or 'primaryUuid' (v2.0)
    if (typeof d.uuid !== 'string' && typeof d.primaryUuid !== 'string') {
        return { valid: false, error: `Device ${index}: missing "uuid" or "primaryUuid"` };
    }

    if (typeof d.address !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "address"` };
    }

    if (typeof d.type !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "type"` };
    }

    if (typeof d.location !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "location"` };
    }

    // Validate functions array if present (v2.0)
    if (d.functions !== undefined) {
        if (!Array.isArray(d.functions)) {
            return { valid: false, error: `Device ${index}: "functions" must be an array` };
        }
        for (let i = 0; i < d.functions.length; i++) {
            const fn = d.functions[i] as Record<string, unknown>;
            if (typeof fn.uuid !== 'string') {
                return { valid: false, error: `Device ${index}, function ${i}: missing "uuid"` };
            }
            if (typeof fn.type !== 'string') {
                return { valid: false, error: `Device ${index}, function ${i}: missing "type"` };
            }
            if (fn.role !== 'input' && fn.role !== 'output') {
                return { valid: false, error: `Device ${index}, function ${i}: "role" must be "input" or "output"` };
            }
        }
    }

    return { valid: true };
}

/**
 * Get summary statistics from a config (v2.0 aware)
 * Counts physical devices by their primary type, not by individual functions
 * Also counts additional features on detectors
 */
export function getConfigSummary(config: FAConfig): {
    totalDevices: number;
    totalFunctions: number;
    detectors: number;
    mcps: number;
    sounders: number;
    beacons: number;
    coSensors: number;
    voice: number;
    detectionZones: number;
    alarmZones: number;
    ceRules: number;
    // Feature counts for detectors
    detectorsWithSounder: number;
    detectorsWithBeacon: number;
    detectorsWithCO: number;
    detectorsWithVoice: number;
} {
    const devices = config.devices;

    // Count physical devices by their primary type
    let detectors = 0;
    let mcps = 0;
    let sounders = 0;
    let beacons = 0;
    let coSensors = 0;
    let voice = 0;
    let totalFunctions = 0;

    // Feature counts for detectors
    let detectorsWithSounder = 0;
    let detectorsWithBeacon = 0;
    let detectorsWithCO = 0;
    let detectorsWithVoice = 0;

    for (const device of devices) {
        // Count total functions (for reference)
        totalFunctions += device.functions.length;

        // Count by primary device type (not by functions)
        const type = device.type.toLowerCase();
        switch (type) {
            case 'detector':
                detectors++;
                // Count additional features for this detector
                for (const fn of device.functions) {
                    switch (fn.type) {
                        case 'sounder': detectorsWithSounder++; break;
                        case 'beacon-red':
                        case 'beacon-white': detectorsWithBeacon++; break;
                        case 'co-sensor': detectorsWithCO++; break;
                        case 'voice': detectorsWithVoice++; break;
                    }
                }
                break;
            case 'mcp': mcps++; break;
            case 'sounder': sounders++; break;
            case 'beacon':
            case 'beacon-red':
            case 'beacon-white': beacons++; break;
            case 'co-sensor': coSensors++; break;
            case 'voice': voice++; break;
        }
    }

    return {
        totalDevices: devices.length,
        totalFunctions,
        detectors,
        mcps,
        sounders,
        beacons,
        coSensors,
        voice,
        detectionZones: config.zones.detection.length,
        alarmZones: config.zones.alarm.length,
        ceRules: config.causeEffect.length,
        detectorsWithSounder,
        detectorsWithBeacon,
        detectorsWithCO,
        detectorsWithVoice,
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
 * Get all input functions from devices in a list of addresses
 */
export function getInputFunctionsForAddresses(config: FAConfig, addresses: string[]): DeviceFunction[] {
    const functions: DeviceFunction[] = [];

    for (const addr of addresses) {
        const device = config.devices.find(d => d.address === addr);
        if (device) {
            for (const fn of device.functions) {
                if (fn.role === 'input' || isInputFunctionType(fn.type)) {
                    functions.push(fn);
                }
            }
        }
    }

    return functions;
}

/**
 * Get all output functions from devices in a list of addresses
 */
export function getOutputFunctionsForAddresses(config: FAConfig, addresses: string[]): DeviceFunction[] {
    const functions: DeviceFunction[] = [];

    for (const addr of addresses) {
        const device = config.devices.find(d => d.address === addr);
        if (device) {
            for (const fn of device.functions) {
                if (fn.role === 'output' || isOutputFunctionType(fn.type)) {
                    functions.push(fn);
                }
            }
        }
    }

    return functions;
}

/**
 * Check if a device has any input functions
 */
export function hasInputFunction(device: FAConfigDevice): boolean {
    return device.functions.some(fn => fn.role === 'input' || isInputFunctionType(fn.type));
}

/**
 * Check if a device has any output functions
 */
export function hasOutputFunction(device: FAConfigDevice): boolean {
    return device.functions.some(fn => fn.role === 'output' || isOutputFunctionType(fn.type));
}

/**
 * Result of device matching validation
 */
export interface DeviceMatchResult {
    valid: boolean;
    matched: string[];              // Device addresses that match (address + type + features)
    missing: string[];              // Config devices not found in placed devices
    extra: string[];                // Placed devices not in config
    typeMismatch: string[];         // Devices where address matches but type doesn't
    featureMismatch: string[];      // Devices where type matches but features don't
    placedTypes: Map<string, string>; // Map of address to actual placed device typeId
    featureDetails: Map<string, { required: string[]; actual: string[] }>; // Feature comparison per device
}

/**
 * Map placed device typeId to config device type
 * Note: AG-socket (socket only) does NOT match 'detector' in config
 * AG-detector (socket + head) DOES match 'detector' in config
 */
function mapDeviceTypeIdToConfigType(typeId: string): string {
    switch (typeId) {
        case 'AG-detector':
            return 'detector';
        case 'AG-socket':
            return 'AG-socket'; // Standalone socket doesn't match anything
        default:
            return typeId; // mcp, sounder, etc. match directly
    }
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
    // Also include the mounted head for feature matching
    const placedDeviceMap = new Map<string, { socket: PlacedDevice; head?: PlacedDevice }>();

    // First pass: Index sockets
    for (const device of placedDevices) {
        if (device.typeId === 'panel' || device.typeId === 'loop-driver' || device.typeId === 'AG-head') {
            continue;
        }
        if (device.label && /^[A-Z]\.\d{3}\.\d{3}$/.test(device.label)) {
            placedDeviceMap.set(device.label, { socket: device });
        }
    }

    // Second pass: Associate heads (either by finding socket or updating map)
    for (const device of placedDevices) {
        if (device.typeId !== 'AG-head') continue;

        // Try to finding by label first (if label matches socket)
        if (device.label && placedDeviceMap.has(device.label)) {
            const entry = placedDeviceMap.get(device.label)!;
            // Verify this head belongs to this socket
            if (entry.socket.mountedDetectorId === device.instanceId) {
                entry.head = device;
                continue;
            }
        }

        // Fallback: find parent socket if label mismatch or not found
        const parentSocket = placedDevices.find(d =>
            d.typeId === 'AG-socket' && d.mountedDetectorId === device.instanceId
        );

        if (parentSocket && parentSocket.label) {
            // Update existing entry or create new if socket wasn't indexed (unlikely if loop valid)
            const entry = placedDeviceMap.get(parentSocket.label) || { socket: parentSocket };
            entry.head = device;
            placedDeviceMap.set(parentSocket.label, entry);
        }
    }

    const matched: string[] = [];
    const missing: string[] = [];
    const extra: string[] = [];
    const typeMismatch: string[] = [];
    const featureMismatch: string[] = [];
    const placedTypes = new Map<string, string>();
    const featureDetails = new Map<string, { required: string[]; actual: string[] }>();

    // Helper: Map config function type to PlacedDevice feature name
    const mapFunctionToFeature = (fnType: string): string | null => {
        switch (fnType) {
            case 'sounder': return 'Sounder';
            case 'beacon-red': return 'BeaconR';
            case 'beacon-white': return 'BeaconW';
            case 'co-sensor': return 'CO';
            case 'voice': return 'Voice';
            default: return null;
        }
    };

    // Helper: Get required features from config device functions
    const getRequiredFeatures = (configDevice: FAConfigDevice): string[] => {
        const features: string[] = [];
        for (const fn of configDevice.functions) {
            const feature = mapFunctionToFeature(fn.type);
            if (feature) features.push(feature);
        }
        return features.sort();
    };

    // Check each config device
    for (const [addr, configDevice] of configDeviceMap) {
        const placedEntry = placedDeviceMap.get(addr);
        if (!placedEntry) {
            missing.push(addr);
        } else {
            const placedDevice = placedEntry.socket;
            const mountedHead = placedEntry.head;

            let effectiveTypeId = placedDevice.typeId;
            if (placedDevice.typeId === 'AG-socket' && placedDevice.mountedDetectorId) {
                effectiveTypeId = 'AG-detector';
            }

            const placedType = mapDeviceTypeIdToConfigType(effectiveTypeId);
            placedTypes.set(addr, placedType);

            if (placedType !== configDevice.type) {
                typeMismatch.push(addr);
            } else {
                // Type matches - now check features for detectors
                if (configDevice.type === 'detector' && mountedHead) {
                    const requiredFeatures = getRequiredFeatures(configDevice);
                    const actualFeatures = (mountedHead.features || []).map(f => f as string).sort();

                    // Always store feature details for detectors (for UI display)
                    featureDetails.set(addr, { required: requiredFeatures, actual: actualFeatures });

                    // Check if all required features are present
                    const missingFeatures = requiredFeatures.filter(f => !actualFeatures.includes(f));
                    if (missingFeatures.length > 0) {
                        featureMismatch.push(addr);
                    } else {
                        matched.push(addr);
                    }
                } else if (configDevice.type === 'detector') {
                    // Detector without mounted head - still record empty features
                    featureDetails.set(addr, { required: getRequiredFeatures(configDevice), actual: [] });
                    matched.push(addr);
                } else {
                    matched.push(addr);
                }
            }
        }
    }

    // Find extra devices (placed but not in config)
    for (const [addr, entry] of placedDeviceMap) {
        if (!configDeviceMap.has(addr)) {
            extra.push(addr);
            placedTypes.set(addr, entry.socket.typeId);
        }
    }

    return {
        valid: missing.length === 0 && typeMismatch.length === 0 && featureMismatch.length === 0,
        matched,
        missing,
        extra,
        typeMismatch,
        featureMismatch,
        placedTypes,
        featureDetails
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
