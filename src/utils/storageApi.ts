/**
 * API client for the Fire Alarm Storage Backend
 */

const API_BASE = 'http://localhost:3000/api/v1';

export interface ProjectListItem {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    hasFiles: {
        svg: boolean;
        excel: boolean;
        faconfig: boolean;
    };
}

export interface ProjectMeta {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    files: {
        svg?: { uploadedAt: string; size: number };
        excel?: { uploadedAt: string; size: number };
        faconfig?: { uploadedAt: string; size: number };
    };
}

export interface FileInfo {
    filename: string;
    originalName: string;
    uploadedAt: string;
    size: number;
}

export type FileType = 'svg' | 'excel' | 'faconfig';

/**
 * Check if storage backend is available
 */
export async function checkStorageHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE.replace('/api/v1', '')}/health`);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * List all projects from storage
 */
export async function listStorageProjects(): Promise<ProjectListItem[]> {
    const response = await fetch(`${API_BASE}/projects`);
    if (!response.ok) throw new Error('Failed to list projects');
    return response.json();
}

/**
 * Get project details
 */
export async function getStorageProject(projectId: string): Promise<ProjectMeta> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`);
    if (!response.ok) throw new Error('Project not found');
    return response.json();
}

/**
 * Create a new project in storage
 */
export async function createStorageProject(name: string): Promise<ProjectMeta> {
    const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

/**
 * Check if a project with the given name already exists
 */
export async function checkProjectName(name: string): Promise<{ exists: boolean; project: ProjectMeta | null }> {
    const response = await fetch(`${API_BASE}/projects/check-name/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error('Failed to check project name');
    return response.json();
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
    projectId: string,
    fileType: FileType,
    content: Blob | string,
    filename: string
): Promise<FileInfo> {
    const formData = new FormData();

    if (typeof content === 'string') {
        const blob = new Blob([content], {
            type: fileType === 'svg' ? 'image/svg+xml' :
                fileType === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                    'application/json'
        });
        formData.append('file', blob, filename);
    } else {
        formData.append('file', content, filename);
    }

    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${fileType}`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error(`Failed to upload ${fileType} file`);
    return response.json();
}

/**
 * Download a file from storage
 */
export async function downloadFile(projectId: string, fileType: FileType): Promise<Blob> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/${fileType}`);
    if (!response.ok) throw new Error(`${fileType} file not found`);
    return response.blob();
}

/**
 * Download faconfig as text
 */
export async function downloadFAConfig(projectId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/files/faconfig`);
    if (!response.ok) throw new Error('Config file not found');
    return response.text();
}

/**
 * Get project sync status
 */
export async function getStorageStatus(projectId: string): Promise<ProjectMeta> {
    const response = await fetch(`${API_BASE}/projects/${projectId}/status`);
    if (!response.ok) throw new Error('Project not found');
    return response.json();
}
