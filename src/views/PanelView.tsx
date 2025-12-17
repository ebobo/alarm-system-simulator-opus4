// Panel Simulator View - AutroSafe style control panel
import PanelFrame from '../components/panel/PanelFrame';
import LCDDisplay from '../components/panel/LCDDisplay';
import LEDIndicators from '../components/panel/LEDIndicators';
import ControlButtons from '../components/panel/ControlButtons';
import type { LEDState } from '../components/panel/LEDIndicators';
import type { PlacedDevice, Connection } from '../types/devices';
import type { FAConfig } from '../types/faconfig';
import { getConfigSummary } from '../utils/faconfigParser';

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
    // Check if panel and loop driver exist
    const panelDevice = placedDevices.find(d => d.typeId === 'panel');
    const loopDriverDevice = placedDevices.find(d => d.typeId === 'loop-driver');

    // Check if loop driver is connected to panel
    const isLoopDriverConnected = panelDevice && loopDriverDevice && connections.some(conn =>
        (conn.fromDeviceId === panelDevice.instanceId && conn.toDeviceId === loopDriverDevice.instanceId) ||
        (conn.toDeviceId === panelDevice.instanceId && conn.fromDeviceId === loopDriverDevice.instanceId)
    );

    // Determine system status based on connections
    const hasLoopDriver = !!loopDriverDevice;
    const isFault = !hasLoopDriver || !isLoopDriverConnected;
    const hasConfig = loadedConfig !== null;

    // LED state based on system status
    const ledState: LEDState = {
        power: true,
        alarm: false,
        fault: isFault,
        disabled: false,
        mute: false,
    };

    // Get config summary if loaded
    const configSummary = hasConfig ? getConfigSummary(loadedConfig) : null;

    // LCD display content based on status
    const getLCDContent = () => {
        if (isFault) {
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

        if (hasConfig && configSummary) {
            return {
                status: 'normal' as const,
                message: 'CONFIG LOADED',
                details: [
                    `Project: ${loadedConfig.projectName}`,
                    `Devices: ${configSummary.totalDevices} (${configSummary.detectors} det, ${configSummary.mcps} mcp, ${configSummary.sounders} snd)`,
                ],
                hint: 'Press POWER ON LOOP to start simulation',
            };
        }

        return {
            status: 'normal' as const,
            message: 'SYSTEM NORMAL',
            details: [
                'No configuration loaded',
                'Loop: Offline',
            ],
            hint: 'Click IMPORT CONFIG in sidebar',
        };
    };

    const lcdContent = getLCDContent();

    // Status text for status bar
    const getStatusText = () => {
        if (isFault) return 'Status: Fault - Loop Driver Issue';
        if (hasConfig) return `Status: Ready - ${configSummary?.totalDevices || 0} devices configured`;
        return 'Status: Standby - No Config Loaded';
    };

    return (
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
                <button
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    disabled={isFault || !hasConfig}
                >
                    Power On Loop
                </button>
            </div>
        </PanelFrame>
    );
}
