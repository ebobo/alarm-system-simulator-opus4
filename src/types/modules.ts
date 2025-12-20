// Panel module type definitions
// Modules represent internal hardware components in the fire alarm panel

export type ModuleType =
    | 'controller'
    | 'loop-driver'
    | 'power-supply';

export type ModuleStatus = 'online' | 'offline' | 'fault';

/**
 * Connected device info for loop driver display
 */
export interface ConnectedDeviceInfo {
    instanceId: string;
    label: string;
    typeId: string;
    sn: number;                            // Serial number for display (socket SN for detectors)
    headSn?: number;                       // Head serial number for AG-detectors
    cAddress?: number;                     // Communication address (1-255), assigned when discovered
    discoveredFrom?: 'out' | 'in';         // Discovery direction (out=LOOP-OUT/blue, in=LOOP-IN/orange)
}

/**
 * Represents a hardware module inside the panel
 */
export interface PanelModule {
    id: string;
    type: ModuleType;
    slotPosition: number;         // Physical slot number (1-based)
    status: ModuleStatus;
    label: string;

    // Loop driver specific properties
    connectedDeviceCount?: number;
    connectedDevices?: ConnectedDeviceInfo[];  // Device details for display
    ipAddress?: string;
}

/**
 * Module type display configuration
 */
export interface ModuleTypeConfig {
    name: string;
    icon: string;         // Emoji for quick visual
    colorClass: string;   // Tailwind color class
}

/**
 * Display configuration for each module type
 */
export const MODULE_TYPE_CONFIG: Record<ModuleType, ModuleTypeConfig> = {
    'controller': {
        name: 'Controller',
        icon: '⚙️',
        colorClass: 'blue'
    },
    'power-supply': {
        name: 'Power Supply',
        icon: '⚡',
        colorClass: 'amber'
    },
    'loop-driver': {
        name: 'Loop Driver',
        icon: 'LD',
        colorClass: 'cyan'
    }
};
