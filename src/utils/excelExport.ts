// Excel Export Utility for Fire Alarm System
// Generates Device List and C&E Matrix sheets

import * as XLSX from 'xlsx';
import type { RoomType } from './floorPlanGenerator';
import type { PlacedDevice, AGHeadFeature } from '../types/devices';

// Device types for export
type DeviceExportType = 'H/M Detector' | 'MCP' | 'Loop Sounder' | 'Input Unit' | 'Output Unit';

interface DeviceListEntry {
    projectName: string;
    deviceLabel: string;
    type: DeviceExportType;
    location: string;
    serialNumber: string; // Always empty for export
    features: string;     // NEW: Features column for multi-function devices
}

/**
 * Convert AGHeadFeature array to comma-separated string for export
 * Format matches what the config tool expects: "Sounder, Beacon-R", etc.
 */
function featuresToString(features: AGHeadFeature[] | undefined): string {
    if (!features || features.length === 0) return '';

    return features.map(f => {
        switch (f) {
            case 'Sounder': return 'Sounder';
            case 'BeaconR': return 'Beacon-R';
            case 'BeaconW': return 'Beacon-W';
            case 'CO': return 'CO';
            case 'Voice': return 'Voice';
            default: return f;
        }
    }).join(', ');
}

/**
 * Extract room list from SVG content by parsing room labels
 */
function extractRoomsFromSVG(svgContent: string): { type: RoomType; label: string }[] {
    const rooms: { type: RoomType; label: string }[] = [];

    // Try parsing with data-room-type and data-room-label first (imported SVGs)
    const rectRegex = /<rect[^>]*data-room-id[^>]*>/g;
    let rectMatch;

    while ((rectMatch = rectRegex.exec(svgContent)) !== null) {
        const rect = rectMatch[0];

        // Extract attributes
        const typeMatch = rect.match(/data-room-type="([^"]+)"/);
        const labelMatch = rect.match(/data-room-label="([^"]+)"/);

        if (typeMatch && labelMatch) {
            const roomType = typeMatch[1] as RoomType;
            const label = labelMatch[1];
            rooms.push({ type: roomType, label });
        }
    }

    // If we found rooms via data-room-* attributes, return them
    if (rooms.length > 0) {
        return rooms;
    }

    // Fallback: Parse data-unique-label attribute (legacy generated SVGs)
    const labelRegex = /data-unique-label="([^"]+)"/g;
    let match;

    while ((match = labelRegex.exec(svgContent)) !== null) {
        const uniqueLabel = match[1];

        // Determine room type from label
        let roomType: RoomType | null = null;

        // Commercial types
        if (uniqueLabel.startsWith('Office')) {
            roomType = 'office';
        } else if (uniqueLabel.startsWith('Meeting Room')) {
            roomType = 'meeting';
        } else if (uniqueLabel.startsWith('Toilet') || uniqueLabel.startsWith('Bathroom')) {
            roomType = 'toilet';
        } else if (uniqueLabel === 'Main Entrance' || uniqueLabel.startsWith('Entrance')) {
            roomType = 'entrance';
        } else if (uniqueLabel === 'Public Area' || uniqueLabel.startsWith('Corridor')) {
            roomType = 'public';
        } else if (uniqueLabel.startsWith('Server Room')) {
            roomType = 'server';
        } else if (uniqueLabel.startsWith('Storage')) {
            roomType = 'storage';
        }
        // Residential types
        else if (uniqueLabel.startsWith('Bedroom') || uniqueLabel.startsWith('Master Bedroom')) {
            roomType = 'bedroom';
        } else if (uniqueLabel.startsWith('Living Room') || uniqueLabel.startsWith('Living')) {
            roomType = 'living_room';
        } else if (uniqueLabel.startsWith('Kitchen')) {
            roomType = 'kitchen';
        } else if (uniqueLabel.startsWith('Dining')) {
            roomType = 'dining';
        } else if (uniqueLabel.startsWith('Utility') || uniqueLabel.startsWith('Laundry')) {
            roomType = 'utility';
        } else if (uniqueLabel.startsWith('Hallway') || uniqueLabel.startsWith('Hall')) {
            roomType = 'hallway';
        }

        if (roomType) {
            rooms.push({ type: roomType, label: uniqueLabel });
        }
    }

    return rooms;
}

/**
 * Get location for a placed device by finding the room it's in from SVG
 */
