import { useState, useEffect, useCallback } from 'react';
import {
    checkStorageHealth,
    listStorageProjects,
    createStorageProject,
    uploadFile,
    getStorageStatus,
    downloadFAConfig,
    checkProjectName,
    type ProjectListItem,
    type ProjectMeta,
} from '../utils/storageApi';

interface CloudSyncProps {
    currentProjectName: string;
    svgContent: string;
    onConfigDownloaded: (configText: string) => void;
    onExcelBlob: () => Blob | null;  // Callback to get Excel blob for upload
}

type SyncStatus = 'offline' | 'idle' | 'syncing' | 'synced' | 'error';

export default function CloudSync({
    currentProjectName,
    svgContent,
    onConfigDownloaded,
    onExcelBlob,
}: CloudSyncProps) {
    const [isOnline, setIsOnline] = useState(false);
    const [cloudProjects, setCloudProjects] = useState<ProjectListItem[]>([]);
    const [linkedProjectId, setLinkedProjectId] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('offline');
    const [projectStatus, setProjectStatus] = useState<ProjectMeta | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Duplicate name confirmation state
    const [showOverwriteConfirm, setShowOverwriteConfirm] = useState(false);
    const [existingProject, setExistingProject] = useState<ProjectMeta | null>(null);

    // Check storage backend health
    useEffect(() => {
        const checkHealth = async () => {
            const online = await checkStorageHealth();
            setIsOnline(online);
            setSyncStatus(online ? 'idle' : 'offline');
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Load cloud projects when online
    useEffect(() => {
        if (isOnline) {
            listStorageProjects()
                .then(setCloudProjects)
                .catch(() => setCloudProjects([]));
        }
    }, [isOnline]);

    // Load project status when linked
    useEffect(() => {
        if (linkedProjectId && isOnline) {
            getStorageStatus(linkedProjectId)
                .then(status => {
                    setProjectStatus(status);
                    setSyncStatus('synced');
                })
                .catch(() => {
                    setLinkedProjectId(null);
                    setProjectStatus(null);
                });
        }
    }, [linkedProjectId, isOnline]);

    // Upload project to cloud
    const handleUpload = useCallback(async (forceOverwrite = false) => {
        if (!isOnline) return;

        setError(null);
        setSyncStatus('syncing');

        try {
            let projectId = linkedProjectId;

            // Check if we need to handle a name change or new project
            const shouldCheckName = !forceOverwrite && (
                !projectId || // Not linked yet
                (projectStatus && projectStatus.name !== currentProjectName) // Name changed
            );

            if (shouldCheckName) {
                const { exists, project } = await checkProjectName(currentProjectName);
                if (exists && project) {
                    // Project with this name already exists - confirm overwrite
                    setExistingProject(project);
                    setShowOverwriteConfirm(true);
                    setSyncStatus('idle');
                    return;
                } else {
                    // Name doesn't exist - create new project
                    const newProject = await createStorageProject(currentProjectName);
                    projectId = newProject.id;
                    setLinkedProjectId(projectId);
                }
            } else if (forceOverwrite && existingProject) {
                // User confirmed overwrite - use the existing project
                projectId = existingProject.id;
                setLinkedProjectId(projectId);
            } else if (!projectId) {
                // Should not happen, but fallback: create new project
                const newProject = await createStorageProject(currentProjectName);
                projectId = newProject.id;
                setLinkedProjectId(projectId);
            }

            // Upload SVG
            await uploadFile(projectId, 'svg', svgContent, `${currentProjectName}.svg`);

            // Upload Excel if available
            const excelBlob = onExcelBlob();
            if (excelBlob) {
                await uploadFile(projectId, 'excel', excelBlob, `${currentProjectName}.xlsx`);
            }

            // Refresh status
            const status = await getStorageStatus(projectId);
            setProjectStatus(status);

            // Refresh project list
            const projects = await listStorageProjects();
            setCloudProjects(projects);

            setSyncStatus('synced');
            setExistingProject(null);
        } catch (err) {
            setSyncStatus('error');
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    }, [isOnline, linkedProjectId, currentProjectName, svgContent, onExcelBlob, existingProject]);

    // Handle overwrite confirmation
    const handleConfirmOverwrite = useCallback(() => {
        setShowOverwriteConfirm(false);
        handleUpload(true);
    }, [handleUpload]);

    const handleCancelOverwrite = useCallback(() => {
        setShowOverwriteConfirm(false);
        setExistingProject(null);
        setSyncStatus('idle');
    }, []);

    // Download config from cloud
    const handleDownloadConfig = useCallback(async () => {
        if (!linkedProjectId || !isOnline) return;

        setError(null);
        setSyncStatus('syncing');

        try {
            const configText = await downloadFAConfig(linkedProjectId);
            onConfigDownloaded(configText);
            setSyncStatus('synced');
        } catch (err) {
            setSyncStatus('error');
            setError(err instanceof Error ? err.message : 'Download failed');
        }
    }, [linkedProjectId, isOnline, onConfigDownloaded]);

    // Link to existing project
    const handleLinkProject = (projectId: string) => {
        setLinkedProjectId(projectId);
        setIsExpanded(false);
    };

    // Status indicator color
    const getStatusColor = () => {
        switch (syncStatus) {
            case 'offline': return 'bg-slate-500';
            case 'idle': return 'bg-blue-500';
            case 'syncing': return 'bg-yellow-500 animate-pulse';
            case 'synced': return 'bg-emerald-500';
            case 'error': return 'bg-red-500';
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'offline': return 'Offline';
            case 'idle': return 'Ready';
            case 'syncing': return 'Syncing...';
            case 'synced': return 'Synced';
            case 'error': return 'Error';
        }
    };

    return (
        <div className="border-t border-slate-700 pt-3 space-y-2">
            {/* Header with status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Cloud Sync
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                    <span className="text-xs text-slate-500">{getStatusText()}</span>
                </div>
            </div>

            {!isOnline ? (
                <p className="text-xs text-slate-500 italic">
                    Storage backend not available
                </p>
            ) : (
                <>
                    {/* Linked project info */}
                    {linkedProjectId && projectStatus && (
                        <div className="bg-slate-700/30 rounded-lg p-2 text-xs">
                            <p className="text-slate-300 font-medium truncate">{projectStatus.name}</p>
                            <div className="flex gap-2 mt-1 text-slate-500">
                                {projectStatus.files.svg && <span>📐 SVG</span>}
                                {projectStatus.files.excel && <span>📊 Excel</span>}
                                {projectStatus.files.faconfig && <span>⚙️ Config</span>}
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleUpload()}
                            disabled={syncStatus === 'syncing'}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 
                       bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50
                       rounded text-xs font-medium transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload
                        </button>

                        {linkedProjectId && projectStatus?.files.faconfig && (
                            <button
                                onClick={handleDownloadConfig}
                                disabled={syncStatus === 'syncing'}
                                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 
                         bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50
                         rounded text-xs font-medium transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Get Config
                            </button>
                        )}
                    </div>

                    {/* Link to existing project */}
                    {!linkedProjectId && cloudProjects.length > 0 && (
                        <div>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                Link to existing project
                            </button>

                            {isExpanded && (
                                <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                                    {cloudProjects.map(project => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleLinkProject(project.id)}
                                            className="w-full text-left px-2 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded text-xs"
                                        >
                                            <p className="text-slate-300 truncate">{project.name}</p>
                                            <p className="text-slate-500">
                                                {[
                                                    project.hasFiles.svg && 'SVG',
                                                    project.hasFiles.excel && 'Excel',
                                                    project.hasFiles.faconfig && 'Config'
                                                ].filter(Boolean).join(' · ') || 'Empty'}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="text-xs text-red-400">{error}</p>
                    )}
                </>
            )}

            {/* Overwrite Confirmation Modal */}
            {showOverwriteConfirm && existingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={handleCancelOverwrite} />
                    <div className="relative bg-slate-800 rounded-xl shadow-2xl p-4 max-w-sm mx-4 border border-slate-700">
                        <h3 className="text-sm font-semibold text-white mb-2">Project Already Exists</h3>
                        <p className="text-xs text-slate-400 mb-3">
                            A project named "<span className="text-white font-medium">{existingProject.name}</span>" already exists in cloud storage.
                        </p>
                        <p className="text-xs text-yellow-400 mb-4">
                            ⚠️ Uploading will overwrite the existing files.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={handleCancelOverwrite}
                                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmOverwrite}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-500 rounded transition-colors"
                            >
                                Overwrite
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
