// Panel Simulator View - AutroSafe style control panel
import PanelFrame from '../components/panel/PanelFrame';
import LCDDisplay from '../components/panel/LCDDisplay';
import LEDIndicators from '../components/panel/LEDIndicators';
import ControlButtons from '../components/panel/ControlButtons';
import type { LEDState, ConfigLedState } from '../components/panel/LEDIndicators';
import type { PlacedDevice, Connection } from '../types/devices';
import type { FAConfig } from '../types/faconfig';
import type { DeviceMatchResult } from '../utils/faconfigParser';
import { getConfigSummary } from '../utils/faconfigParser';

interface PanelViewProps {
    projectName: string;
    placedDevices: PlacedDevice[];
    connections: Connection[];
    loadedConfig: FAConfig | null;
    importError: string | null;
    isPoweredOn: boolean;
    onPowerChange: (powered: boolean) => void;
    deviceMatch: DeviceMatchResult | null;
    discoveredDeviceCount: number;
    hasLoopBreak: boolean;
    // Alarm state from simulation
    isAlarm: boolean;
    alarmInfo: { deviceLabel: string; zoneName: string } | null;
    activatedSoundersCount: number;
    onReset: () => void;
}

export default function PanelView({
    projectName,
    placedDevices,
    connections,
    loadedConfig,
    importError,
    isPoweredOn,
    onPowerChange,
    deviceMatch,
    discoveredDeviceCount,
    hasLoopBreak,
    isAlarm,
    alarmInfo,
    activatedSoundersCount,
    onReset
}: PanelViewProps) {

    // Check if panel and loop driver exist
    const panelDevice = placedDevices.find(d => d.typeId === 'panel');
    const loopDriverDevice = placedDevices.find(d => d.typeId === 'loop-driver');

    // Check if loop driver is connected to panel
    const isLoopDriverConnected = panelDevice && loopDriverDevice && connections.some(conn =>
        (conn.fromDeviceId === panelDevice.instanceId && conn.toDeviceId === loopDriverDevice.instanceId) ||
        (conn.toDeviceId === panelDevice.instanceId && conn.fromDeviceId === loopDriverDevice.instanceId)
    );

    // Determine system status
    const hasLoopDriver = !!loopDriverDevice;
    const isHardwareFault = !hasLoopDriver || !isLoopDriverConnected;
    const hasConfig = loadedConfig !== null;

    // Config summary
    const configSummary = hasConfig ? getConfigSummary(loadedConfig) : null;

    // Determine if there's a config mismatch fault
    const isConfigMismatch = isPoweredOn && deviceMatch !== null && !deviceMatch.valid;

    // Overall fault state
    const isFault = isHardwareFault || isConfigMismatch;

    // Config LED state
    const getConfigLedState = (): ConfigLedState => {
        if (!hasConfig) return 'off';
        if (!isPoweredOn) return 'amber';
        if (deviceMatch?.valid) return 'green';
        return 'red';
    };

    // LED state based on system status
    const ledState: LEDState = {
        power: true,
        alarm: isAlarm,  // Use alarm state from simulation
        fault: isFault,
        disabled: false,
        mute: false,
        config: getConfigLedState(),
    };

    // LCD display content based on status
    const getLCDContent = () => {
        // FIRE ALARM takes highest priority
        if (isAlarm) {
            return {
                status: 'alarm' as const,
                message: 'FIRE ALARM',
                details: [
                    alarmInfo ? `Device: ${alarmInfo.deviceLabel}` : 'Unknown trigger',
                    alarmInfo ? `Location: ${alarmInfo.zoneName}` : '',
                    `${activatedSoundersCount} sounder${activatedSoundersCount !== 1 ? 's' : ''} activated`,
                ].filter(Boolean),
                hint: 'Press RESET to clear alarm',
            };
        }

        // Hardware fault takes priority
        if (isHardwareFault) {
            return {
                status: 'fault' as const,
                message: 'SYSTEM FAULT',
                details: [
                    !hasLoopDriver ? 'No Loop Driver installed' : 'Loop Driver not connected to Panel',
                    'Loop: Offline',
                ],
                hint: 'Connect Loop Driver to Panel',
            };
        }

        // No config loaded
        if (!hasConfig) {
            return {
                status: 'fault' as const,
                message: 'FAULT: NO CONFIG',
                details: [
                    'No configuration loaded',
                    'Loop: Offline',
                ],
                hint: 'Click IMPORT CONFIG in sidebar',
            };
        }

        // Config loaded but not powered on
        if (!isPoweredOn) {
            // Check if project names match
            const configProjectName = loadedConfig.projectName;
            const isNameMismatch = projectName !== configProjectName && projectName !== 'Generated Plan';

            const details = [
                `Project: ${configProjectName}`,
                `Devices: ${configSummary!.totalDevices} (${configSummary!.detectors} det, ${configSummary!.mcps} mcp, ${configSummary!.sounders} snd)`,
            ];

            if (isNameMismatch) {
                details.push(`⚠ Config does not match: ${projectName}`);
            }

            return {
                status: isNameMismatch ? 'fault' as const : 'normal' as const,
                message: isNameMismatch ? 'CONFIG WARNING' : 'CONFIG LOADED',
                details,
                hint: isNameMismatch ? 'Config may not be for this project' : 'Press POWER ON LOOP to start',
            };
        }

        // Powered on - check device match
        if (isConfigMismatch && deviceMatch) {
            const missingCount = deviceMatch.missing.length;
            const typeMismatchCount = deviceMatch.typeMismatch?.length || 0;
            const details = [];
            if (missingCount > 0) {
                details.push(`Missing: ${missingCount} device${missingCount !== 1 ? 's' : ''}`);
            }
            if (typeMismatchCount > 0) {
                details.push(`Type mismatch: ${typeMismatchCount} device${typeMismatchCount !== 1 ? 's' : ''}`);
            }
            details.push(`Loop 1: ${discoveredDeviceCount} discovered`);
            if (hasLoopBreak) {
                details.push('⚠ LOOP BREAK DETECTED');
            }
            details.push('Check Config Status panel →');
            return {
                status: 'fault' as const,
                message: 'DEVICE MISMATCH',
                details,
                hint: hasLoopBreak ? 'Loop is not closed - check wiring' : 'Fix device types or add missing devices',
            };
        }

        // All good or just loop break - system running
        const systemDetails = [
            `${deviceMatch?.matched.length || 0} devices online`,
            `${configSummary!.ceRules} C&E rules active`,
        ];
        if (hasLoopBreak) {
            systemDetails.push('⚠ LOOP BREAK DETECTED');
        }
        return {
            status: hasLoopBreak ? 'fault' as const : 'normal' as const,
            message: hasLoopBreak ? 'LOOP FAULT' : 'SYSTEM RUNNING',
            details: systemDetails,
            hint: hasLoopBreak ? 'Loop is not closed - check wiring' : 'System monitoring active',
        };
    };

    const lcdContent = getLCDContent();

    // Status text for status bar
    const getStatusText = () => {
        if (isHardwareFault) return 'Status: Fault - Loop Driver Issue';
        if (!hasConfig) return 'Status: Standby - No Config Loaded';
        if (!isPoweredOn) return `Status: Ready - ${configSummary?.totalDevices || 0} devices configured`;
        if (isConfigMismatch) return `Status: Fault - ${deviceMatch?.missing.length || 0} devices missing`;
        return `Status: Running - ${deviceMatch?.matched.length || 0} devices online`;
    };

    // Handle raise loop button - triggers discovery
    const handlePowerOn = () => {
        onPowerChange(true);
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
            <div className="max-w-2xl w-full">
                <PanelFrame
                    projectName={projectName}
                    statusText={getStatusText()}
                >
                    {/* LCD Display */}
                    <div className="mb-6">
                        <LCDDisplay
                            status={lcdContent.status}
                            message={lcdContent.message}
                            details={lcdContent.details}
                            hint={lcdContent.hint}
                        />
                    </div>

                    {/* Error message */}
                    {importError && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-red-300 text-sm">
                            <span className="font-semibold">Import Error:</span> {importError}
                        </div>
                    )}

                    {/* Status LEDs */}
                    <div className="mb-8">
                        <LEDIndicators state={ledState} />
                    </div>

                    {/* Control Buttons */}
                    <div className="mb-6">
                        <ControlButtons
                            disabled={!isAlarm}
                            onReset={onReset}
                        />
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex gap-3 justify-center border-t border-slate-600 pt-6">
                        <button
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                            disabled={isHardwareFault || !hasConfig}
                            onClick={handlePowerOn}
                        >
                            Raise Loop
                        </button>
                    </div>
                </PanelFrame>
            </div>
        </div>
    );
}
