// .faconfig file type definitions
// Matches the schema defined in design/configuration-tool/faconfig_spec.md

/**
 * Device entry in the configuration
 */
export interface FAConfigDevice {
    address: string;           // Device address (e.g., "A.001.001")
    type: 'detector' | 'mcp' | 'sounder';
    subType?: string;          // e.g., "heat-multi", "optical", "bell"
    location: string;          // Room/area name
    zone: string;              // Zone ID reference (e.g., "DZ-01")
    label?: string;            // User-friendly display label
}

/**
 * Zone entry
 */
export interface FAConfigZone {
    id: string;                // Unique zone ID (e.g., "DZ-01")
    name: string;              // Human-readable zone name
}

/**
 * Detection and alarm zones
 */
export interface FAConfigZones {
    detection: FAConfigZone[]; // Detection zones (inputs)
    alarm: FAConfigZone[];     // Alarm zones (outputs)
}

/**
 * Trigger condition for C&E rules
 */
export interface CECondition {
    type: 'OR' | 'AND';        // Condition type
    inputs: string[];          // Device addresses that trigger this rule
}

/**
 * Cause & Effect rule
 */
export interface CERule {
    id: string;                // Unique rule ID
    condition: CECondition;    // Trigger condition
    outputs: string[];         // Device addresses to activate
    delay: number;             // Delay in seconds before activation
}

/**
 * Root configuration object
 */
export interface FAConfig {
    version: string;           // Format version, always "1.0"
    projectName: string;       // Human-readable project name
    createdAt: string;         // ISO 8601 timestamp of creation
    devices: FAConfigDevice[]; // List of configured devices
    zones: FAConfigZones;      // Detection and alarm zone definitions
    causeEffect: CERule[];     // Cause & Effect rules
}
