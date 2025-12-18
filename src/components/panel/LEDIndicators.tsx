// LED Indicators component for the panel simulator

// Config LED state: off (gray), amber (loaded), green (verified), red (mismatch)
type ConfigLedState = 'off' | 'amber' | 'green' | 'red';

interface LEDState {
    power: boolean;
    alarm: boolean;
    fault: boolean;
    disabled: boolean;
    mute: boolean;
    config?: ConfigLedState;
}

interface LEDIndicatorsProps {
    state: LEDState;
}

interface LEDProps {
    active: boolean;
    color: 'green' | 'red' | 'amber';
    label: string;
    pulse?: boolean;
}

function LED({ active, color, label, pulse = false }: LEDProps) {
    const getColors = () => {
        if (!active) return 'bg-slate-600';
        const pulseClass = pulse ? ' animate-pulse' : '';
        switch (color) {
            case 'red':
                return `bg-red-500 shadow-lg shadow-red-500/50${pulseClass}`;
            case 'amber':
                return `bg-amber-500 shadow-lg shadow-amber-500/50${pulseClass}`;
            case 'green':
            default:
                return `bg-green-500 shadow-lg shadow-green-500/50${pulseClass}`;
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${getColors()}`} />
            <span className="text-xs text-slate-400 mt-1">{label}</span>
        </div>
    );
}

// Special LED for config status - supports multiple color states
interface ConfigLEDProps {
    state: ConfigLedState;
}

function ConfigLED({ state }: ConfigLEDProps) {
    const getColors = () => {
        switch (state) {
            case 'green':
                return 'bg-green-500 shadow-lg shadow-green-500/50';
            case 'amber':
                return 'bg-amber-500 shadow-lg shadow-amber-500/50';
            case 'red':
                return 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse';
            case 'off':
            default:
                return 'bg-slate-600';
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${getColors()}`} />
            <span className="text-xs text-slate-400 mt-1">CONFIG</span>
        </div>
    );
}

export default function LEDIndicators({ state }: LEDIndicatorsProps) {
    return (
        <div className="flex justify-center gap-6">
            <LED active={state.power} color="green" label="POWER" />
            <LED active={state.alarm} color="red" label="ALARM" pulse={state.alarm} />
            <LED active={state.fault} color="amber" label="FAULT" pulse={state.fault} />
            <LED active={state.disabled} color="amber" label="DISABLED" />
            <LED active={state.mute} color="green" label="MUTE" />
            <ConfigLED state={state.config || 'off'} />
        </div>
    );
}

export type { LEDState, ConfigLedState };
