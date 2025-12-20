// LCD Display component for the panel simulator
interface LCDDisplayProps {
    status: 'normal' | 'alarm' | 'fault';
    message: string;
    details: string[];
    hint?: string;
}

export default function LCDDisplay({ status, message, details, hint }: LCDDisplayProps) {
    // Determine colors based on status
    const getColors = () => {
        switch (status) {
            case 'alarm':
                return {
                    bg: 'bg-red-950',
                    border: 'border-red-900',
                    text: 'text-red-400',
                    detail: 'text-red-600',
                    hint: 'text-red-700',
                };
            case 'fault':
                return {
                    bg: 'bg-amber-950',
                    border: 'border-amber-900',
                    text: 'text-amber-400',
                    detail: 'text-amber-600',
                    hint: 'text-amber-700',
                };
            default:
                return {
                    bg: 'bg-green-950',
                    border: 'border-green-900',
                    text: 'text-green-400',
                    detail: 'text-green-600',
                    hint: 'text-green-700',
                };
        }
    };

    const colors = getColors();

    return (
        <div className="bg-slate-900 rounded-lg border-2 border-slate-600 p-4 font-mono">
            <div className={`${colors.bg} rounded p-4 border ${colors.border} h-[160px] overflow-hidden`}>
                <p className={`${colors.text} text-lg font-bold`}>{message}</p>
                {details.map((detail, index) => (
                    <p key={index} className={`${colors.detail} text-sm mt-1`}>
                        {detail}
                    </p>
                ))}
                {hint && (
                    <p className={`${colors.hint} text-xs mt-4`}>{hint}</p>
                )}
            </div>
        </div>
    );
}
