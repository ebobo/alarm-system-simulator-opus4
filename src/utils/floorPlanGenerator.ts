// Floor Plan Generator with Central Hub Architecture
// All rooms connect directly to the public corridor

export type RoomType = 'office' | 'meeting' | 'toilet' | 'entrance' | 'public' | 'server' | 'storage';

export interface RoomConfig {
    offices: number;
    meetingRooms: number;
    toilets: number;
}

interface Room {
    id: string;
    type: RoomType;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string; // The visual label (e.g. "Meeting Room")
    uniqueLabel: string; // The unique ID for export (e.g. "Meeting Room 1")
    doorPosition?: { x: number; y: number; direction: 'top' | 'bottom' | 'left' | 'right' };
}

const ROOM_COLORS: Record<RoomType, string> = {
    office: '#E8F4FD',
    meeting: '#FFF3E0',
    toilet: '#E8F5E9',
    entrance: '#F5F5F5',  // Same as public
    public: '#F5F5F5',
    server: '#FCE4EC',
    storage: '#EDE7F6',
};

const ROOM_LABELS: Record<RoomType, string> = {
    office: 'Office',
    meeting: 'Meeting Room',
    toilet: 'Toilet',
    entrance: 'Main Entrance',
    public: 'Public Area',
    server: 'Server Room',
    storage: 'Storage',
};

// Room size weights - more balanced (less variance)
const SIZE_WEIGHTS: Record<RoomType, number> = {
    office: 1.2,
    meeting: 1.8,   // Just 1.5x office, not 2x
    toilet: 1.0,
    entrance: 1.5,
    public: 1.0,
    server: 0.9,    // Smaller than toilet
    storage: 0.9,   // Smaller than toilet
};

const MIN_ROOM_SIZE = 100;
const MAX_ROOM_SIZE = 200; // Prevent huge rooms
const DOOR_WIDTH = 40;
const DOOR_ARC_RADIUS = 35;

// Floor plan dimensions in SVG units
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;

// Real-world dimensions in meters (building size)
// The building represents approximately 30m x 21m
const BUILDING_WIDTH_METERS = 30;
const BUILDING_HEIGHT_METERS = 21;

// Export scale factor: SVG units to meters
// Canvas is 900x700, with 40px margin on each side, so usable area is 820x620
// Usable area represents 30m x 21m building
export const PIXELS_PER_METER = (CANVAS_WIDTH - 80) / BUILDING_WIDTH_METERS; // ~27.33 px/m

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function calculateRoomSizes(
    rooms: RoomType[],
    availableSpace: number
): { type: RoomType; size: number }[] {
    if (rooms.length === 0) return [];

    const maxRooms = Math.floor(availableSpace / MIN_ROOM_SIZE);
    const actualRooms = rooms.slice(0, Math.max(1, maxRooms));
    const totalWeight = actualRooms.reduce((sum, type) => sum + SIZE_WEIGHTS[type], 0);

    const sizes = actualRooms.map(type => ({
        type,
        size: Math.floor((SIZE_WEIGHTS[type] / totalWeight) * availableSpace),
    }));

    // Apply min and max constraints
    for (const item of sizes) {
        if (item.size < MIN_ROOM_SIZE) item.size = MIN_ROOM_SIZE;
        if (item.size > MAX_ROOM_SIZE) item.size = MAX_ROOM_SIZE;
    }

    // Distribute remaining space evenly
    let totalSize = sizes.reduce((sum, s) => sum + s.size, 0);
    let diff = availableSpace - totalSize;

    if (diff > 0 && sizes.length > 0) {
        // Add space to smaller rooms first
        const sorted = [...sizes].sort((a, b) => a.size - b.size);
        for (const item of sorted) {
            if (diff <= 0) break;
            const canAdd = Math.min(diff, MAX_ROOM_SIZE - item.size);
            item.size += canAdd;
            diff -= canAdd;
        }
    }

    return sizes;
}

