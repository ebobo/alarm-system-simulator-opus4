// Config Tab - displays configuration status and validation
// Extracted from ConfigStatusSidebar for use in tabbed panel sidebar

import type { FAConfig, FAConfigDevice } from '../../types/faconfig';
import type { DeviceMatchResult } from '../../utils/faconfigParser';
import { getConfigSummary } from '../../utils/faconfigParser';


/**
 * Get compact feature indicators from device functions (e.g., "+S" for sounder, "+SBr" for sounder+beacon)
 * Only for detectors - sounders don't need feature indicators
 * Uses fixed order: S, Br, Bw, C, V
 */
function getFeatureIndicator(device: FAConfigDevice | undefined): string {
    if (!device) return '';
    // Skip feature indicators for non-detectors
    if (device.type.toLowerCase() !== 'detector') return '';

    const fnTypes = device.functions.map(fn => fn.type);
    const indicators: string[] = [];

    // Check each feature in fixed order
    if (fnTypes.includes('sounder')) indicators.push('S');
    if (fnTypes.includes('beacon-red')) indicators.push('Br');
    if (fnTypes.includes('beacon-white')) indicators.push('Bw');
    if (fnTypes.includes('co-sensor')) indicators.push('C');
    if (fnTypes.includes('voice')) indicators.push('V');

    return indicators.length > 0 ? `+${indicators.join('')}` : '';
}

/**
 * Shorten device type for compact display
 */
function getShortType(type: string): string {
    switch (type.toLowerCase()) {
        case 'detector': return 'det';
        default: return type;
    }
}

/**
 * Get compact indicator for actual installed features
 * Uses fixed order: S, Br, Bw, C, V
 */
function getActualFeatureIndicator(actualFeatures: string[] | undefined): string {
    if (!actualFeatures || actualFeatures.length === 0) return '';
    const indicators: string[] = [];

    // Check each feature in fixed order
    if (actualFeatures.includes('Sounder')) indicators.push('S');
    if (actualFeatures.includes('BeaconR')) indicators.push('Br');
    if (actualFeatures.includes('BeaconW')) indicators.push('Bw');
    if (actualFeatures.includes('CO')) indicators.push('C');
    if (actualFeatures.includes('Voice')) indicators.push('V');

    return indicators.length > 0 ? `+${indicators.join('')}` : '';
}

interface ConfigTabProps {
    config: FAConfig | null;
    matchResult: DeviceMatchResult | null;
    isPoweredOn: boolean;
    isDevicesCollapsed: boolean;
    onToggleDevicesCollapsed: () => void;
    isZonesCollapsed: boolean;
    onToggleZonesCollapsed: () => void;
    floorPlanProjectName?: string;
}

