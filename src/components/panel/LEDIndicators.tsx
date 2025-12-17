// LED Indicators component for the panel simulator
interface LEDState {
    power: boolean;
    alarm: boolean;
    fault: boolean;
    disabled: boolean;
    mute: boolean;
}

interface LEDIndicatorsProps {
    state: LEDState;
}

interface LEDProps {
    active: boolean;
    color: 'green' | 'red' | 'amber';
    label: string;
}

function LED({ active, color, label }: LEDProps) {
    const getColors = () => {
        if (!active) return 'bg-slate-600';
        switch (color) {
            case 'red':
                return 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse';
            case 'amber':
                return 'bg-amber-500 shadow-lg shadow-amber-500/50';
            case 'green':
            default:
                return 'bg-green-500 shadow-lg shadow-green-500/50';
        }
    };

    return (
        <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${getColors()}`} />
            <span className="text-xs text-slate-400 mt-1">{label}</span>
        </div>
    );
}

export default function LEDIndicators({ state }: LEDIndicatorsProps) {
    return (
        <div className="flex justify-center gap-6">
            <LED active={state.power} color="green" label="POWER" />
            <LED active={state.alarm} color="red" label="ALARM" />
            <LED active={state.fault} color="amber" label="FAULT" />
            <LED active={state.disabled} color="amber" label="DISABLED" />
            <LED active={state.mute} color="green" label="MUTE" />
        </div>
    );
}

export type { LEDState };
