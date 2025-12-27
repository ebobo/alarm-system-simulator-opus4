// Storage type definitions for saved projects

import type { RoomConfig } from '../utils/floorPlanGenerator';
import type { PlacedDevice, Connection } from './devices';
import type { FAConfig } from './faconfig';

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
 * 
 * Storage info:
 * - Uses browser localStorage (5-10MB limit depending on browser)
 * - Persists until manually cleared or browser data is cleared
 * - FAConfig is typically small (a few KB)
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
    faConfig?: FAConfig;          // Optional: uploaded .faconfig data
}

