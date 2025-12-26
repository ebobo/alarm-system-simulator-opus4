// .faconfig file type definitions
// v2.0 format with multi-function device support

/**
 * Function type enum - all possible device function types
 */
export type DeviceFunctionType =
    | 'detector'
    | 'mcp'
    | 'co-sensor'
    | 'sounder'
    | 'beacon-red'
    | 'beacon-white'
    | 'voice';

/**
 * Input function types (go to Detection Zones)
 */
export const INPUT_FUNCTION_TYPES: DeviceFunctionType[] = ['detector', 'mcp', 'co-sensor'];

/**
 * Output function types (go to Alarm Zones)
 */
export const OUTPUT_FUNCTION_TYPES: DeviceFunctionType[] = ['sounder', 'beacon-red', 'beacon-white', 'voice'];

/**
 * Check if a function type is an input type
 */
export function isInputFunctionType(type: string): boolean {
    return INPUT_FUNCTION_TYPES.includes(type as DeviceFunctionType);
}

/**
 * Check if a function type is an output type
 */
export function isOutputFunctionType(type: string): boolean {
    return OUTPUT_FUNCTION_TYPES.includes(type as DeviceFunctionType);
}

/**
 * Device function - represents a single capability of a device
 * Multi-function devices (e.g., AG-detector with sounder + beacon) have multiple functions
 */
export interface DeviceFunction {
    uuid: string;                    // UUID v7 for this specific function
    type: DeviceFunctionType;        // Function type
    role: 'input' | 'output';        // Input for DZ, Output for AZ
}

/**
 * Device entry in the configuration
 * v2.0: Added functions array for multi-function device support
 */
export interface FAConfigDevice {
    address: string;                 // Loop address e.g., "A.001.001"
    primaryUuid: string;             // UUID v7 identifier for the device (v2.0: renamed from 'uuid')
    type: string;                    // Device type (e.g., "detector", "mcp", "sounder")
    subType?: string;                // e.g., "heat-multi", "optical", "bell"
    location: string;                // Room/area name
    label?: string;                  // User-friendly display label
    functions: DeviceFunction[];     // v2.0: Array of device functions
}

/**
 * Detection zone entry (triggers alarms)
 */
export interface FAConfigDetectionZone {
    uuid: string;                    // Primary identifier (UUID v7)
    id: string;                      // Human-readable ID e.g., "DZ-01"
    name: string;                    // Zone name
    devices: string[];               // Device addresses in this zone
    linkedAlarmZones: string[];      // UUIDs of linked alarm zones
}

/**
 * Alarm zone entry (output devices)
 */
export interface FAConfigAlarmZone {
    uuid: string;                    // Primary identifier (UUID v7)
    id: string;                      // Human-readable ID e.g., "AZ-01"
    name: string;                    // Zone name
    devices: string[];               // Device addresses in this zone
}

/**
 * Detection and alarm zones container
 */
export interface FAConfigZones {
    detection: FAConfigDetectionZone[];
    alarm: FAConfigAlarmZone[];
}

/**
 * Cause & Effect rule using zone UUIDs
 */
export interface CERule {
    id: string;                      // Rule UUID
    inputZone: string;               // Detection zone UUID
    outputZone: string;              // Alarm zone UUID
    logic: 'OR' | 'AND';             // Trigger logic
    delay: number;                   // Delay in seconds before activation
}

/**
 * Root configuration object
 */
export interface FAConfig {
    version: string;                 // Format version ("1.0" or "2.0")
    projectName: string;             // Human-readable project name
    createdAt: string;               // ISO 8601 timestamp of creation
    devices: FAConfigDevice[];       // List of configured devices
    zones: FAConfigZones;            // Detection and alarm zone definitions
    causeEffect: CERule[];           // Cause & Effect rules
}

/**
 * Legacy device format (v1.0) - for migration support
 */
export interface FAConfigDeviceLegacy {
    uuid: string;                    // v1.0 used 'uuid'
    address: string;
    type: 'detector' | 'mcp' | 'sounder';
    subType?: string;
    location: string;
    zone: string;                    // v1.0 had zone on device
    label?: string;
}
