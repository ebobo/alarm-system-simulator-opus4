// .faconfig file parser and validator
import type { FAConfig } from '../types/faconfig';

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
 * Validate that an object matches the FAConfig schema
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

    if (config.version !== '1.0') {
        return { valid: false, error: `Unsupported version: ${config.version}. Expected "1.0"` };
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

    // Validate causeEffect (optional but must be array if present)
    if (!Array.isArray(config.causeEffect)) {
        return { valid: false, error: 'Missing or invalid "causeEffect" array' };
    }

    return { valid: true };
}

/**
 * Validate a single device entry
 */
function validateDevice(device: unknown, index: number): { valid: true } | { valid: false; error: string } {
    if (!device || typeof device !== 'object') {
        return { valid: false, error: `Device at index ${index} is not an object` };
    }

    const d = device as Record<string, unknown>;

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

    if (typeof d.zone !== 'string') {
        return { valid: false, error: `Device ${index}: missing or invalid "zone"` };
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