function getDeviceLocation(device: PlacedDevice, svgContent: string): string {
    // First try to parse the label for location info
    if (device.label) {
        // If label contains location info (e.g., "A.001.001 Office 1"), extract it
        const labelParts = device.label.split(' ');
        if (labelParts.length > 1) {
            // Skip the address part (X.XXX.XXX), return the rest as location
            const possibleLocation = labelParts.slice(1).join(' ');
            if (possibleLocation && !possibleLocation.match(/^[A-Z]\.\d{3}\.\d{3}$/)) {
                return possibleLocation;
            }
        }
    }

    // Fallback: Try to find which room the device is in based on coordinates
    const rooms = extractRoomsFromSVG(svgContent);

    // Parse room geometries from SVG to determine which room contains the device
    const rectRegex = /<rect[^>]*data-room-id[^>]*>/g;
    let rectMatch;

    while ((rectMatch = rectRegex.exec(svgContent)) !== null) {
        const rect = rectMatch[0];

        const xMatch = rect.match(/x="([^"]+)"/);
        const yMatch = rect.match(/y="([^"]+)"/);
        const widthMatch = rect.match(/width="([^"]+)"/);
        const heightMatch = rect.match(/height="([^"]+)"/);
        const labelMatch = rect.match(/data-room-label="([^"]+)"/);

        if (xMatch && yMatch && widthMatch && heightMatch && labelMatch) {
            const rx = parseFloat(xMatch[1]);
            const ry = parseFloat(yMatch[1]);
            const rw = parseFloat(widthMatch[1]);
            const rh = parseFloat(heightMatch[1]);

            // Check if device is inside this room
            if (device.x >= rx && device.x <= rx + rw &&
                device.y >= ry && device.y <= ry + rh) {
                return labelMatch[1];
            }
        }
    }

    // If still no location found, try first room or return Unknown
    if (rooms.length > 0) {
        return rooms[0].label;
    }

    return 'Unknown';
}

/**
 * Generate device list from placed devices
 * NEW: Uses actual placed devices with features instead of generating from rooms
 */
function generateDeviceListFromPlacedDevices(
    projectName: string,
    svgContent: string,
    placedDevices: PlacedDevice[]
): DeviceListEntry[] {
    const devices: DeviceListEntry[] = [];

    // Filter to only addressable loop devices (exclude panel and loop-driver)
    const loopDevices = placedDevices.filter(d =>
        d.typeId !== 'panel' &&
        d.typeId !== 'loop-driver' &&
        d.typeId !== 'AG-head' // Heads are part of sockets, handled separately
    );

    for (const device of loopDevices) {
        // Determine device type for export
        let type: DeviceExportType;
        let features = '';

        // For AG-socket with mounted detector, it becomes a detector
        if (device.typeId === 'AG-socket') {
            type = 'H/M Detector';

            // Find mounted head to get its features
            if (device.mountedDetectorId) {
                const head = placedDevices.find(d => d.instanceId === device.mountedDetectorId);
                if (head?.features) {
                    features = featuresToString(head.features);
                }
            }
        } else if (device.typeId === 'mcp') {
            type = 'MCP';
        } else if (device.typeId === 'sounder') {
            type = 'Loop Sounder';
        } else if (device.typeId === 'input-unit') {
            type = 'Input Unit';
        } else if (device.typeId === 'output-unit') {
            type = 'Output Unit';
        } else {
            continue; // Skip unknown device types
        }

        // Get label - use device label or generate from address format
        const deviceLabel = device.label || `A.001.${String(devices.length + 1).padStart(3, '0')}`;

        // Get location
        const location = getDeviceLocation(device, svgContent);

        devices.push({
            projectName,
            deviceLabel,
            type,
            location,
            serialNumber: '',
            features,
        });
    }

    return devices;
}

/**
 * Generate device list from room configuration and SVG (legacy fallback)
 */
function generateDeviceListFromSVG(
    projectName: string,
    svgContent: string
): DeviceListEntry[] {
    const devices: DeviceListEntry[] = [];
    const rooms = extractRoomsFromSVG(svgContent);

    let deviceNumber = 1;

    // Helper to create device label
    const createLabel = () => {
        const label = `A.001.${deviceNumber.toString().padStart(3, '0')}`;
        deviceNumber++;
        return label;
    };

    // Add H/M Detector for each room
    for (const room of rooms) {
        devices.push({
            projectName,
            deviceLabel: createLabel(),
            type: 'H/M Detector',
            location: room.label,
            serialNumber: '',
            features: '',  // No features in legacy mode
        });
    }

    // Find public area for MCP and Sounder
    const publicArea = rooms.find(r => r.type === 'public');
    const publicAreaLabel = publicArea?.label || 'Public Area';

    // Add MCP in public area
    devices.push({
        projectName,
        deviceLabel: createLabel(),
        type: 'MCP',
        location: publicAreaLabel,
        serialNumber: '',
        features: '',
    });

    // Add Loop Sounder in public area
    devices.push({
        projectName,
        deviceLabel: createLabel(),
        type: 'Loop Sounder',
        location: publicAreaLabel,
        serialNumber: '',
        features: '',
    });

    return devices;
}

/**
 * Generate C&E Matrix from device list
 * All detectors and MCPs trigger all sounders (OR logic with "X")
 */
