// Control Buttons component for the panel simulator
interface ControlButtonsProps {
    onReset?: () => void;
    onMute?: () => void;
    onAck?: () => void;
    onTest?: () => void;
    onMenu?: () => void;
    onEsc?: () => void;
    onEnter?: () => void;
    onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void;
    disabled?: boolean;
}

export default function ControlButtons({
    onReset,
    onMute,
    onAck,
    onTest,
    onMenu,
    onEsc,
    onEnter,
    onNavigate,
    disabled = false,
}: ControlButtonsProps) {
    const baseButtonClass = disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:brightness-110 active:scale-95';

    return (
        <div className="grid grid-cols-4 gap-3">
            {/* Navigation cluster */}
            <div className="col-span-1 flex flex-col items-center gap-1">
                <button
                    onClick={() => onNavigate?.('up')}
                    disabled={disabled}
                    className={`w-10 h-10 bg-slate-600 rounded text-white font-bold transition-all ${baseButtonClass}`}
                >
                    ▲
                </button>
                <div className="flex gap-1">
                    <button
                        onClick={() => onNavigate?.('left')}
                        disabled={disabled}
                        className={`w-10 h-10 bg-slate-600 rounded text-white font-bold transition-all ${baseButtonClass}`}
                    >
                        ◄
                    </button>
                    <button
                        onClick={() => onNavigate?.('right')}
                        disabled={disabled}
                        className={`w-10 h-10 bg-slate-600 rounded text-white font-bold transition-all ${baseButtonClass}`}
                    >
                        ►
                    </button>
                </div>
                <button
                    onClick={() => onNavigate?.('down')}
                    disabled={disabled}
                    className={`w-10 h-10 bg-slate-600 rounded text-white font-bold transition-all ${baseButtonClass}`}
                >
                    ▼
                </button>
            </div>

            {/* Main control buttons */}
            <div className="col-span-3 grid grid-cols-4 gap-2">
                <button
                    onClick={onReset}
                    disabled={disabled}
                    className={`py-3 bg-green-600 rounded-lg text-white text-sm font-semibold shadow-lg transition-all ${baseButtonClass}`}
                >
                    RESET
                </button>
                <button
                    onClick={onMute}
                    disabled={disabled}
                    className={`py-3 bg-red-600 rounded-lg text-white text-sm font-semibold shadow-lg transition-all ${baseButtonClass}`}
                >
                    MUTE
                </button>
                <button
                    onClick={onAck}
                    disabled={disabled}
                    className={`py-3 bg-blue-600 rounded-lg text-white text-sm font-semibold shadow-lg transition-all ${baseButtonClass}`}
                >
                    ACK
                </button>
                <button
                    onClick={onTest}
                    disabled={disabled}
                    className={`py-3 bg-amber-600 rounded-lg text-white text-sm font-semibold shadow-lg transition-all ${baseButtonClass}`}
                >
                    TEST
                </button>

                <button
                    onClick={onMenu}
                    disabled={disabled}
                    className={`py-3 bg-slate-600 rounded-lg text-white text-sm font-semibold transition-all ${baseButtonClass}`}
                >
                    MENU
                </button>
                <button
                    onClick={onEsc}
                    disabled={disabled}
                    className={`py-3 bg-slate-600 rounded-lg text-white text-sm font-semibold transition-all ${baseButtonClass}`}
                >
                    ESC
                </button>
                <button
                    onClick={onEnter}
                    disabled={disabled}
                    className={`py-3 bg-slate-600 rounded-lg text-white text-sm font-semibold col-span-2 transition-all ${baseButtonClass}`}
                >
                    ENTER
                </button>
            </div>
        </div>
    );
}
