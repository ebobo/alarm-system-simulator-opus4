// .faconfig file type definitions
// UUID-based format from fire-alarm-config-tool

/**
 * Device entry in the configuration
 * UUID is the internal identifier (panel only)
 * Address is the loop label for device identification
 */
export interface FAConfigDevice {
    uuid: string;           // Internal ID (panel only, UUID v7)
    address: string;        // Loop address e.g., "A.001.001"
    type: 'detector' | 'mcp' | 'sounder';
    subType?: string;       // e.g., "heat-multi", "optical", "bell"
    location: string;       // Room/area name
    label?: string;         // User-friendly display label
}

/**
 * Detection zone entry
 */
export interface FAConfigDetectionZone {
    uuid: string;              // Primary identifier
    id: string;                // Human-readable ID e.g., "DZ-01"
    name: string;              // Zone name
    devices: string[];         // Device addresses in this zone
    linkedAlarmZones: string[]; // UUIDs of linked alarm zones
}

/**
 * Alarm zone entry
 */
export interface FAConfigAlarmZone {
    uuid: string;              // Primary identifier
    id: string;                // Human-readable ID e.g., "AZ-01"
    name: string;              // Zone name
    devices: string[];         // Device addresses in this zone
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
    id: string;                // Rule UUID
    inputZone: string;         // Detection zone UUID
    outputZone: string;        // Alarm zone UUID
    logic: 'OR' | 'AND';       // Trigger logic
    delay: number;             // Delay in seconds before activation
}

/**
 * Root configuration object
 */
export interface FAConfig {
    version: string;           // Format version
    projectName: string;       // Human-readable project name
    createdAt: string;         // ISO 8601 timestamp of creation
    devices: FAConfigDevice[]; // List of configured devices
    zones: FAConfigZones;      // Detection and alarm zone definitions
    causeEffect: CERule[];     // Cause & Effect rules
}
