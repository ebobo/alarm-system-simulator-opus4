// Panel Sidebar - tabbed container for Config and Modules views
// Replaces ConfigStatusSidebar with tabbed interface

import type { FAConfig } from '../../types/faconfig';
import type { DeviceMatchResult } from '../../utils/faconfigParser';
import type { PanelModule } from '../../types/modules';
import ConfigTab from './ConfigTab';
import ModulesTab from './ModulesTab';

type TabType = 'config' | 'modules';

interface PanelSidebarProps {
    config: FAConfig | null;
    matchResult: DeviceMatchResult | null;
    isPoweredOn: boolean;
    modules: PanelModule[];
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    // Config tab section collapse states
    isConfigDevicesCollapsed: boolean;
    onToggleConfigDevicesCollapsed: () => void;
    isConfigZonesCollapsed: boolean;
    onToggleConfigZonesCollapsed: () => void;
    floorPlanProjectName?: string;
}

export default function PanelSidebar({
    config,
    matchResult,
    isPoweredOn,
    modules,
    activeTab,
    onTabChange,
    isCollapsed,
    onToggleCollapse,
    isConfigDevicesCollapsed,
    onToggleConfigDevicesCollapsed,
    isConfigZonesCollapsed,
    onToggleConfigZonesCollapsed,
    floorPlanProjectName
}: PanelSidebarProps) {

    // Get status indicator color for header icon
    const getStatusColor = () => {
        if (!config) return 'from-slate-400 to-slate-500';
        if (!isPoweredOn) return 'from-amber-400 to-amber-600';
        if (matchResult?.valid) return 'from-green-400 to-green-600';
        return 'from-red-400 to-red-600';
    };

    // Get solid color for collapsed status dot
    const getStatusDotColor = () => {
        if (!config) return 'bg-slate-500';
        if (!isPoweredOn) return 'bg-amber-500';
        if (matchResult?.valid) return 'bg-green-500';
        return 'bg-red-500';
    };

    const getStatusText = () => {
        if (modules.length === 0) return 'No Panel';
        if (!config) return 'No Config';
        if (!isPoweredOn) return 'Loaded';
        if (matchResult?.valid) return 'Verified';
        return 'Mismatch';
    };

    // Collapsed view - narrow strip with status dot and vertical label
    if (isCollapsed) {
        return (
            <div className="flex-1 flex flex-col items-center py-4 text-white overflow-hidden">
                {/* Expand button at top */}
                <button
                    onClick={onToggleCollapse}
                    className="w-8 h-8 mb-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                    title="Expand Panel Status"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Status dot */}
                <div className={`w-4 h-4 ${getStatusDotColor()} rounded-full mb-4`} title={getStatusText()} />

                {/* Panel icon */}
                <div className={`w-8 h-8 bg-gradient-to-br ${getStatusColor()} rounded-lg flex items-center justify-center mb-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </div>

                {/* Vertical label */}
                <div className="flex-1 flex items-center">
                    <span
                        className="text-xs font-semibold text-slate-400 whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                        Panel Status
                    </span>
                </div>
            </div>
        );
    }

    // Expanded view - full content
    return (
        <div className="flex-1 flex flex-col text-white overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-br ${getStatusColor()} rounded-lg flex items-center justify-center`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold">Panel Status</h2>
                        <p className="text-xs text-slate-400">{getStatusText()}</p>
                    </div>
                    {/* Collapse button */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
                        title="Collapse Panel Status"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-700">
                <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'modules'
                        ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                    onClick={() => onTabChange('modules')}
                >
                    <span className="flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Modules
                        {modules.length > 0 && (
                            <span className="text-[10px] bg-slate-600 px-1.5 rounded-full">
                                {modules.length}
                            </span>
                        )}
                    </span>
                </button>
                <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'config'
                        ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                    onClick={() => onTabChange('config')}
                >
                    <span className="flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Config
                    </span>
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'modules' ? (
                <ModulesTab modules={modules} />
            ) : (
                <ConfigTab
                    config={config}
                    matchResult={matchResult}
                    isPoweredOn={isPoweredOn}
                    isDevicesCollapsed={isConfigDevicesCollapsed}
                    onToggleDevicesCollapsed={onToggleConfigDevicesCollapsed}
                    isZonesCollapsed={isConfigZonesCollapsed}
                    onToggleZonesCollapsed={onToggleConfigZonesCollapsed}
                    floorPlanProjectName={floorPlanProjectName}
                />
            )}
        </div>
    );
}