function calculateDoorPosition(
    room: Room,
    corridorY: number,
    corridorHeight: number,
    corridorX: number,
    corridorWidth: number
): { x: number; y: number; direction: 'top' | 'bottom' | 'left' | 'right' } | null {
    const roomBottom = room.y + room.height;
    const roomRight = room.x + room.width;
    const corridorBottom = corridorY + corridorHeight;
    const corridorRight = corridorX + corridorWidth;

    // Check if room is above corridor
    if (roomBottom === corridorY && room.x < corridorRight && roomRight > corridorX) {
        const doorX = Math.max(room.x, corridorX) + (Math.min(roomRight, corridorRight) - Math.max(room.x, corridorX)) / 2 - DOOR_WIDTH / 2;
        return { x: doorX, y: roomBottom, direction: 'top' };
    }

    // Check if room is below corridor  
    if (room.y === corridorBottom && room.x < corridorRight && roomRight > corridorX) {
        const doorX = Math.max(room.x, corridorX) + (Math.min(roomRight, corridorRight) - Math.max(room.x, corridorX)) / 2 - DOOR_WIDTH / 2;
        return { x: doorX, y: room.y, direction: 'bottom' };
    }

    // Check if room is left of corridor
    if (roomRight === corridorX && room.y < corridorBottom && roomBottom > corridorY) {
        const doorY = Math.max(room.y, corridorY) + (Math.min(roomBottom, corridorBottom) - Math.max(room.y, corridorY)) / 2 - DOOR_WIDTH / 2;
        return { x: roomRight, y: doorY, direction: 'left' };
    }

    // Check if room is right of corridor
    if (room.x === corridorRight && room.y < corridorBottom && roomBottom > corridorY) {
        const doorY = Math.max(room.y, corridorY) + (Math.min(roomBottom, corridorBottom) - Math.max(room.y, corridorY)) / 2 - DOOR_WIDTH / 2;
        return { x: room.x, y: doorY, direction: 'right' };
    }

    return null;
}

function renderDoorOpening(door: { x: number; y: number; direction: 'top' | 'bottom' | 'left' | 'right' }): string {
    const { x, y, direction } = door;
    const r = DOOR_ARC_RADIUS;
    const gapWidth = DOOR_WIDTH;

    let arcPath: string;
    let doorLine: string;
    let wallGap: string;

    switch (direction) {
        case 'top':
            wallGap = `<rect x="${x}" y="${y - 2}" width="${gapWidth}" height="6" fill="#F5F5F5"/>`;
            arcPath = `M ${x} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y - r}`;
            doorLine = `M ${x} ${y} L ${x + r} ${y - r}`;
            break;
        case 'bottom':
            wallGap = `<rect x="${x}" y="${y - 2}" width="${gapWidth}" height="6" fill="#F5F5F5"/>`;
            arcPath = `M ${x} ${y} A ${r} ${r} 0 0 0 ${x + r} ${y + r}`;
            doorLine = `M ${x} ${y} L ${x + r} ${y + r}`;
            break;
        case 'left':
            wallGap = `<rect x="${x - 2}" y="${y}" width="6" height="${gapWidth}" fill="#F5F5F5"/>`;
            arcPath = `M ${x} ${y} A ${r} ${r} 0 0 0 ${x - r} ${y + r}`;
            doorLine = `M ${x} ${y} L ${x - r} ${y + r}`;
            break;
        case 'right':
            wallGap = `<rect x="${x - 2}" y="${y}" width="6" height="${gapWidth}" fill="#F5F5F5"/>`;
            arcPath = `M ${x} ${y} A ${r} ${r} 0 0 1 ${x + r} ${y + r}`;
            doorLine = `M ${x} ${y} L ${x + r} ${y + r}`;
            break;
    }

    return `
    ${wallGap}
    <path d="${arcPath}" fill="none" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>
    <path d="${doorLine}" fill="none" stroke="#444" stroke-width="2.5"/>
    <circle cx="${x}" cy="${y}" r="3" fill="#444"/>
  `;
}

