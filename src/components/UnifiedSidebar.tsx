// UnifiedSidebar - Combined sidebar with 3 tabs: Devices, Panel Status, Configuration
// Replaces separate DevicePalette and PanelSidebar

import { useDraggable } from '@dnd-kit/core';
import { DEVICE_TYPES } from '../types/devices';
import type { DeviceType } from '../types/devices';
import type { FAConfig } from '../types/faconfig';
import type { DeviceMatchResult } from '../utils/faconfigParser';
import type { PanelModule } from '../types/modules';
import ModulesTab from './panel/ModulesTab';
import ConfigTab from './panel/ConfigTab';

export type UnifiedSidebarTab = 'devices' | 'panel-status' | 'configuration';

interface DraggableDeviceItemProps {
    deviceType: DeviceType;
}

/**
 * Individual draggable device item (extracted from DevicePalette)
 */
function DraggableDeviceItem({ deviceType }: DraggableDeviceItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${deviceType.id}`,
        data: {
            type: 'device',
            deviceTypeId: deviceType.id,
        },
    });

    // Get category-specific styling
    const getCategoryStyles = (category: DeviceType['category']) => {
        switch (category) {
            case 'detector':
                return {
                    bg: 'bg-blue-500/20',
                    icon: 'text-blue-400',
                    border: 'border-blue-500/30',
                };
            case 'sounder':
                return {
                    bg: 'bg-orange-500/20',
                    icon: 'text-orange-400',
                    border: 'border-orange-500/30',
                };
            case 'mcp':
                return {
                    bg: 'bg-red-500/20',
                    icon: 'text-red-400',
                    border: 'border-red-500/30',
                };
            case 'io':
                return {
                    bg: 'bg-green-500/20',
                    icon: 'text-green-400',
                    border: 'border-green-500/30',
                };
            case 'controller':
                return {
                    bg: 'bg-cyan-500/20',
                    icon: 'text-cyan-400',
                    border: 'border-cyan-500/30',
                };
        }
    };

    const styles = getCategoryStyles(deviceType.category);

    // Hide completely while dragging
    if (isDragging) {
        return <div ref={setNodeRef} className="h-0 overflow-hidden" {...listeners} {...attributes} />;
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-2 cursor-grab active:cursor-grabbing
                       transition-all duration-200 border border-slate-600/50 relative overflow-hidden group"
        >
            <div className="flex items-center gap-3">
                {/* Device icon - different shape based on category */}
                <div className={`w-10 h-10 shrink-0 ${styles.bg} rounded-lg flex items-center justify-center ${styles.border} border`}>
                    {deviceType.id === 'panel' ? (
                        // Panel icon - rectangle with "P" label
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-3 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">P</text>
                        </svg>
                    ) : deviceType.category === 'controller' ? (
                        // Rectangle icon for controller/loop driver
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-3 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">LD</text>
                        </svg>
                    ) : deviceType.category === 'mcp' ? (
                        // Square icon for MCP (Manual Call Point)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="2" />
                            <path d="M7 12h10M12 7v10" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ) : deviceType.category === 'sounder' ? (
                        // Circle with sound waves for sounder
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="8" strokeWidth="2" />
                            <path d="M9 10 Q7 12 9 14" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M15 10 Q17 12 15 14" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ) : deviceType.id === 'input-unit' ? (
                        // Input Unit icon - rectangular with IN label
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-6 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">IN</text>
                        </svg>
                    ) : deviceType.id === 'output-unit' ? (
                        // Output Unit icon - rectangular with OUT label
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-6 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">OUT</text>
                        </svg>
                    ) : deviceType.id === 'AG-head' ? (
                        // AG Head icon - white dome with red LED (smaller version)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" fill="#F8FAFC" />
                            <circle cx="12" cy="12" r="5" strokeWidth="1.5" fill="#E2E8F0" />
                            <circle cx="12" cy="12" r="2" strokeWidth="1" fill="#EF4444" />
                        </svg>
                    ) : (
                        // Circle icon for detectors
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <circle cx="12" cy="12" r="4" strokeWidth="2" />
                        </svg>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col items-start overflow-hidden">
                    <p className="text-sm font-bold text-white truncate w-full" title={deviceType.name}>
                        {deviceType.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate w-full">
                        {deviceType.terminals.length} terminals
                    </p>
                </div>
            </div>
        </div>
    );
}

/**
 * Devices tab content - draggable device list
 */
function DevicesTabContent() {
    const deviceTypes = Object.values(DEVICE_TYPES);

    return (
        <div className="flex-1 p-3 overflow-y-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Loop Devices
            </h3>

            {/* 2-column grid layout */}
            <div className="grid grid-cols-2 gap-2">
                {/* Row 1: AG Socket, AG Head */}
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'AG-socket')!} />
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'AG-head')!} />

                {/* Row 2: MCP, Sounder */}
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'mcp')!} />
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'sounder')!} />

                {/* Row 3: Input Unit, Output Unit */}
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'input-unit')!} />
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'output-unit')!} />

                {/* Row 4: Loop Driver, Panel */}
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'loop-driver')!} />
                <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'panel')!} />
            </div>

            {/* Future devices placeholder */}
            <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-xs text-slate-500 text-center italic">
                    More devices coming soon
                </p>
            </div>
        </div>
    );
}

interface UnifiedSidebarProps {
    // View state
    activeView: 'floorplan' | 'panel' | 'simulation';

    // Tab state
    activeTab: UnifiedSidebarTab;
    onTabChange: (tab: UnifiedSidebarTab) => void;

    // Collapse state
    isCollapsed: boolean;
    onToggleCollapse: () => void;

    // Lock state - when locked, sidebar stays collapsed and cannot be expanded
    isLocked?: boolean;

    // Panel Status tab props
    modules: PanelModule[];

    // Configuration tab props
    config: FAConfig | null;
    matchResult: DeviceMatchResult | null;
    isPoweredOn: boolean;
    isConfigDevicesCollapsed: boolean;
    onToggleConfigDevicesCollapsed: () => void;
    isConfigZonesCollapsed: boolean;
    onToggleConfigZonesCollapsed: () => void;
    floorPlanProjectName?: string;
}

export default function UnifiedSidebar({
    activeView,
    activeTab,
    onTabChange,
    isCollapsed,
    onToggleCollapse,
    isLocked = false,
    modules,
    config,
    matchResult,
    isPoweredOn,
    isConfigDevicesCollapsed,
    onToggleConfigDevicesCollapsed,
    isConfigZonesCollapsed,
    onToggleConfigZonesCollapsed,
    floorPlanProjectName
}: UnifiedSidebarProps) {

    // Devices tab is disabled in panel and simulation views
    const isDevicesDisabled = activeView === 'panel' || activeView === 'simulation';

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

    // Collapsed view - narrow strip with icon and vertical label
    // When locked, always show collapsed view and disable expand button
    if (isCollapsed || isLocked) {
        return (
            <div className="flex-1 flex flex-col items-center py-4 text-white overflow-hidden">
                {/* Expand button at top - disabled when locked */}
                <button
                    onClick={onToggleCollapse}
                    disabled={isLocked}
                    className={`w-8 h-8 mb-4 rounded-lg flex items-center justify-center transition-colors ${isLocked
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                    title={isLocked ? 'Generate a floor plan to use Control Panel' : 'Expand Control Panel'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Status dot */}
                <div className={`w-4 h-4 ${isLocked ? 'bg-slate-600' : getStatusDotColor()} rounded-full mb-4`} title={isLocked ? 'No floor plan' : getStatusText()} />

                {/* Control Panel icon */}
                <div className={`w-8 h-8 bg-gradient-to-br ${isLocked ? 'from-slate-600 to-slate-700' : getStatusColor()} rounded-lg flex items-center justify-center mb-4`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                </div>

                {/* Vertical label */}
                <div className="flex-1 flex items-center">
                    <span
                        className={`text-xs font-semibold whitespace-nowrap ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                        Control Panel
                    </span>
                </div>
            </div>
        );
    }

    // Expanded view - full content with tabs
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
                        <h2 className="text-sm font-semibold">Control Panel</h2>
                        <p className="text-xs text-slate-400">{getStatusText()}</p>
                    </div>
                    {/* Collapse button */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
                        title="Collapse Control Panel"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tab Bar - 3 tabs */}
            <div className="flex border-b border-slate-700">
                {/* Devices Tab */}
                <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${isDevicesDisabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : activeTab === 'devices'
                            ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                            : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                    onClick={() => !isDevicesDisabled && onTabChange('devices')}
                    disabled={isDevicesDisabled}
                    title={isDevicesDisabled ? 'Devices tab is not available in Panel view' : undefined}
                >
                    <span className="flex items-center justify-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Devices
                    </span>
                </button>

                {/* Panel Status Tab */}
                <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'panel-status'
                        ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                    onClick={() => onTabChange('panel-status')}
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

                {/* Configuration Tab */}
                <button
                    className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === 'configuration'
                        ? 'text-white border-b-2 border-blue-500 bg-slate-800/50'
                        : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }`}
                    onClick={() => onTabChange('configuration')}
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
            {activeTab === 'devices' ? (
                <DevicesTabContent />
            ) : activeTab === 'panel-status' ? (
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