function generateCEMatrix(devices: DeviceListEntry[]): {
    inputs: DeviceListEntry[];
    outputs: DeviceListEntry[];
    matrix: string[][];
} {
    // Inputs: Detectors and MCPs
    const inputs = devices.filter(d => d.type === 'H/M Detector' || d.type === 'MCP' || d.type === 'Input Unit');

    // Outputs: Sounders
    const outputs = devices.filter(d => d.type === 'Loop Sounder' || d.type === 'Output Unit');

    // Create matrix - all X's for OR logic
    const matrix: string[][] = [];
    for (const _output of outputs) {
        const row: string[] = [];
        for (const _input of inputs) {
            row.push('X'); // All inputs trigger all outputs
        }
        matrix.push(row);
    }

    return { inputs, outputs, matrix };
}

/**
 * Create Excel workbook from device list and C&E matrix
 */
function createWorkbook(devices: DeviceListEntry[], ceMatrix: { inputs: DeviceListEntry[]; outputs: DeviceListEntry[]; matrix: string[][] }): XLSX.WorkBook {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // === Sheet 1: Device List ===
    const deviceListData: (string | number)[][] = [
        ['Project Name', 'Device Label', 'Type', 'Location', 'Display Text', 'Serial Number', 'Features'],
    ];

    for (const device of devices) {
        deviceListData.push([
            device.projectName,
            device.deviceLabel,
            device.type,
            device.location,
            `${device.deviceLabel} ${device.location}`, // Display Text
            device.serialNumber,
            device.features,  // NEW: Features column
        ]);
    }

    const deviceSheet = XLSX.utils.aoa_to_sheet(deviceListData);

    // Set column widths
    deviceSheet['!cols'] = [
        { wch: 25 }, // Project Name
        { wch: 15 }, // Device Label
        { wch: 15 }, // Type
        { wch: 20 }, // Location
        { wch: 30 }, // Display Text
        { wch: 15 }, // Serial Number
        { wch: 25 }, // Features
    ];

    XLSX.utils.book_append_sheet(workbook, deviceSheet, 'Device List');

    // === Sheet 2: C&E Matrix ===
    const ceData: string[][] = [];

    // Header row - first cell empty, then input labels
    const headerRow = ['Output \\ Input'];
    for (const input of ceMatrix.inputs) {
        headerRow.push(input.deviceLabel);
    }
    ceData.push(headerRow);

    // Data rows - output label, then X marks
    for (let i = 0; i < ceMatrix.outputs.length; i++) {
        const output = ceMatrix.outputs[i];
        const row = [output.deviceLabel];
        row.push(...ceMatrix.matrix[i]);
        ceData.push(row);
    }

    const ceSheet = XLSX.utils.aoa_to_sheet(ceData);

    // Set column widths for C&E Matrix
    const ceCols: { wch: number }[] = [{ wch: 15 }]; // Output column
    for (const _ of ceMatrix.inputs) {
        ceCols.push({ wch: 12 });
    }
    ceSheet['!cols'] = ceCols;

    XLSX.utils.book_append_sheet(workbook, ceSheet, 'C&E Matrix');

    return workbook;
}

/**
 * Export project data to Excel file with Device List and C&E Matrix sheets
 * NEW: Accepts optional placedDevices to export actual devices with features
 */
export function exportToExcel(
    projectName: string,
    svgContent: string,
    placedDevices?: PlacedDevice[]
): void {
    // Generate device list - use placed devices if provided, else fall back to SVG-based
    const devices = placedDevices && placedDevices.length > 0
        ? generateDeviceListFromPlacedDevices(projectName, svgContent, placedDevices)
        : generateDeviceListFromSVG(projectName, svgContent);

    // Generate C&E Matrix
    const ceMatrix = generateCEMatrix(devices);

    // Create workbook
    const workbook = createWorkbook(devices, ceMatrix);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
}

/**
 * Export SVG floor plan as a downloadable file
 */
export function exportSVG(svgContent: string, projectName: string): void {
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.svg`;

    // Create blob from SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Create download link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up object URL
    URL.revokeObjectURL(url);
}

/**
 * Generate Excel workbook as a Blob (for cloud upload without download)
 * NEW: Accepts optional placedDevices to export actual devices with features
 */
export function generateExcelBlob(
    projectName: string,
    svgContent: string,
    placedDevices?: PlacedDevice[]
): Blob {
    // Generate device list - use placed devices if provided, else fall back to SVG-based
    const devices = placedDevices && placedDevices.length > 0
        ? generateDeviceListFromPlacedDevices(projectName, svgContent, placedDevices)
        : generateDeviceListFromSVG(projectName, svgContent);

    // Generate C&E Matrix
    const ceMatrix = generateCEMatrix(devices);

    // Create workbook
    const workbook = createWorkbook(devices, ceMatrix);

    // Write to array buffer and create blob
    const data = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