export default function ConfigTab({
    config,
    matchResult,
    isPoweredOn,
    isDevicesCollapsed,
    onToggleDevicesCollapsed,
    isZonesCollapsed,
    onToggleZonesCollapsed,
    floorPlanProjectName
}: ConfigTabProps) {
    // Config summary
    const summary = config ? getConfigSummary(config) : null;

    // Check if project names match
    const isProjectNameMismatch = config && floorPlanProjectName &&
        floorPlanProjectName !== 'Generated Plan' &&
        floorPlanProjectName !== config.projectName;

    return (
        <div className="flex-1 flex flex-col p-3 overflow-hidden">
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
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Scrollable top section */}
                    <div className="flex-shrink-0">
                        {/* Project Section */}
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                            Project
                        </h3>
                        <div className={`rounded-lg p-3 border mb-4 ${isProjectNameMismatch
                            ? 'bg-amber-900/30 border-amber-600/50'
                            : 'bg-slate-700/50 border-slate-600/50'}`}>
                            <p className="text-sm font-medium text-white truncate">{config.projectName}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                Created {new Date(config.createdAt).toLocaleDateString()}
                            </p>
                            {isProjectNameMismatch && (
                                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                                    <span>⚠</span>
                                    <span>Floor plan: {floorPlanProjectName}</span>
                                </p>
                            )}
                        </div>

                        {/* Devices Section - Collapsible */}
                        <button
                            onClick={onToggleDevicesCollapsed}
                            className="w-full flex items-center justify-between mb-3 group"
                        >
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Devices ({summary.totalDevices})
                            </h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDevicesCollapsed ? '' : 'rotate-180'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {!isDevicesCollapsed && (
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
                                            <p className="text-xs text-slate-400">
                                                {summary.detectors} devices
                                                {(summary.detectorsWithSounder > 0 || summary.detectorsWithBeacon > 0) && (
                                                    <span className="text-slate-500">
                                                        {summary.detectorsWithSounder > 0 && ` • ${summary.detectorsWithSounder} w/sounder`}
                                                        {summary.detectorsWithBeacon > 0 && ` • ${summary.detectorsWithBeacon} w/beacon`}
                                                    </span>
                                                )}
                                            </p>
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
                        )}

                        {/* Zones Section - Collapsible */}
                        <button
                            onClick={onToggleZonesCollapsed}
                            className="w-full flex items-center justify-between mb-3 group"
                        >
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Zones
                            </h3>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isZonesCollapsed ? '' : 'rotate-180'}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {!isZonesCollapsed && (
                            <>
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
                            </>
                        )}
                    </div>

                    {/* Validation Section (only when powered on) - takes remaining space */}
                    {isPoweredOn && matchResult && (
                        <div className="flex-1 flex flex-col min-h-0">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex-shrink-0">
                                Validation
                            </h3>
                            <div className={`rounded-lg p-3 border mb-2 flex-shrink-0 ${matchResult.valid
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-sm text-slate-300">Matched</span>
                                    <span className="text-sm text-green-400 font-medium ml-auto">{matchResult.matched.length}</span>
                                </div>
                                {matchResult.missing.length > 0 && (
                                    <div className={`flex items-center gap-2 ${matchResult.typeMismatch && matchResult.typeMismatch.length > 0 ? 'mb-2' : ''}`}>
                                        <span className="text-red-400">✗</span>
                                        <span className="text-sm text-slate-300">Missing</span>
                                        <span className="text-sm text-red-400 font-medium ml-auto">{matchResult.missing.length}</span>
                                    </div>
                                )}
                                {matchResult.typeMismatch && matchResult.typeMismatch.length > 0 && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-amber-400">⚠</span>
                                        <span className="text-sm text-slate-300">Wrong Type</span>
                                        <span className="text-sm text-amber-400 font-medium ml-auto">{matchResult.typeMismatch.length}</span>
                                    </div>
                                )}
                                {matchResult.featureMismatch && matchResult.featureMismatch.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-purple-400">◐</span>
                                        <span className="text-sm text-slate-300">Missing Features</span>
                                        <span className="text-sm text-purple-400 font-medium ml-auto">{matchResult.featureMismatch.length}</span>
                                    </div>
                                )}
                            </div>

                            {/* All devices list - matched, type mismatch, and missing */}
                            {(matchResult.matched.length > 0 || matchResult.missing.length > 0 || (matchResult.typeMismatch && matchResult.typeMismatch.length > 0)) && (
                                <div className="flex-1 bg-slate-900/50 rounded-lg p-2 overflow-y-auto min-h-0">
                                    <div className="flex text-xs text-slate-500 mb-2 px-1">
                                        <span className="w-5">St</span>
                                        <span className="w-20">Address</span>
                                        <span className="w-32">Type (wanted/actual)</span>
                                        <span className="flex-1">Location</span>
                                    </div>
                                    {/* Matched devices */}
                                    {matchResult.matched.map(addr => {
                                        const device = config.devices.find(d => d.address === addr);
                                        const location = device?.location || '—';
                                        const wantedType = device?.type || '—';
                                        const actualType = matchResult.placedTypes?.get(addr) || '—';
                                        const features = getFeatureIndicator(device);
                                        const actualFeats = getActualFeatureIndicator(matchResult.featureDetails?.get(addr)?.actual);
                                        return (
                                            <div key={addr} className="flex text-xs py-0.5 px-1 hover:bg-slate-800/50 rounded">
                                                <span className="w-5 text-green-400">✓</span>
                                                <span className="w-20 text-green-300 font-mono">{addr}</span>
                                                <span className="w-32 truncate" title={`${wantedType}${features}/${actualType}${actualFeats}`}>
                                                    <span className="text-slate-400">{getShortType(wantedType)}</span>
                                                    {features && <span className="text-cyan-400">{features}</span>}
                                                    <span className="text-slate-600">/</span>
                                                    <span className="text-green-400">{getShortType(actualType)}</span>
                                                    {actualFeats && <span className="text-green-300">{actualFeats}</span>}
                                                </span>
                                                <span className="flex-1 text-slate-400 truncate" title={location}>
                                                    {location}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* Type mismatch devices */}
                                    {matchResult.typeMismatch && matchResult.typeMismatch.map(addr => {
                                        const device = config.devices.find(d => d.address === addr);
                                        const location = device?.location || '—';
                                        const wantedType = device?.type || '—';
                                        const actualType = matchResult.placedTypes?.get(addr) || '—';
                                        const features = getFeatureIndicator(device);
                                        return (
                                            <div key={addr} className="flex text-xs py-0.5 px-1 hover:bg-slate-800/50 rounded">
                                                <span className="w-5 text-amber-400">⚠</span>
                                                <span className="w-20 text-amber-300 font-mono">{addr}</span>
                                                <span className="w-32 truncate" title={`${wantedType}${features}/${actualType}`}>
                                                    <span className="text-slate-400">{getShortType(wantedType)}</span>
                                                    {features && <span className="text-cyan-400">{features}</span>}
                                                    <span className="text-slate-600">/</span>
                                                    <span className="text-amber-400">{getShortType(actualType)}</span>
                                                </span>
                                                <span className="flex-1 text-slate-400 truncate" title={location}>
                                                    {location}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* Missing devices */}
                                    {matchResult.missing.map(addr => {
                                        const device = config.devices.find(d => d.address === addr);
                                        const location = device?.location || '—';
                                        const wantedType = device?.type || '—';
                                        const features = getFeatureIndicator(device);
                                        return (
                                            <div key={addr} className="flex text-xs py-0.5 px-1 hover:bg-slate-800/50 rounded">
                                                <span className="w-5 text-red-400">✗</span>
                                                <span className="w-20 text-red-300 font-mono">{addr}</span>
                                                <span className="w-32 truncate" title={`${wantedType}${features}/—`}>
                                                    <span className="text-slate-400">{getShortType(wantedType)}</span>
                                                    {features && <span className="text-cyan-400">{features}</span>}
                                                    <span className="text-slate-600">/</span>
                                                    <span className="text-red-400">—</span>
                                                </span>
                                                <span className="flex-1 text-slate-400 truncate" title={location}>
                                                    {location}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {/* Feature mismatch devices */}
                                    {matchResult.featureMismatch && matchResult.featureMismatch.map(addr => {
                                        const device = config.devices.find(d => d.address === addr);
                                        const location = device?.location || '—';
                                        const wantedType = device?.type || '—';
                                        const actualType = matchResult.placedTypes?.get(addr) || '—';
                                        const reqFeatures = getFeatureIndicator(device);
                                        const featureData = matchResult.featureDetails?.get(addr);
                                        const actualFeats = getActualFeatureIndicator(featureData?.actual);
                                        const featureTooltip = featureData
                                            ? `Required: ${featureData.required.join(', ') || 'none'}\nActual: ${featureData.actual.join(', ') || 'none'}`
                                            : '';
                                        return (
                                            <div key={addr} className="flex text-xs py-0.5 px-1 hover:bg-slate-800/50 rounded" title={featureTooltip}>
                                                <span className="w-5 text-purple-400">◐</span>
                                                <span className="w-20 text-purple-300 font-mono">{addr}</span>
                                                <span className="w-32 truncate" title={`${wantedType}${reqFeatures}/${actualType}${actualFeats}`}>
                                                    <span className="text-slate-400">{getShortType(wantedType)}</span>
                                                    {reqFeatures && <span className="text-cyan-400">{reqFeatures}</span>}
                                                    <span className="text-slate-600">/</span>
                                                    <span className="text-purple-400">{getShortType(actualType)}</span>
                                                    {actualFeats && <span className="text-purple-300">{actualFeats}</span>}
                                                </span>
                                                <span className="flex-1 text-slate-400 truncate" title={location}>
                                                    {location}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


