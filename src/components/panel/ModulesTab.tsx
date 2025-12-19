// Modules Tab - displays list of panel modules with status
// Part of tabbed panel sidebar

import type { PanelModule } from '../../types/modules';
import { MODULE_TYPE_CONFIG } from '../../types/modules';

interface ModulesTabProps {
    modules: PanelModule[];
}

export default function ModulesTab({ modules }: ModulesTabProps) {
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

    // Get icon background color class
    const getIconBgClass = (colorClass: string) => {
        const colors: Record<string, string> = {
            'blue': 'bg-blue-500/20 border-blue-500/30',
            'amber': 'bg-amber-500/20 border-amber-500/30',
            'green': 'bg-green-500/20 border-green-500/30'
        };
        return colors[colorClass] || colors['blue'];
    };

    const getIconTextClass = (colorClass: string) => {
        const colors: Record<string, string> = {
            'blue': 'text-blue-400',
            'amber': 'text-amber-400',
            'green': 'text-green-400'
        };
        return colors[colorClass] || colors['blue'];
    };

    return (
        <div className="flex-1 p-3 overflow-y-auto">
            {/* No modules state */}
            {modules.length === 0 && (
                <div className="text-center py-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-sm text-slate-400">No panel installed</p>
                    <p className="text-xs text-slate-500 mt-2">
                        Drag panel to floor plan
                    </p>
                </div>
            )}

            {/* Module list */}
            {modules.length > 0 && (
                <>
                    {/* Header */}
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                        Installed Modules ({modules.length})
                    </h3>

                    {/* Module cards */}
                    <div className="space-y-2 mb-4">
                        {modules.map(module => {
                            const config = MODULE_TYPE_CONFIG[module.type];
                            const hasDevices = module.type === 'loop-driver' &&
                                module.connectedDevices && module.connectedDevices.length > 0;

                            return (
                                <div
                                    key={module.id}
                                    className="bg-slate-700/50 rounded-lg border border-slate-600/50 overflow-hidden"
                                >
                                    {/* Module header */}
                                    <div className="p-3">
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
                                        </div>
                                    </div>

                                    {/* Connected devices list for loop drivers */}
                                    {hasDevices && (
                                        <div className="border-t border-slate-600/30 bg-slate-800/30">
                                            <div className="px-3 py-2">
                                                <div className="flex text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 gap-2">
                                                    <span className="flex-1">Device</span>
                                                    <span className="w-24 text-right">Serial Number</span>
                                                </div>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {module.connectedDevices!.slice(0, 15).map(device => (
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
                                                    {module.connectedDevices!.length > 15 && (
                                                        <p className="text-[10px] text-slate-500 px-1">
                                                            +{module.connectedDevices!.length - 15} more...
                                                        </p>
                                                    )}
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
