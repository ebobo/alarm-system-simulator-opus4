// Utility to extract room data from SVG for 3D rendering

export interface DoorData {
    x: number;
    y: number;
    direction: 'top' | 'bottom' | 'left' | 'right';
    roomId: string;
}

export interface WindowData {
    x: number;
    y: number;
    width: number;
    orientation: 'horizontal' | 'vertical';
    roomId: string;
}

export interface RoomData {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    door?: DoorData;
    isExterior?: {
        top: boolean;
        bottom: boolean;
        left: boolean;
        right: boolean;
    };
}

// Room colors for 3D rendering (matches 2D palette)
export const ROOM_COLORS_3D: Record<string, string> = {
    office: '#E8F4FD',
    meeting: '#FFF3E0',
    toilet: '#E8F5E9',
    entrance: '#F5F5F5',
    public: '#F5F5F5',
    server: '#FCE4EC',
    storage: '#EDE7F6',
};

// Constants from floorPlanGenerator
const DOOR_WIDTH = 40;
const MARGIN = 40;

/**
 * Parse SVG content and extract room geometry data with doors
 */
export function parseRoomsFromSVG(svgContent: string): RoomData[] {
    const rooms: RoomData[] = [];

    // Find all rects with data-room-id (flexible attribute order)
    const rectElements = svgContent.match(/<rect[^>]*data-room-id[^>]*>/g) || [];

    for (const rect of rectElements) {
        const getId = (attr: string) => {
            const m = rect.match(new RegExp(`${attr}="([^"]*)"`));
            return m ? m[1] : '';
        };

        const id = getId('data-room-id');
        const type = getId('data-room-type');
        const label = getId('data-room-label');
        const x = parseFloat(getId('data-room-x') || '0');
        const y = parseFloat(getId('data-room-y') || '0');
        const width = parseFloat(getId('data-room-width') || '0');
        const height = parseFloat(getId('data-room-height') || '0');

        if (id && width > 0 && height > 0) {
            rooms.push({ id, type, label, x, y, width, height });
        }
    }

    // Get canvas dimensions
    const dims = getSVGDimensions(svgContent);
    const usableWidth = dims.width - 2 * MARGIN;
    const rowHeight = Math.floor((dims.height - 2 * MARGIN) / 3);
    const topRowY = MARGIN;
    const corridorY = MARGIN + rowHeight;
    const bottomRowY = MARGIN + 2 * rowHeight;

    // Calculate door positions and exterior walls for each room
    for (const room of rooms) {
        // Skip public areas - they're corridors
        if (room.type === 'public') continue;

        // Determine exterior walls based on position
        room.isExterior = {
            top: room.y === topRowY,
            bottom: room.y + room.height >= bottomRowY + rowHeight - 5,
            left: room.x <= MARGIN + 5,
            right: room.x + room.width >= MARGIN + usableWidth - 5,
        };

        // Calculate door position based on room location relative to corridor
        const roomBottom = room.y + room.height;

        // Room above corridor - door at bottom
        if (Math.abs(roomBottom - corridorY) < 5) {
            room.door = {
                x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                y: roomBottom,
                direction: 'top',
                roomId: room.id,
            };
        }
        // Room below corridor - door at top  
        else if (Math.abs(room.y - (corridorY + rowHeight)) < 5) {
            room.door = {
                x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                y: room.y,
                direction: 'bottom',
                roomId: room.id,
            };
        }
        // Room to the right of corridor - door at left
        else if (room.x > MARGIN + usableWidth - room.width - 5) {
            room.door = {
                x: room.x,
                y: room.y + room.height / 2 - DOOR_WIDTH / 2,
                direction: 'right',
                roomId: room.id,
            };
        }
        // Special case for entrance - door at bottom facing outside
        if (room.type === 'entrance') {
            room.door = {
                x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                y: room.y + room.height,
                direction: 'bottom',
                roomId: room.id,
            };
        }
    }

    return rooms;
}

/**
 * Get the SVG canvas dimensions
 */
export function getSVGDimensions(svgContent: string): { width: number; height: number } {
    const viewBoxMatch = svgContent.match(/viewBox="0 0 (\d+) (\d+)"/);
    if (viewBoxMatch) {
        return {
            width: parseInt(viewBoxMatch[1]),
            height: parseInt(viewBoxMatch[2]),
        };
    }
    return { width: 900, height: 700 }; // Default
}

/**
 * Get building boundary for exterior walls
 */
export function getBuildingBounds(svgContent: string) {
    const dims = getSVGDimensions(svgContent);
    return {
        minX: MARGIN,
        maxX: dims.width - MARGIN,
        minY: MARGIN,
        maxY: dims.height - MARGIN,
    };
}
