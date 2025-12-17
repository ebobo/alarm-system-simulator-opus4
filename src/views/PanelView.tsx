// Panel Simulator View - AutroSafe style control panel
import PanelFrame from '../components/panel/PanelFrame';
import LCDDisplay from '../components/panel/LCDDisplay';
import LEDIndicators from '../components/panel/LEDIndicators';
import ControlButtons from '../components/panel/ControlButtons';
import type { LEDState } from '../components/panel/LEDIndicators';
import type { PlacedDevice, Connection } from '../types/devices';

interface PanelViewProps {
    projectName: string;
    placedDevices: PlacedDevice[];
    connections: Connection[];
}

export default function PanelView({ projectName, placedDevices, connections }: PanelViewProps) {
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

    // LED state based on system status
    const ledState: LEDState = {
        power: true,
        alarm: false,
        fault: isFault,
        disabled: false,
        mute: false,
    };

    // LCD display content based on status
    const lcdStatus = isFault ? 'fault' : 'normal';
    const lcdMessage = isFault ? 'SYSTEM FAULT' : 'SYSTEM NORMAL';
    const lcdDetails = isFault
        ? [
            !hasLoopDriver ? 'No Loop Driver installed' : 'Loop Driver not connected to Panel',
            'Loop: Offline',
        ]
        : [
            'No configuration loaded',
            'Loop: Offline',
        ];
    const statusText = isFault
        ? 'Status: Fault - Loop Driver Issue'
        : 'Status: Standby - No Config Loaded';

    return (
        <PanelFrame
            projectName={projectName}
            statusText={statusText}
        >
            {/* LCD Display */}
            <div className="mb-6">
                <LCDDisplay
                    status={lcdStatus}
                    message={lcdMessage}
                    details={lcdDetails}
                    hint={isFault ? 'Connect Loop Driver to Panel' : 'Press IMPORT CONFIG to begin'}
                />
            </div>

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
                    disabled={isFault}
                >
                    Power On Loop
                </button>
            </div>
        </PanelFrame>
    );
}
