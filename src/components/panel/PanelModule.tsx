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

// Module dimensions - scaled larger for better visibility
const MODULE_WIDTH = 60;   // ~37.5mm scale
const MODULE_HEIGHT = 200; // ~125mm scale

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
                    <div className="flex flex-col items-center justify-between h-full py-3">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[11px] font-bold text-slate-700 tracking-tight">CTRL</div>
                        </div>

                        {/* Status LEDs */}
                        <div className="flex flex-col gap-3 items-center">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400" style={{ backgroundColor: status === 'online' ? '#22C55E' : '#1F2937', boxShadow: status === 'online' ? '0 0 8px #22C55E' : 'none' }} />
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400" style={{ backgroundColor: status === 'fault' ? '#EF4444' : '#1F2937', boxShadow: status === 'fault' ? '0 0 8px #EF4444' : 'none' }} />
                            <div className="w-4 h-4 rounded-full border-2 border-slate-400" style={{ backgroundColor: status === 'warning' ? '#F59E0B' : '#1F2937', boxShadow: status === 'warning' ? '0 0 8px #F59E0B' : 'none' }} />
                        </div>

                        {/* Terminal block */}
                        <div className="w-full px-1">
                            <div className="bg-emerald-500 rounded h-10 flex items-center justify-center gap-[3px] px-1">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="w-[4px] h-6 bg-emerald-700 rounded-sm" />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'loop-driver':
                return (
                    <div className="flex flex-col items-center justify-between h-full py-3">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-700">LOOP</div>
                            <div className="text-[14px] font-bold text-slate-800">{loopNumber}</div>
                        </div>

                        {/* Status LED */}
                        <div className="w-5 h-5 rounded-full border-2 border-slate-400" style={{ backgroundColor: statusColor, boxShadow: status === 'online' ? `0 0 10px ${statusColor}` : 'none' }} />

                        {/* Terminal block */}
                        <div className="w-full px-1">
                            <div className="bg-emerald-500 rounded h-10 flex items-center justify-center gap-[3px] px-1">
                                {Array(6).fill(0).map((_, i) => (
                                    <div key={i} className="w-[4px] h-6 bg-emerald-700 rounded-sm" />
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'power':
                return (
                    <div className="flex flex-col items-center justify-between h-full py-3">
                        {/* Label */}
                        <div className="text-center">
                            <div className="text-[10px] font-bold text-slate-700">PSU</div>
                        </div>

                        {/* INPUT terminals */}
                        <div className="w-full px-1">
                            <div className="text-[8px] text-slate-600 text-center mb-1">IN</div>
                            <div className="bg-emerald-500 rounded h-7 flex items-center justify-center gap-[3px] px-1">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="w-[5px] h-4 bg-emerald-700 rounded-sm" />
                                ))}
                            </div>
                        </div>

                        {/* OUTPUT terminals */}
                        <div className="w-full px-1">
                            <div className="text-[8px] text-slate-600 text-center mb-1">OUT</div>
                            <div className="bg-emerald-500 rounded h-7 flex items-center justify-center gap-[3px] px-1">
                                {Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="w-[5px] h-4 bg-emerald-700 rounded-sm" />
                                ))}
                            </div>
                        </div>

                        {/* Status indicator */}
                        <div className="w-4 h-4 rounded-full border-2 border-slate-400" style={{ backgroundColor: status === 'online' ? '#22C55E' : '#1F2937', boxShadow: status === 'online' ? '0 0 8px #22C55E' : 'none' }} />
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
            <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 rounded-lg shadow-lg border border-slate-300 overflow-hidden">
                {/* Ventilation slots at top */}
                <div className="absolute top-2 left-2 right-2 flex flex-col gap-1.5">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-[3px] bg-slate-300 rounded-full" />
                    ))}
                </div>

                {/* DIN rail mounting slot in the MIDDLE of module */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-6 flex items-center justify-center">
                    <div className="w-full h-1 bg-slate-400/30" />
                </div>

                {/* Front panel content area */}
                <div className="absolute top-8 left-1 right-1 bottom-3">
                    {renderFrontPanel()}
                </div>
            </div>

            {/* Label below module */}
            {label && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-20 text-center">
                    <span className="text-[10px] text-slate-400 truncate block">{label}</span>
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
            className="cursor-pointer transition-all duration-200 hover:bg-slate-700/30 rounded-lg border-2 border-dashed border-slate-600/50 flex items-center justify-center hover:border-slate-500"
            style={{ width: MODULE_WIDTH, height: MODULE_HEIGHT }}
            title="Empty slot"
        >
            <div className="flex flex-col items-center gap-2 text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
            </div>
        </div>
    );
}

// Export dimensions for use in other components
export { MODULE_WIDTH, MODULE_HEIGHT };
