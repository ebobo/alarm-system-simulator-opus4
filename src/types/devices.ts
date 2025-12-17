// Device and terminal type definitions for fire alarm loop simulator

/**
 * Terminal definition relative to device center
 * Positions are in range [-0.5, 0.5] relative to device size
 */
export interface TerminalDefinition {
    id: string;
    pairIndex: number;           // 0-3 for 4 wire pairs
    polarity: '+' | '-';
    relativeX: number;           // -0.5 to 0.5 relative to device width
    relativeY: number;           // -0.5 to 0.5 relative to device height
    label: string;               // Display label (e.g., "L1+")
}

/**
 * Device type definition - describes a type of device that can be placed
 */
export interface DeviceType {
    id: string;
    name: string;
    category: 'detector' | 'sounder' | 'io' | 'mcp' | 'controller';
    description: string;
    width: number;               // Device width in plan units
    height: number;              // Device height in plan units
    terminals: TerminalDefinition[];
}

/**
 * Placed device instance on the floor plan
 * Positions are in plan/world coordinates (not screen pixels)
 */
export interface PlacedDevice {
    instanceId: string;
    typeId: string;              // References DeviceType.id
    x: number;                   // Plan X coordinate (center of device)
    y: number;                   // Plan Y coordinate (center of device)
    rotation: number;            // 0, 90, 180, or 270 degrees
    // Device properties for AutroGuard socket
    deviceType: string;          // "AG socket" for AutroGuard, "BSD-1000" for Loop Driver
    deviceId: number | null;     // uint8 (0-255), null when empty
    cAddress: number | null;     // uint8 (0-255), null when empty
    label: string;               // User-editable label, max 20 characters
    sn: number;                  // Serial number: random 48-bit number
    // Loop Driver specific
    ipAddress?: string;          // IPv4 address for Loop Driver, editable
}

export interface ViewportTransform {
    scale: number;
    positionX: number;           // translateX in pixels
    positionY: number;           // translateY in pixels
}

/**
 * A connection between two terminals
 */
export interface Connection {
    id: string;
    fromDeviceId: string;
    fromTerminalId: string;
    toDeviceId: string;
    toTerminalId: string;
}

/**
 * State for the wire currently being drawn
 */
export interface DrawingWire {
    startDeviceId: string;
    startTerminalId: string;
    endX: number;                // Plan X coordinate
    endY: number;                // Plan Y coordinate
}

/**
 * Room information for selection and property display
 */
export interface RoomInfo {
    id: string;
    type: string;                // Room type (office, meeting, toilet, etc.)
    uniqueLabel: string;         // Unique label like "Office 1", "Meeting Room 2"
    x: number;
    y: number;
    width: number;
    height: number;
}

// Terminal positions for AutroGuard base:
// 4 terminals at top, bottom, left, right
const AUTROGUARD_TERMINALS: TerminalDefinition[] = [
    { id: 'top', pairIndex: 0, polarity: '+', relativeX: 0, relativeY: -0.45, label: 'T' },
    { id: 'right', pairIndex: 1, polarity: '+', relativeX: 0.45, relativeY: 0, label: 'R' },
    { id: 'bottom', pairIndex: 2, polarity: '+', relativeX: 0, relativeY: 0.45, label: 'B' },
    { id: 'left', pairIndex: 3, polarity: '+', relativeX: -0.45, relativeY: 0, label: 'L' },
];

// Terminal positions for Loop Driver:
// 1 terminal on top (loop in), 1 on bottom (loop out), centered
const LOOP_DRIVER_TERMINALS: TerminalDefinition[] = [
    // Top connector - Loop In (orange)
    { id: 'loop-in', pairIndex: 0, polarity: '+', relativeX: 0, relativeY: -0.5, label: 'IN' },
    // Bottom connector - Loop Out (light blue)
    { id: 'loop-out', pairIndex: 1, polarity: '+', relativeX: 0, relativeY: 0.5, label: 'OUT' },
];

/**
 * Registry of all available device types
 */
export const DEVICE_TYPES: Record<string, DeviceType> = {
    'autroguard-base': {
        id: 'autroguard-base',
        name: 'AutroGuard Base',
        category: 'detector',
        description: 'V-430 detector base with 4 wire pairs',
        width: 50,
        height: 50,
        terminals: AUTROGUARD_TERMINALS,
    },
    'loop-driver': {
        id: 'loop-driver',
        name: 'Loop Driver',
        category: 'controller',
        description: 'Loop driver module with loop in/out and controller connection',
        width: 60,
        height: 35,
        terminals: LOOP_DRIVER_TERMINALS,
    },
};

/**
 * Get device type by ID
 */
export function getDeviceType(typeId: string): DeviceType | undefined {
    return DEVICE_TYPES[typeId];
}

/**
 * Generate unique instance ID for placed devices
 */
export function generateInstanceId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate random 48-bit serial number for AutroGuard devices
 */
export function generateSerialNumber(): number {
    // Generate a random 48-bit unsigned integer (0 to 2^48 - 1)
    // JavaScript can safely handle integers up to 2^53 - 1
    return Math.floor(Math.random() * 0xFFFFFFFFFFFF);
}

