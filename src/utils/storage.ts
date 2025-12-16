// LocalStorage utility for project persistence

import type { SavedProject, ProjectListEntry } from '../types/storage';

const PROJECTS_LIST_KEY = 'alarm-simulator:projects';
const PROJECT_KEY_PREFIX = 'alarm-simulator:project:';

/**
 * Generate a unique project ID
 */
export function generateProjectId(): string {
    return crypto.randomUUID();
}

/**
 * Get list of all saved projects (metadata only)
 */
export function getProjectList(): ProjectListEntry[] {
    try {
        const data = localStorage.getItem(PROJECTS_LIST_KEY);
        if (!data) return [];
        return JSON.parse(data) as ProjectListEntry[];
    } catch (error) {
        console.error('Failed to load project list:', error);
        return [];
    }
}

/**
 * Save project list to storage
 */
function saveProjectList(list: ProjectListEntry[]): void {
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list));
}

/**
 * Save project to LocalStorage
 */
export function saveProject(project: Omit<SavedProject, 'version' | 'savedAt'>): void {
    const savedAt = new Date().toISOString();
    const fullProject: SavedProject = {
        version: 1,
        savedAt,
        ...project,
    };

    try {
        // Save the project data
        localStorage.setItem(PROJECT_KEY_PREFIX + project.id, JSON.stringify(fullProject));

        // Update the project list
        const list = getProjectList();
        const existingIndex = list.findIndex(p => p.id === project.id);

        const entry: ProjectListEntry = {
            id: project.id,
            name: project.name,
            savedAt,
        };

        if (existingIndex >= 0) {
            list[existingIndex] = entry;
        } else {
            list.push(entry);
        }

        saveProjectList(list);
    } catch (error) {
        console.error('Failed to save project:', error);
        throw new Error('Failed to save project. Storage might be full.');
    }
}

/**
 * Load project from LocalStorage by ID
 * @returns SavedProject or null if not found
 */
export function loadProject(id: string): SavedProject | null {
    try {
        const data = localStorage.getItem(PROJECT_KEY_PREFIX + id);
        if (!data) return null;

        const project = JSON.parse(data) as SavedProject;

        // Version check for future migrations
        if (project.version !== 1) {
            console.warn('Unknown project version:', project.version);
        }

        return project;
    } catch (error) {
        console.error('Failed to load project:', error);
        return null;
    }
}

/**
 * Delete saved project from LocalStorage by ID
 */
export function deleteProject(id: string): void {
    localStorage.removeItem(PROJECT_KEY_PREFIX + id);

    // Update project list
    const list = getProjectList().filter(p => p.id !== id);
    saveProjectList(list);
}

/**
 * Check if any saved projects exist
 */
export function hasSavedProjects(): boolean {
    return getProjectList().length > 0;
}

/**
 * Get the most recently saved project
 */
export function getMostRecentProject(): SavedProject | null {
    const list = getProjectList();
    if (list.length === 0) return null;

    // Sort by savedAt descending
    const sorted = [...list].sort((a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    return loadProject(sorted[0].id);
}
