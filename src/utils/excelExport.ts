// Excel Export Utility for Fire Alarm System
// Generates Device List and C&E Matrix sheets

import * as XLSX from 'xlsx';
import type { RoomConfig, RoomType } from './floorPlanGenerator';

// Device types for export
type DeviceExportType = 'H/M Detector' | 'MCP' | 'Loop Sounder';

interface DeviceListEntry {
    projectName: string;
    deviceLabel: string;
    type: DeviceExportType;
    location: string;
    serialNumber: string; // Always empty for export
}

interface CEMatrixEntry {
    outputDevice: string;
    outputLocation: string;
    triggers: Map<string, string>; // input device label -> "X" or number for AND group
}

/**
 * Room labels for unique naming
 */
const ROOM_LABELS: Record<RoomType, string> = {
    office: 'Office',
    meeting: 'Meeting Room',
    toilet: 'Toilet',
    entrance: 'Main Entrance',
    public: 'Public Area',
    server: 'Server Room',
    storage: 'Storage',
};

/**
 * Extract room list from SVG content by parsing room labels
 */
function extractRoomsFromSVG(svgContent: string): { type: RoomType; label: string }[] {
    const rooms: { type: RoomType; label: string }[] = [];

    // Parse data-unique-label attribute to find distinct rooms
    // This allows finding "Toilet 1", "Toilet 2" even if visual text is just "Toilet"
    const labelRegex = /data-unique-label="([^"]+)"/g;
    let match;

    while ((match = labelRegex.exec(svgContent)) !== null) {
        const uniqueLabel = match[1];

        // Determine room type from label
        let roomType: RoomType | null = null;

        if (uniqueLabel.startsWith('Office')) {
            roomType = 'office';
        } else if (uniqueLabel.startsWith('Meeting Room')) {
            roomType = 'meeting';
        } else if (uniqueLabel.startsWith('Toilet')) {
            roomType = 'toilet';
        } else if (uniqueLabel === 'Main Entrance') {
            roomType = 'entrance';
        } else if (uniqueLabel === 'Public Area') {
            roomType = 'public';
        } else if (uniqueLabel.startsWith('Server Room')) {
            roomType = 'server';
        } else if (uniqueLabel.startsWith('Storage')) {
            roomType = 'storage';
        }

        if (roomType) {
            rooms.push({ type: roomType, label: uniqueLabel });
        }
    }

    return rooms;
}

/**
 * Generate device list from room configuration and SVG
 */
function generateDeviceList(
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
    });

    // Add Loop Sounder in public area
    devices.push({
        projectName,
        deviceLabel: createLabel(),
        type: 'Loop Sounder',
        location: publicAreaLabel,
        serialNumber: '',
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
    const inputs = devices.filter(d => d.type === 'H/M Detector' || d.type === 'MCP');

    // Outputs: Sounders
    const outputs = devices.filter(d => d.type === 'Loop Sounder');

    // Create matrix - all X's for OR logic
    const matrix: string[][] = [];
    for (const output of outputs) {
        const row: string[] = [];
        for (const input of inputs) {
            row.push('X'); // All inputs trigger all outputs
        }
        matrix.push(row);
    }

    return { inputs, outputs, matrix };
}

/**
 * Export project data to Excel file with Device List and C&E Matrix sheets
 */
export function exportToExcel(
    projectName: string,
    svgContent: string
): void {
    // Generate device list
    const devices = generateDeviceList(projectName, svgContent);

    // Generate C&E Matrix
    const ceMatrix = generateCEMatrix(devices);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // === Sheet 1: Device List ===
    const deviceListData: (string | number)[][] = [
        ['Project Name', 'Device Label', 'Type', 'Location', 'Display Text', 'Serial Number'],
    ];

    for (const device of devices) {
        deviceListData.push([
            device.projectName,
            device.deviceLabel,
            device.type,
            device.location,
            `${device.deviceLabel} ${device.location}`, // Display Text
            device.serialNumber,
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

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(workbook, filename);
}
