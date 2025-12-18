// Config Status Sidebar - displays config details and verification status
// Styled to match DevicePalette for visual consistency
import type { FAConfig } from '../../types/faconfig';
import type { DeviceMatchResult } from '../../utils/faconfigParser';
import { getConfigSummary } from '../../utils/faconfigParser';

interface ConfigStatusSidebarProps {
    config: FAConfig | null;
    matchResult: DeviceMatchResult | null;
    isPoweredOn: boolean;
}

export default function ConfigStatusSidebar({
    config,
    matchResult,
    isPoweredOn
}: ConfigStatusSidebarProps) {
    // Get status indicator color for header icon
    const getStatusColor = () => {
        if (!config) return 'from-slate-400 to-slate-500';
        if (!isPoweredOn) return 'from-amber-400 to-amber-600';
        if (matchResult?.valid) return 'from-green-400 to-green-600';
        return 'from-red-400 to-red-600';
    };

    const getStatusText = () => {
        if (!config) return 'No Config';
        if (!isPoweredOn) return 'Loaded';
        if (matchResult?.valid) return 'Verified';
        return 'Mismatch';
    };

    // Config summary
    const summary = config ? getConfigSummary(config) : null;

    return (
        <div className="flex-1 flex flex-col text-white overflow-hidden">
            {/* Header - matches DevicePalette header style */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-br ${getStatusColor()} rounded-lg flex items-center justify-center`}>
                        {!config ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        ) : isPoweredOn && matchResult?.valid ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : isPoweredOn && !matchResult?.valid ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold">Config Status</h2>
                        <p className="text-xs text-slate-400">{getStatusText()}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-3 overflow-y-auto">
                {/* No config state */}
                {!config && (
                    <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-slate-400">No configuration loaded</p>
                        <p className="text-xs text-slate-500 mt-2">
                            Use IMPORT CONFIG in sidebar
                        </p>
                    </div>
                )}

                {/* Config loaded */}
                {config && summary && (
                    <>
                        {/* Project Section */}
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                            Project
                        </h3>
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 mb-4">
                            <p className="text-sm font-medium text-white truncate">{config.projectName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Created {new Date(config.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Devices Section */}
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                            Devices ({summary.totalDevices})
                        </h3>
                        <div className="space-y-2 mb-4">
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                                            <circle cx="12" cy="12" r="4" strokeWidth="2" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">Detectors</p>
                                        <p className="text-xs text-slate-400">{summary.detectors} devices</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="2" />
                                            <path d="M7 12h10M12 7v10" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">MCPs</p>
                                        <p className="text-xs text-slate-400">{summary.mcps} devices</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center border border-orange-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <circle cx="12" cy="12" r="8" strokeWidth="2" />
                                            <path d="M9 10 Q7 12 9 14" strokeWidth="1.5" strokeLinecap="round" />
                                            <path d="M15 10 Q17 12 15 14" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">Sounders</p>
                                        <p className="text-xs text-slate-400">{summary.sounders} devices</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Zones Section */}
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                            Zones
                        </h3>
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Detection</span>
                                <span className="text-white font-medium">{summary.detectionZones}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2">
                                <span className="text-slate-300">Alarm</span>
                                <span className="text-white font-medium">{summary.alarmZones}</span>
                            </div>
                        </div>

                        {/* C&E Rules */}
                        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">C&E Rules</span>
                                <span className="text-white font-medium">{summary.ceRules}</span>
                            </div>
                        </div>

                        {/* Validation Section (only when powered on) */}
                        {isPoweredOn && matchResult && (
                            <>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                                    Validation
                                </h3>
                                <div className={`rounded-lg p-3 border mb-2 ${matchResult.valid
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-red-500/10 border-red-500/30'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-green-400">✓</span>
                                        <span className="text-sm text-slate-300">Matched</span>
                                        <span className="text-sm text-green-400 font-medium ml-auto">{matchResult.matched.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-400">✗</span>
                                        <span className="text-sm text-slate-300">Missing</span>
                                        <span className="text-sm text-red-400 font-medium ml-auto">{matchResult.missing.length}</span>
                                    </div>
                                </div>

                                {/* Missing devices list */}
                                {matchResult.missing.length > 0 && (
                                    <div className="bg-slate-900/50 rounded-lg p-2 max-h-40 overflow-y-auto">
                                        <p className="text-xs text-slate-500 mb-2">Missing devices:</p>
                                        {matchResult.missing.slice(0, 10).map(addr => (
                                            <div key={addr} className="text-xs text-red-300 font-mono py-0.5">
                                                {addr}
                                            </div>
                                        ))}
                                        {matchResult.missing.length > 10 && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                +{matchResult.missing.length - 10} more...
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                    Panel Simulator
                </p>
            </div>
        </div>
    );
}
