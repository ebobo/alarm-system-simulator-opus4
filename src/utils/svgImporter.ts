// SVG Floor Plan Importer
// Validates and processes imported SVG floor plans with room data

export interface ImportedRoomData {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ValidationError {
    field: string;
    message: string;
    roomId?: string;
}

export interface ImportResult {
    success: boolean;
    svgContent?: string;
    rooms?: ImportedRoomData[];
    errors: ValidationError[];
}

// Valid room types that the app supports
const VALID_ROOM_TYPES = [
    'office', 'meeting', 'toilet', 'entrance', 'public', 'server', 'storage',
    'bedroom', 'living_room', 'kitchen', 'dining', 'utility', 'hallway'
];

// Required data attributes for each room rect
const REQUIRED_ATTRS = ['data-room-id', 'data-room-type', 'data-room-label', 'data-room-x', 'data-room-y', 'data-room-width', 'data-room-height'];

/**
 * Parse and validate an imported SVG floor plan
 */
export function importSVG(svgContent: string): ImportResult {
    const errors: ValidationError[] = [];
    const rooms: ImportedRoomData[] = [];

    // Check if content is valid SVG
    if (!svgContent.trim().startsWith('<') || !svgContent.includes('<svg')) {
        return {
            success: false,
            errors: [{ field: 'svg', message: 'File does not appear to be a valid SVG' }]
        };
    }

    // Check for viewBox attribute
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
    if (!viewBoxMatch) {
        errors.push({ field: 'viewBox', message: 'SVG must have a viewBox attribute (e.g., viewBox="0 0 900 700")' });
    }

    // Find all rect elements with data-room-id
    const rectRegex = /<rect[^>]*data-room-id[^>]*>/g;
    const rectElements = svgContent.match(rectRegex) || [];

    if (rectElements.length === 0) {
        errors.push({
            field: 'rooms',
            message: 'No rooms found. Ensure rect elements have data-room-id attributes.'
        });
        return { success: false, errors };
    }

    // Track room IDs for duplicate detection  
    const seenIds = new Set<string>();

    // Parse each room rect
    for (const rect of rectElements) {
        const roomData = parseRoomRect(rect, errors, seenIds);
        if (roomData) {
            rooms.push(roomData);
        }
    }

    // If there are any errors, return failure
    if (errors.length > 0) {
        return { success: false, errors };
    }

    // Success - return cleaned svgContent and room data
    return {
        success: true,
        svgContent,
        rooms,
        errors: []
    };
}

/**
 * Parse a single room rect element and extract data
 */
function parseRoomRect(
    rect: string,
    errors: ValidationError[],
    seenIds: Set<string>
): ImportedRoomData | null {
    // Helper to extract attribute value
    const getAttr = (name: string): string | null => {
        const match = rect.match(new RegExp(`${name}=["']([^"']*)["']`));
        return match ? match[1] : null;
    };

    // Check for all required attributes
    const missingAttrs: string[] = [];
    for (const attr of REQUIRED_ATTRS) {
        if (!getAttr(attr)) {
            missingAttrs.push(attr);
        }
    }

    const roomId = getAttr('data-room-id') || 'unknown';

    if (missingAttrs.length > 0) {
        errors.push({
            field: 'attributes',
            message: `Missing required attributes: ${missingAttrs.join(', ')}`,
            roomId
        });
        return null;
    }

    // Check for duplicate IDs
    if (seenIds.has(roomId)) {
        errors.push({
            field: 'id',
            message: `Duplicate room ID: ${roomId}`,
            roomId
        });
        return null;
    }
    seenIds.add(roomId);

    // Validate room type
    const roomType = getAttr('data-room-type')!;
    if (!VALID_ROOM_TYPES.includes(roomType)) {
        errors.push({
            field: 'type',
            message: `Invalid room type "${roomType}". Must be one of: ${VALID_ROOM_TYPES.join(', ')}`,
            roomId
        });
        return null;
    }

    // Parse numeric values
    const x = parseFloat(getAttr('data-room-x')!);
    const y = parseFloat(getAttr('data-room-y')!);
    const width = parseFloat(getAttr('data-room-width')!);
    const height = parseFloat(getAttr('data-room-height')!);

    // Validate numeric values
    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
        errors.push({
            field: 'dimensions',
            message: 'Invalid numeric values for coordinates or dimensions',
            roomId
        });
        return null;
    }

    if (width <= 0 || height <= 0) {
        errors.push({
            field: 'dimensions',
            message: 'Room width and height must be positive numbers',
            roomId
        });
        return null;
    }

    return {
        id: roomId,
        type: roomType,
        label: getAttr('data-room-label')!,
        x,
        y,
        width,
        height
    };
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                resolve(e.target.result as string);
            } else {
                reject(new Error('Failed to read file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}
