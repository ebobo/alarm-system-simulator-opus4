// Panel Module Component - Unified case design with variable front connectors
// All modules share the same plastic housing, only front panel differs
// Based on technical drawing: 35mm (W) × 105mm (D) × 125mm (H)

interface PanelModuleProps {
    type: 'controller' | 'loop-driver' | 'power';
    label?: string;
    status?: 'online' | 'fault' | 'warning' | 'offline';
    isSelected?: boolean;
    onClick?: () => void;
    loopNumber?: number;  // For loop driver modules
}

// Module dimensions - scaled for display (1mm = 1.2px for better visibility)
const MODULE_WIDTH = 42;   // 35mm × 1.2
const MODULE_HEIGHT = 150; // 125mm × 1.2

// LED colors based on status
const STATUS_COLORS = {
    online: '#22C55E',   // Green
    fault: '#EF4444',    // Red
    warning: '#F59E0B',  // Amber
    offline: '#4B5563',  // Gray (dim)
};

export default function PanelModule({
    type,
    label,
    status = 'offline',
    isSelected = false,
    onClick,
    loopNumber = 1
}: PanelModuleProps) {
    const statusColor = STATUS_COLORS[status];

    // Get module-specific front panel content
    const renderFrontPanel = () => {
        switch (type) {
            case 'controller':
                return (
                    <div className="flex flex-col items-center justify-between h-full py-2">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[9px] font-bold text-slate-700 tracking-tight">CTRL</div>
                        </div>

                        {/* Status LEDs */}
                        <div className="flex flex-col gap-2 items-center">
                            <div className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: status === 'online' ? '#22C55E' : '#1F2937', boxShadow: status === 'online' ? '0 0 6px #22C55E' : 'none' }} />
                            <div className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: status === 'fault' ? '#EF4444' : '#1F2937', boxShadow: status === 'fault' ? '0 0 6px #EF4444' : 'none' }} />
                            <div className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: status === 'warning' ? '#F59E0B' : '#1F2937', boxShadow: status === 'warning' ? '0 0 6px #F59E0B' : 'none' }} />
                        </div>

                        {/* Terminal block */}
                        <div className="w-full px-1">
                            <div className="bg-emerald-500 rounded-sm h-8 flex items-center justify-center gap-[2px] px-1">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="w-[3px] h-5 bg-emerald-700 rounded-[1px]" />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'loop-driver':
                return (
                    <div className="flex flex-col items-center justify-between h-full py-2">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-slate-700">LOOP</div>
                            <div className="text-[10px] font-bold text-slate-800">{loopNumber}</div>
                        </div>

                        {/* Status LED */}
                        <div className="w-4 h-4 rounded-full border-2 border-slate-400" style={{ backgroundColor: statusColor, boxShadow: status === 'online' ? `0 0 8px ${statusColor}` : 'none' }} />

                        {/* Terminal block */}
                        <div className="w-full px-1">
                            <div className="bg-emerald-500 rounded-sm h-8 flex items-center justify-center gap-[2px] px-1">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="w-[3px] h-5 bg-emerald-700 rounded-[1px]" />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'power':
                return (
                    <div className="flex flex-col items-center justify-between h-full py-2">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[8px] font-bold text-slate-700">PSU</div>
                        </div>

                        {/* INPUT terminals */}
                        <div className="w-full px-1">
                            <div className="text-[6px] text-slate-600 text-center mb-0.5">IN</div>
                            <div className="bg-emerald-500 rounded-sm h-5 flex items-center justify-center gap-[2px] px-1">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="w-[4px] h-3 bg-emerald-700 rounded-[1px]" />
                                ))}
                            </div>
                        </div>

                        {/* OUTPUT terminals */}
                        <div className="w-full px-1">
                            <div className="text-[6px] text-slate-600 text-center mb-0.5">OUT</div>
                            <div className="bg-emerald-500 rounded-sm h-5 flex items-center justify-center gap-[2px] px-1">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="w-[4px] h-3 bg-emerald-700 rounded-[1px]" />
                                ))}
                            </div>
                        </div>

                        {/* Status indicator */}
                        <div className="w-3 h-3 rounded-full border border-slate-400" style={{ backgroundColor: status === 'online' ? '#22C55E' : '#1F2937', boxShadow: status === 'online' ? '0 0 6px #22C55E' : 'none' }} />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            onClick={onClick}
            className={`
                relative cursor-pointer transition-all duration-200 hover:scale-105
                ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900' : ''}
            `}
            style={{ width: MODULE_WIDTH, height: MODULE_HEIGHT }}
            title={label || type}
        >
            {/* Unified plastic case */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 rounded shadow-lg border border-slate-300 overflow-hidden">
                {/* Ventilation slots at top */}
                <div className="absolute top-2 left-2 right-2 flex flex-col gap-1">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-[3px] bg-slate-300 rounded-full" />
                    ))}
                </div>

                {/* Front panel content area */}
                <div className="absolute top-7 left-1 right-1 bottom-4">
                    {renderFrontPanel()}
                </div>

                {/* DIN rail mounting clip at bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-slate-400 rounded-t border-t border-x border-slate-500" />
            </div>

            {/* Label below module */}
            {label && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-16 text-center">
                    <span className="text-[9px] text-slate-400 truncate block">{label}</span>
                </div>
            )}
        </div>
    );
}

// Empty slot component for available DIN rail positions
export function EmptyModuleSlot({ onClick }: { onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer transition-all duration-200 hover:bg-slate-700/30 rounded border-2 border-dashed border-slate-600/50 flex items-center justify-center hover:border-slate-500"
            style={{ width: MODULE_WIDTH, height: MODULE_HEIGHT }}
            title="Empty slot"
        >
            <div className="flex flex-col items-center gap-2 text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
            </div>
        </div>
    );
}

// Export dimensions for use in other components
export { MODULE_WIDTH, MODULE_HEIGHT };
