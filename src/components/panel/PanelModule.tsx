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

// Module dimensions - scaled smaller (10% reduction) to match front panel
const MODULE_WIDTH = 54;   // ~54px
const MODULE_HEIGHT = 180; // ~180px



export default function PanelModule({
    type,
    label,
    status = 'offline',
    isSelected = false,
    onClick,
    loopNumber: _loopNumber = 1
}: PanelModuleProps) {
    // const statusColor = STATUS_COLORS[status]; // Unused in new design

    // Get module-specific front panel content
    const renderFrontPanel = () => {
        switch (type) {
            case 'controller':
                return (
                    <div className="flex flex-col h-full relative px-[2px] py-1">
                        {/* Header */}
                        <div className="text-center mb-1">
                            <div className="text-[7px] font-bold text-black tracking-tight leading-tight">BSA-1100</div>
                        </div>

                        {/* LED Status Stack */}
                        <div className="flex flex-col gap-[2px] px-1 mb-2">
                            {[
                                { color: '#DC2626', label: 'Alarm' },
                                { color: '#EAB308', label: 'Fault' },
                                { color: '#EAB308', label: 'Sys Fault' },
                                { color: '#EAB308', label: 'Local C&E' },
                                { color: '#3B82F6', label: 'Heartbeat' },
                                { color: '#3B82F6', label: 'SPE Act' },
                                { color: '#22C55E', label: 'Power' }
                            ].map((led, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div
                                        className="w-[4px] h-[4px] rounded-full border-[0.5px] border-slate-600"
                                        style={{
                                            backgroundColor: led.label === 'Power' && status === 'online' ? led.color :
                                                led.label === 'Alarm' && status === 'warning' ? led.color :
                                                    '#D1D5DB'
                                        }}
                                    />
                                    <span className="text-[4.5px] font-medium text-black leading-none">{led.label}</span>
                                </div>
                            ))}
                        </div>



                        {/* USB Port */}
                        <div className="flex justify-center mb-1">
                            <div className="w-6 h-3 bg-slate-300 border border-slate-500 rounded-[1px] relative flex items-center justify-center">
                                <div className="w-4 h-[1px] bg-slate-400 absolute top-1" />
                                <div className="w-4 h-[3px] bg-white border border-slate-400 mt-1" />
                            </div>
                        </div>

                        {/* RJ45 Port */}
                        <div className="flex justify-center mb-1">
                            <div className="w-5 h-5 bg-slate-200 border border-slate-400 shadow-inner flex items-end justify-center overflow-hidden relative rounded-[1px]">
                                {/* Pins */}
                                <div className="absolute top-0 left-0 right-0 h-2 bg-slate-300 border-b border-slate-400" />
                                <div className="flex gap-[1px] mb-[2px]">
                                    {Array(8).fill(0).map((_, i) => (
                                        <div key={i} className="w-[1px] h-2 bg-yellow-600" />
                                    ))}
                                </div>
                                {/* Port LEDs */}
                                <div className="absolute top-[1px] left-[1px] w-1 h-1 bg-yellow-400 rounded-full" />
                                <div className="absolute top-[1px] right-[1px] w-1 h-1 bg-green-500 rounded-full" />
                            </div>
                        </div>

                        {/* Terminal Blocks (Stack of 3 to fit) */}
                        <div className="mt-auto mb-[-3px] flex flex-col gap-[1px]">
                            {[1, 2, 3].map((_, idx) => (
                                <div key={idx} className="mx-auto border border-emerald-800 bg-emerald-600 w-full max-w-[36px] flex flex-col p-[1px] rounded-[1px]">
                                    <div className="flex justify-between gap-[1px]">
                                        <div className="flex flex-col gap-[1px] border-r border-emerald-700 pr-[1px] w-1/2">
                                            {Array(2).fill(0).map((_, i) => (
                                                <div key={i} className="h-[6px] bg-emerald-500 border border-emerald-700 rounded-[1px] flex items-center justify-center shadow-inner">
                                                    <div className="w-[3px] h-[3px] rounded-full border border-emerald-800 bg-slate-300 flex items-center justify-center">
                                                        <div className="w-[1px] h-[2px] bg-slate-600 -rotate-45" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-col gap-[1px] w-1/2 pl-[1px]">
                                            {Array(2).fill(0).map((_, i) => (
                                                <div key={i} className="h-[6px] bg-emerald-500 border border-emerald-700 rounded-[1px] flex items-center justify-center shadow-inner">
                                                    <div className="w-[3px] h-[3px] rounded-full border border-emerald-800 bg-slate-300 flex items-center justify-center">
                                                        <div className="w-[1px] h-[2px] bg-slate-600 -rotate-45" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'loop-driver':
                return (
                    <div className="flex flex-col h-full relative px-[2px] py-1">
                        {/* Header */}
                        <div className="text-center mb-1">
                            <div className="text-[7px] font-bold text-black tracking-tight leading-tight">BSD-1000</div>
                        </div>

                        {/* LED Status Stack */}
                        <div className="flex flex-col gap-[2px] px-1 mb-2">
                            {[
                                { color: '#DC2626', label: 'Alarm' },        // Red
                                { color: '#EAB308', label: 'Fault' },        // Yellow
                                { color: '#EAB308', label: 'Sys Fault' },    // Yellow
                                { color: '#EAB308', label: 'Local C&E' },    // Yellow
                                { color: '#3B82F6', label: 'Heartbeat' },    // Blue
                                { color: '#3B82F6', label: 'SPE Act' },      // Blue
                                { color: '#22C55E', label: 'Power' }         // Green
                            ].map((led, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div
                                        className="w-[4px] h-[4px] rounded-full border-[0.5px] border-slate-600"
                                        style={{
                                            backgroundColor: led.label === 'Power' && status === 'online' ? led.color :
                                                led.label === 'Alarm' && status === 'warning' ? led.color : // Just demo logic
                                                    '#D1D5DB' // Grey when off
                                        }}
                                    />
                                    <span className="text-[4.5px] font-medium text-black leading-none">{led.label}</span>
                                </div>
                            ))}
                        </div>





                        {/* Terminal Block (Green) */}
                        <div className="mx-auto mt-auto mb-[-5px] border border-emerald-800 bg-emerald-600 w-full max-w-[36px] flex flex-col p-[1px] rounded-[1px]">
                            <div className="flex justify-between gap-[1px]">
                                {/* Left Column Terminals */}
                                <div className="flex flex-col gap-[1px] border-r border-emerald-700 pr-[1px] w-1/2">
                                    {['+', '-', 'G', '+', '-', 'G'].map((_, i) => (
                                        <div key={i} className="h-[8px] bg-emerald-500 border border-emerald-700 rounded-[1px] flex items-center justify-center relative shadow-inner">
                                            <div className="w-1 h-1 rounded-full border border-emerald-800 bg-slate-300 flex items-center justify-center shadow-sm">
                                                <div className="w-[1px] h-[2px] bg-slate-600 -rotate-45" />
                                            </div>

                                        </div>
                                    ))}
                                </div>
                                {/* Right Column (Empty) */}
                                <div className="flex flex-col gap-[1px] w-1/2 pl-[1px]">
                                    {Array(6).fill(0).map((_, i) => (
                                        <div key={i} className="h-[8px] bg-emerald-500 border border-emerald-700 rounded-[1px] flex items-center justify-center shadow-inner">
                                            <div className="w-1 h-1 rounded-full border border-emerald-800 bg-slate-300 flex items-center justify-center shadow-sm">
                                                <div className="w-[1px] h-[2px] bg-slate-600 -rotate-45" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                {/* Front panel content area */}
                <div className="absolute top-1 left-1 right-1 bottom-3">
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