function renderRoom(room: Room): string {
    const { x, y, width, height, type, label } = room;
    const color = ROOM_COLORS[type];
    const minDim = Math.min(width, height);
    const fontSize = Math.max(8, Math.min(11, minDim / 12));

    return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          fill="${color}" stroke="#333" stroke-width="2"
          data-room-id="${room.id}" data-room-type="${type}" 
          data-room-label="${room.uniqueLabel}"
          data-room-x="${x}" data-room-y="${y}"
          data-room-width="${width}" data-room-height="${height}"
          style="cursor: pointer;"/>
    <text x="${x + width / 2}" y="${y + height / 2}" 
          text-anchor="middle" dominant-baseline="middle"
          font-size="${fontSize}" font-weight="500" fill="#333"
          data-unique-label="${room.uniqueLabel}" style="pointer-events: none;">
      ${label}
    </text>
  `;
}

function renderEntranceDoor(entrance: Room, canvasHeight: number): string {
    const doorX = entrance.x + entrance.width / 2 - DOOR_WIDTH / 2;
    const doorY = entrance.y + entrance.height;
    const r = DOOR_ARC_RADIUS;
    const outsideY = Math.min(doorY + 35, canvasHeight - 10);

    return `
    <rect x="${doorX}" y="${doorY - 2}" width="${DOOR_WIDTH}" height="6" fill="#FFEAA7"/>
    <path d="M ${doorX} ${doorY} A ${r} ${r} 0 0 0 ${doorX + r} ${doorY + r}" fill="none" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>
    <path d="M ${doorX} ${doorY} L ${doorX + r} ${doorY + r}" fill="none" stroke="#444" stroke-width="2.5"/>
    <circle cx="${doorX}" cy="${doorY}" r="3" fill="#444"/>
    <text x="${entrance.x + entrance.width / 2}" y="${outsideY}" 
          text-anchor="middle" font-size="9" fill="#888" font-style="italic">
      ↓ Outside ↓
    </text>
  `;
}

export function generateFloorPlan(config: RoomConfig): string {
    const canvasWidth = 900;
    const canvasHeight = 700;
    const margin = 40;

    const usableWidth = canvasWidth - 2 * margin;
    const usableHeight = canvasHeight - 2 * margin;

    // Divide into 3 equal rows
    const rowHeight = Math.floor(usableHeight / 3);

    // Row positions
    const topRowY = margin;
    const corridorY = margin + rowHeight;
    const bottomRowY = margin + 2 * rowHeight;

    // Corridor spans full width
    const corridorX = margin;
    const corridorWidth = usableWidth;

    // Create room pool
    const allRooms: RoomType[] = [];
    for (let i = 0; i < config.offices; i++) allRooms.push('office');
    for (let i = 0; i < config.meetingRooms; i++) allRooms.push('meeting');
    for (let i = 0; i < config.toilets; i++) allRooms.push('toilet');

    const shuffled = shuffleArray(allRooms);

    // Distribute rooms to top and bottom
    const topRooms = shuffled.slice(0, Math.ceil(shuffled.length / 2));
    const bottomRooms = shuffled.slice(Math.ceil(shuffled.length / 2));

    const rooms: Room[] = [];
    let roomCounter = 1;

    // TOP STRIP - Rooms above corridor
    let currentX = margin;
    let topSizes = calculateRoomSizes(topRooms, usableWidth);

    const topUsed = topSizes.reduce((sum, s) => sum + s.size, 0);
    if (usableWidth - topUsed >= MIN_ROOM_SIZE) {
        topSizes.push({ type: Math.random() > 0.5 ? 'storage' : 'server', size: usableWidth - topUsed });
    } else if (usableWidth - topUsed > 0 && topSizes.length > 0) {
        topSizes[topSizes.length - 1].size += usableWidth - topUsed;
    }

    // Track counts for each room type to generate unique labels
    const typeCounts: Record<string, number> = {};
    const getUniqueLabel = (type: RoomType): string => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
        // Office uses "Office N", others use "Type N"
        if (type === 'office') return `Office ${typeCounts[type]}`;
        return `${ROOM_LABELS[type]} ${typeCounts[type]}`;
    };

    // Helper to get visual label without numbers (except for Offices, if desired, but user asked to hide numbers)
    // User request: "they should only display meeting room, office" (even for offices)
    const getVisualLabel = (type: RoomType): string => {
        // Just return the generic label for all types as requested
        return ROOM_LABELS[type];
    };

    for (const { type, size } of topSizes) {
        const room: Room = {
            id: `room-${roomCounter++}`,
            type,
            x: currentX,
            y: topRowY,
            width: size,
            height: rowHeight,
            label: getVisualLabel(type),
            uniqueLabel: getUniqueLabel(type),
        };
        room.doorPosition = calculateDoorPosition(room, corridorY, rowHeight, corridorX, corridorWidth) || undefined;
        rooms.push(room);
        currentX += size;
    }

    // BOTTOM STRIP - Below corridor
    // Entrance in center
    const entranceWidth = 140;
    const entranceX = margin + (usableWidth - entranceWidth) / 2;

    const entrance: Room = {
        id: 'entrance',
        type: 'entrance',
        x: entranceX,
        y: bottomRowY,
        width: entranceWidth,
        height: rowHeight,
        label: 'Main Entrance',
        uniqueLabel: 'Main Entrance',
    };
    // No door - entrance is open to public area
    rooms.push(entrance);

    // Rooms on left of entrance
    const leftWidth = entranceX - margin;
    currentX = margin;

    const leftRoomCount = Math.min(bottomRooms.length, Math.floor(leftWidth / MIN_ROOM_SIZE));
    const leftRooms = bottomRooms.slice(0, leftRoomCount);
    let leftSizes = calculateRoomSizes(leftRooms, leftWidth);

    const leftUsed = leftSizes.reduce((sum, s) => sum + s.size, 0);
    if (leftWidth - leftUsed >= MIN_ROOM_SIZE) {
        leftSizes.push({ type: 'storage', size: leftWidth - leftUsed });
    } else if (leftWidth - leftUsed > 0 && leftSizes.length > 0) {
        leftSizes[leftSizes.length - 1].size += leftWidth - leftUsed;
    }

    for (const { type, size } of leftSizes) {
        const room: Room = {
            id: `room-${roomCounter++}`,
            type,
            x: currentX,
            y: bottomRowY,
            width: size,
            height: rowHeight,
            label: getVisualLabel(type),
            uniqueLabel: getUniqueLabel(type),
        };
        room.doorPosition = calculateDoorPosition(room, corridorY, rowHeight, corridorX, corridorWidth) || undefined;
        rooms.push(room);
        currentX += size;
    }

    // Rooms on right of entrance
    const rightX = entranceX + entranceWidth;
    const rightWidth = margin + usableWidth - rightX;
    currentX = rightX;

    const remainingRooms = bottomRooms.slice(leftRoomCount);
    let rightSizes = calculateRoomSizes(remainingRooms, rightWidth);

    const rightUsed = rightSizes.reduce((sum, s) => sum + s.size, 0);
    if (rightWidth - rightUsed >= MIN_ROOM_SIZE) {
        rightSizes.push({ type: 'server', size: rightWidth - rightUsed });
    } else if (rightWidth - rightUsed > 0 && rightSizes.length > 0) {
        rightSizes[rightSizes.length - 1].size += rightWidth - rightUsed;
    }

    for (const { type, size } of rightSizes) {
        const room: Room = {
            id: `room-${roomCounter++}`,
            type,
            x: currentX,
            y: bottomRowY,
            width: size,
            height: rowHeight,
            label: getVisualLabel(type),
            uniqueLabel: getUniqueLabel(type),
        };
        room.doorPosition = calculateDoorPosition(room, corridorY, rowHeight, corridorX, corridorWidth) || undefined;
        rooms.push(room);
        currentX += size;
    }

    // Emergency exit position (on the right side of corridor)
    const emergencyX = margin + usableWidth;
    const emergencyY = corridorY + rowHeight / 2 - DOOR_WIDTH / 2;
    const r = DOOR_ARC_RADIUS;

    // Generate SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
      </pattern>
    </defs>
    
    <rect width="100%" height="100%" fill="white"/>
    <rect width="100%" height="100%" fill="url(#grid)"/>
    
    <text x="${canvasWidth / 2}" y="25" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">
      Floor Plan - Generated Layout
    </text>

    <!-- Public Corridor (full width) -->
    <rect x="${corridorX}" y="${corridorY}" width="${corridorWidth}" height="${rowHeight}" 
          fill="${ROOM_COLORS.public}" stroke="#333" stroke-width="2"
          data-room-id="corridor" data-room-type="public" 
          data-room-label="Public Area"
          data-room-x="${corridorX}" data-room-y="${corridorY}"
          data-room-width="${corridorWidth}" data-room-height="${rowHeight}"
          style="cursor: pointer;"/>
    <text x="${corridorX + corridorWidth / 2}" y="${corridorY + rowHeight / 2}" 
          text-anchor="middle" dominant-baseline="middle"
          font-size="11" font-weight="500" fill="#333" style="pointer-events: none;">
      Public Area
    </text>

    <!-- Emergency Exit (right side) -->
    <rect x="${emergencyX - 2}" y="${emergencyY}" width="6" height="${DOOR_WIDTH}" fill="${ROOM_COLORS.public}"/>
    <path d="M ${emergencyX} ${emergencyY} A ${r} ${r} 0 0 1 ${emergencyX + r} ${emergencyY + r}" fill="none" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>
    <path d="M ${emergencyX} ${emergencyY} L ${emergencyX + r} ${emergencyY + r}" fill="none" stroke="#c00" stroke-width="2.5"/>
    <circle cx="${emergencyX}" cy="${emergencyY}" r="3" fill="#c00"/>
    <text x="${emergencyX + 8}" y="${emergencyY + DOOR_WIDTH / 2 + 20}" font-size="8" fill="#c00" font-weight="bold">
      EXIT
    </text>
  `;

    // Render all rooms
    for (const room of rooms) {
        svg += renderRoom(room);
    }

    // Render door openings
    for (const room of rooms) {
        if (room.doorPosition && room.type !== 'public') {
            svg += renderDoorOpening(room.doorPosition);
        }
    }

    // Open connection between entrance and public area (remove wall)
    const openGapWidth = Math.min(entranceWidth - 20, 100);
    const openGapX = entrance.x + (entranceWidth - openGapWidth) / 2;
    svg += `
    <rect x="${openGapX}" y="${bottomRowY - 2}" width="${openGapWidth}" height="6" fill="${ROOM_COLORS.public}"/>
    `;

    // Render entrance door to outside
    svg += renderEntranceDoor(entrance, canvasHeight);

    svg += '</svg>';

    return svg;
}

export const defaultConfig: RoomConfig = {
    offices: 6,
    meetingRooms: 2,
    toilets: 3,
};

