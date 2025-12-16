// Storage type definitions for saved projects

import type { RoomConfig } from '../utils/floorPlanGenerator';
import type { PlacedDevice, Connection } from './devices';

/**
 * Project list entry (metadata only, for sidebar display)
 */
export interface ProjectListEntry {
    id: string;           // Unique project identifier
    name: string;         // User-defined project name
    savedAt: string;      // ISO timestamp of last save
}

/**
 * Saved project structure for LocalStorage persistence
 */
export interface SavedProject {
    version: 1;
    id: string;                   // Unique project identifier
    name: string;                 // User-defined project name
    savedAt: string;              // ISO timestamp
    config: RoomConfig;           // Room configuration used
    svgContent: string;           // Generated floor plan SVG
    placedDevices: PlacedDevice[];
    connections: Connection[];
}
