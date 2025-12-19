// Config Tab - displays configuration status and validation
// Extracted from ConfigStatusSidebar for use in tabbed panel sidebar

import type { FAConfig } from '../../types/faconfig';
import type { DeviceMatchResult } from '../../utils/faconfigParser';
import { getConfigSummary } from '../../utils/faconfigParser';

interface ConfigTabProps {
    config: FAConfig | null;
    matchResult: DeviceMatchResult | null;
    isPoweredOn: boolean;
}

export default function ConfigTab({ config, matchResult, isPoweredOn }: ConfigTabProps) {
    // Config summary
    const summary = config ? getConfigSummary(config) : null;

    return (
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
                                <div className="bg-slate-900/50 rounded-lg p-2 max-h-48 overflow-y-auto">
                                    <div className="flex text-xs text-slate-500 mb-2 px-1">
                                        <span className="w-24">Address</span>
                                        <span className="flex-1">Location</span>
                                    </div>
                                    {matchResult.missing.slice(0, 15).map(addr => {
                                        // Look up location from config
                                        const device = config.devices.find(d => d.address === addr);
                                        const location = device?.location || '—';
                                        return (
                                            <div key={addr} className="flex text-xs py-0.5 px-1 hover:bg-slate-800/50 rounded">
                                                <span className="w-24 text-red-300 font-mono">{addr}</span>
                                                <span className="flex-1 text-slate-400 truncate" title={location}>
                                                    {location}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {matchResult.missing.length > 15 && (
                                        <p className="text-xs text-slate-500 mt-1 px-1">
                                            +{matchResult.missing.length - 15} more...
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
