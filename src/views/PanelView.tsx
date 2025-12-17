// Panel Simulator View - AutroSafe style control panel
import PanelFrame from '../components/panel/PanelFrame';
import LCDDisplay from '../components/panel/LCDDisplay';
import LEDIndicators from '../components/panel/LEDIndicators';
import ControlButtons from '../components/panel/ControlButtons';
import type { LEDState } from '../components/panel/LEDIndicators';

interface PanelViewProps {
    projectName: string;
}

export default function PanelView({ projectName }: PanelViewProps) {
    // Initial state - no config loaded
    const ledState: LEDState = {
        power: true,
        alarm: false,
        fault: false,
        disabled: false,
        mute: false,
    };

    const lcdDetails = [
        'No configuration loaded',
        'Loop: Offline',
    ];

    return (
        <PanelFrame
            projectName={projectName}
            statusText="Status: Standby - No Config Loaded"
        >
            {/* LCD Display */}
            <div className="mb-6">
                <LCDDisplay
                    status="normal"
                    message="SYSTEM NORMAL"
                    details={lcdDetails}
                    hint="Press IMPORT CONFIG to begin"
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
                <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" disabled>
                    Power On Loop
                </button>
            </div>
        </PanelFrame>
    );
}
