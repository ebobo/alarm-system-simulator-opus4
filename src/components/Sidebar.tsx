import type { ProjectListEntry } from '../types/storage';

interface SidebarProps {
    onGenerate: () => void;
    onOpenConfig: () => void;
    onExport: () => void;
    projectList: ProjectListEntry[];
    currentProjectId: string | null;
    currentProjectName: string;
    onSelectProject: (id: string) => void;
    activeView: 'floorplan' | 'panel';
    onImportConfig?: () => void;
    onExportConfig?: () => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export default function Sidebar({
    onGenerate,
    onOpenConfig,
    onExport,
    projectList,
    currentProjectId,
    currentProjectName,
    onSelectProject,
    activeView,
    onImportConfig,
    onExportConfig,
    isCollapsed,
    onToggleCollapse
}: SidebarProps) {
    // Format relative time for display
    const formatRelativeTime = (isoDate: string): string => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Collapsed view
    if (isCollapsed) {
        return (
            <div className="w-12 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
                {/* Header - just icon with expand button */}
                <div className="p-2 border-b border-slate-700 flex flex-col items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                        </svg>
                    </div>
                    {/* Expand button - same style as DevicePalette */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
                        title="Expand sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action buttons - icon only */}
                <div className="p-2 border-t border-slate-700 space-y-2">
                    {activeView === 'floorplan' ? (
                        <>
                            <button
                                onClick={onExport}
                                className="w-8 h-8 mx-auto bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-colors"
                                title="Export Data"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>

                            <button
                                onClick={onOpenConfig}
                                className="w-8 h-8 mx-auto bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                                title="Configure Rooms"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>

                            <button
                                onClick={onGenerate}
                                className="w-8 h-8 mx-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-orange-500/25"
                                title="Generate New Plan"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={onImportConfig}
                                className="w-8 h-8 mx-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg flex items-center justify-center transition-colors shadow-lg shadow-orange-500/25"
                                title="Import Config"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </button>

                            <button
                                onClick={onExportConfig}
                                className="w-8 h-8 mx-auto bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center transition-colors"
                                title="Export Config"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-56 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold">Fire Alarm</h1>
                        <p className="text-xs text-slate-400">System Simulation</p>
                    </div>
                    {/* Collapse button - same style as DevicePalette */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
                        title="Collapse sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Plans Section */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Project List
                </h2>

                <div className="space-y-2">
                    {/* Current unsaved project (if working on Generated Plan) */}
                    {currentProjectName === 'New Project' && (
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-orange-500/50 group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">New Project</p>
                                    <p className="text-xs text-orange-400">Unsaved</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                            </div>
                        </div>
                    )}

                    {/* Saved projects */}
                    {projectList.map((project) => {
                        const isActive = project.id === currentProjectId;
                        return (
                            <div
                                key={project.id}
                                onClick={() => !isActive && onSelectProject(project.id)}
                                className={`rounded-lg p-3 cursor-pointer transition-all duration-200 border group
                                    ${isActive
                                        ? 'bg-slate-700/50 border-emerald-500/50'
                                        : 'bg-slate-700/30 hover:bg-slate-700 border-slate-600/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                                        ${isActive ? 'bg-emerald-500/20' : 'bg-slate-600/50'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                                        <p className="text-xs text-slate-400">{formatRelativeTime(project.savedAt)}</p>
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty state */}
                    {projectList.length === 0 && currentProjectName !== 'New Project' && (
                        <div className="text-center py-4 text-slate-500 text-sm">
                            No saved projects
                        </div>
                    )}
                </div>
            </div>

            {/* Actions - view-specific */}
            <div className="p-4 border-t border-slate-700 space-y-3">
                {activeView === 'floorplan' ? (
                    <>
                        <button
                            onClick={onExport}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 
                             rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Data
                        </button>

                        <button
                            onClick={onOpenConfig}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 
                             rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Configure Rooms
                        </button>

                        <button
                            onClick={onGenerate}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                             bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600
                             rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-orange-500/25"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Generate New Plan
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={onImportConfig}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                             bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600
                             rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-orange-500/25"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import Config
                        </button>

                        <button
                            onClick={onExportConfig}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 
                             rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Config
                        </button>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                    {activeView === 'floorplan' ? 'Floor Plan Designer' : 'Panel Simulator'}
                </p>
            </div>
        </div>
    );
}

