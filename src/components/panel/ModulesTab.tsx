// Modules Tab - displays list of panel modules with status
// Part of tabbed panel sidebar

import { useState } from 'react';
import type { PanelModule } from '../../types/modules';
import { MODULE_TYPE_CONFIG } from '../../types/modules';

interface ModulesTabProps {
    modules: PanelModule[];
}

export default function ModulesTab({ modules }: ModulesTabProps) {
    // Track which loop driver cards are expanded (by module id)
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    const toggleExpanded = (moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    // Status indicator colors
    const getStatusColor = (status: PanelModule['status']) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'offline': return 'bg-slate-500';
            case 'fault': return 'bg-red-500';
        }
    };

    const getStatusText = (status: PanelModule['status']) => {
        switch (status) {
            case 'online': return 'Online';
            case 'offline': return 'Offline';
            case 'fault': return 'Fault';
        }
    };

    // Map color class to icon background
    const getIconBgClass = (colorClass: string) => {
        switch (colorClass) {
            case 'blue': return 'bg-blue-500/20 border-blue-500/30';
            case 'amber': return 'bg-amber-500/20 border-amber-500/30';
            case 'cyan': return 'bg-cyan-500/20 border-cyan-500/30';
            default: return 'bg-slate-500/20 border-slate-500/30';
        }
    };

    const getIconTextClass = (colorClass: string) => {
        switch (colorClass) {
            case 'blue': return 'text-blue-400';
            case 'amber': return 'text-amber-400';
            case 'cyan': return 'text-cyan-400';
            default: return 'text-slate-400';
        }
    };

    // Find loop driver with devices for flex expansion
    const loopDriverWithDevices = modules.find(m =>
        m.type === 'loop-driver' && m.connectedDevices && m.connectedDevices.length > 0
    );
    const isAnyLoopDriverExpanded = loopDriverWithDevices && expandedModules.has(loopDriverWithDevices.id);

    return (
        <div className="flex-1 p-4 overflow-y-auto flex flex-col">
            {/* No modules message */}
            {modules.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 bg-slate-700/50 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <p className="text-slate-400 text-sm">No modules detected</p>
                    <p className="text-slate-500 text-xs mt-1">Add a Panel to the floor plan</p>
                </div>
            )}

            {/* Module list */}
            {modules.length > 0 && (
                <>
                    {/* Header */}
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex-shrink-0">
                        Installed Modules ({modules.length})
                    </h3>

                    {/* Module cards */}
                    <div className={`space-y-2 ${isAnyLoopDriverExpanded ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                        {modules.map(module => {
                            const config = MODULE_TYPE_CONFIG[module.type];
                            const hasDevices = module.type === 'loop-driver' &&
                                module.connectedDevices && module.connectedDevices.length > 0;
                            const isExpanded = expandedModules.has(module.id);

                            return (
                                <div
                                    key={module.id}
                                    className={`bg-slate-700/50 rounded-lg border border-slate-600/50 overflow-hidden flex-shrink-0 ${hasDevices && isExpanded ? 'flex-1 flex flex-col min-h-0' : ''
                                        }`}
                                >
                                    {/* Module header - clickable for loop drivers */}
                                    <div
                                        className={`p-3 ${hasDevices ? 'cursor-pointer hover:bg-slate-600/30' : ''}`}
                                        onClick={hasDevices ? () => toggleExpanded(module.id) : undefined}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Icon */}
                                            <div className={`w-8 h-8 ${getIconBgClass(config.colorClass)} rounded-lg flex items-center justify-center border`}>
                                                <span className={`text-sm ${getIconTextClass(config.colorClass)}`}>
                                                    {config.icon}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {module.label}
                                                    </p>
                                                    <span className="text-xs text-slate-500">
                                                        #{String(module.slotPosition).padStart(2, '0')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {/* Status indicator */}
                                                    <span className={`w-2 h-2 rounded-full ${getStatusColor(module.status)}`} />
                                                    <span className="text-xs text-slate-400">
                                                        {getStatusText(module.status)}
                                                    </span>

                                                    {/* Loop driver specific info */}
                                                    {module.type === 'loop-driver' && module.connectedDeviceCount !== undefined && (
                                                        <span className="text-xs text-slate-500">
                                                            | {module.connectedDeviceCount} device{module.connectedDeviceCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expand/collapse chevron for loop drivers */}
                                            {hasDevices && (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connected devices list for loop drivers (only when expanded) */}
                                    {hasDevices && isExpanded && (
                                        <div className="border-t border-slate-600/30 bg-slate-800/30 flex-1 flex flex-col min-h-0 overflow-hidden">
                                            <div className="px-3 py-2 flex flex-col flex-1 min-h-0">
                                                <div className="flex text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 gap-2 flex-shrink-0">
                                                    <span className="flex-1">Device</span>
                                                    <span className="w-24 text-right">Serial Number</span>
                                                </div>
                                                <div className="flex-1 overflow-y-auto space-y-1">
                                                    {module.connectedDevices!.map(device => (
                                                        <div
                                                            key={device.instanceId}
                                                            className="flex items-center gap-2 text-xs hover:bg-slate-700/30 rounded px-1 py-0.5"
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-cyan-500/50 flex-shrink-0" />
                                                            <span className="text-slate-300 truncate flex-1" title={device.label}>
                                                                {device.label}
                                                            </span>
                                                            <span className="text-slate-500 font-mono text-[10px] w-24 text-right flex-shrink-0">
                                                                {device.sn.toString(16).toUpperCase().padStart(12, '0')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
