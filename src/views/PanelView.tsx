// Panel Simulator View - AutroSafe style control panel
import { useState, useMemo } from 'react';
import PanelFrame from '../components/panel/PanelFrame';
import LCDDisplay from '../components/panel/LCDDisplay';
import LEDIndicators from '../components/panel/LEDIndicators';
import ControlButtons from '../components/panel/ControlButtons';
import ConfigStatusSidebar from '../components/panel/ConfigStatusSidebar';
import type { LEDState, ConfigLedState } from '../components/panel/LEDIndicators';
import type { PlacedDevice, Connection } from '../types/devices';
import type { FAConfig } from '../types/faconfig';
import { getConfigSummary, validateDeviceMatch } from '../utils/faconfigParser';

interface PanelViewProps {
    projectName: string;
    placedDevices: PlacedDevice[];
    connections: Connection[];
    loadedConfig: FAConfig | null;
    importError: string | null;
}

export default function PanelView({
    projectName,
    placedDevices,
    connections,
    loadedConfig,
    importError
}: PanelViewProps) {
    // Panel power state
    const [isPoweredOn, setIsPoweredOn] = useState(false);

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

    // Device matching result (only computed when powered on with config)
    const deviceMatch = useMemo(() => {
        if (!hasConfig || !isPoweredOn) return null;
        return validateDeviceMatch(loadedConfig, placedDevices);
    }, [loadedConfig, placedDevices, hasConfig, isPoweredOn]);

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
        alarm: false,
        fault: isFault,
        disabled: false,
        mute: false,
        config: getConfigLedState(),
    };

    // LCD display content based on status
    const getLCDContent = () => {
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
                status: 'normal' as const,
                message: 'SYSTEM NORMAL',
                details: [
                    'No configuration loaded',
                    'Loop: Offline',
                ],
                hint: 'Click IMPORT CONFIG in sidebar',
            };
        }

        // Config loaded but not powered on
        if (!isPoweredOn) {
            return {
                status: 'normal' as const,
                message: 'CONFIG LOADED',
                details: [
                    `Project: ${loadedConfig.projectName}`,
                    `Devices: ${configSummary!.totalDevices} (${configSummary!.detectors} det, ${configSummary!.mcps} mcp, ${configSummary!.sounders} snd)`,
                ],
                hint: 'Press POWER ON LOOP to start',
            };
        }

        // Powered on - check device match
        if (isConfigMismatch && deviceMatch) {
            const missingCount = deviceMatch.missing.length;
            return {
                status: 'fault' as const,
                message: 'DEVICE MISMATCH',
                details: [
                    `Missing: ${missingCount} device${missingCount !== 1 ? 's' : ''}`,
                    'Check Config Status panel →',
                ],
                hint: 'Add missing devices to floor plan',
            };
        }

        // All good - system running
        return {
            status: 'normal' as const,
            message: 'SYSTEM RUNNING',
            details: [
                `${deviceMatch?.matched.length || 0} devices online`,
                `${configSummary!.ceRules} C&E rules active`,
            ],
            hint: 'System monitoring active',
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

    // Handle power on button
    const handlePowerOn = () => {
        setIsPoweredOn(true);
    };

    // Handle power off (reset)
    const handlePowerOff = () => {
        setIsPoweredOn(false);
    };

    return (
        <div className="flex-1 flex">
            {/* Main panel area */}
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
                            <ControlButtons disabled={true} />
                        </div>

                        {/* Bottom Actions */}
                        <div className="flex gap-3 justify-center border-t border-slate-600 pt-6">
                            {!isPoweredOn ? (
                                <button
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                                    disabled={isHardwareFault || !hasConfig}
                                    onClick={handlePowerOn}
                                >
                                    Power On Loop
                                </button>
                            ) : (
                                <button
                                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition-colors"
                                    onClick={handlePowerOff}
                                >
                                    Power Off
                                </button>
                            )}
                        </div>
                    </PanelFrame>
                </div>
            </div>

            {/* Config Status Sidebar - styled to match floor plan sidebar */}
            <div className="w-64 flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 border-l border-slate-700">
                <ConfigStatusSidebar
                    config={loadedConfig}
                    matchResult={deviceMatch}
                    isPoweredOn={isPoweredOn}
                />
            </div>
        </div>
    );
}
