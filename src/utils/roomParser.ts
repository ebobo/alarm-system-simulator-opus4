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
    const bottomRowY = MARGIN + 2 * rowHeight;


    // Find public corridor rooms
    const publicRooms = rooms.filter(r => r.type === 'public');
    const EPSILON = 5;
    const intervalsOverlap = (a1: number, w1: number, a2: number, w2: number) => {
        return Math.max(a1, a2) < Math.min(a1 + w1, a2 + w2) - EPSILON;
    };

    // Calculate door positions and exterior walls for each room
    for (const room of rooms) {
        // Determine exterior walls based on position
        room.isExterior = {
            top: room.y <= topRowY + 5,
            bottom: room.y + room.height >= bottomRowY + rowHeight - 5,
            left: room.x <= MARGIN + 5,
            right: room.x + room.width >= MARGIN + usableWidth - 5,
        };

        // Skip public areas for door logic
        if (room.type === 'public') continue;

        // Special case for entrance - door at bottom facing outside
        if (room.type === 'entrance' || room.label === 'Main Entrance') {
            room.door = {
                x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                y: room.y + room.height,
                direction: 'bottom',
                roomId: room.id,
            };
            continue;
        }

        // Find adjacent public room for door placement
        const publicNeighbor = publicRooms.find(p => {
            // Check adjacency
            const touchTop = Math.abs(p.y + p.height - room.y) < EPSILON && intervalsOverlap(p.x, p.width, room.x, room.width);
            const touchBottom = Math.abs(room.y + room.height - p.y) < EPSILON && intervalsOverlap(p.x, p.width, room.x, room.width);
            const touchLeft = Math.abs(p.x + p.width - room.x) < EPSILON && intervalsOverlap(p.y, p.height, room.y, room.height);
            const touchRight = Math.abs(room.x + room.width - p.x) < EPSILON && intervalsOverlap(p.y, p.height, room.y, room.height);
            return touchTop || touchBottom || touchLeft || touchRight;
        });

        if (publicNeighbor) {
            const p = publicNeighbor;
            // Determine direction
            // Top (Room is below Public) -> Door Top
            if (Math.abs(p.y + p.height - room.y) < EPSILON) {
                room.door = {
                    x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                    y: room.y,
                    direction: 'top',
                    roomId: room.id,
                };
            }
            // Bottom (Room is above Public) -> Door Bottom
            else if (Math.abs(room.y + room.height - p.y) < EPSILON) {
                room.door = {
                    x: room.x + room.width / 2 - DOOR_WIDTH / 2,
                    y: room.y + room.height,
                    direction: 'bottom',
                    roomId: room.id,
                };
            }
            // Left (Room is right of Public) -> Door Left
            else if (Math.abs(p.x + p.width - room.x) < EPSILON) {
                room.door = {
                    x: room.x,
                    y: room.y + room.height / 2 - DOOR_WIDTH / 2,
                    direction: 'left',
                    roomId: room.id,
                };
            }
            // Right (Room is left of Public) -> Door Right
            else if (Math.abs(room.x + room.width - p.x) < EPSILON) {
                room.door = {
                    x: room.x + room.width - 2, // Slightly adjusted for coordinate
                    y: room.y + room.height / 2 - DOOR_WIDTH / 2,
                    direction: 'right',
                    roomId: room.id,
                };
            }
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
