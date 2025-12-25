// Realistic Battery Component
// Visual representation of a 12V 7Ah lead-acid battery

export default function PanelBattery({ label }: { label: string }) {
    return (
        <div className="relative w-40 h-24 bg-slate-900 rounded-sm shadow-xl flex flex-col items-center justify-center group overflow-visible">
            {/* Battery Body - Matte Black Texture */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 rounded-sm border border-slate-700/50" />

            {/* Top Lid Line */}
            <div className="absolute top-6 left-0 right-0 h-[2px] bg-slate-950/50 border-b border-slate-700/30" />

            {/* Positive Terminal (Red) */}
            <div className="absolute -top-1.5 left-4 flex flex-col items-center">
                {/* Terminal Post */}
                <div className="w-4 h-3 bg-slate-300 rounded-sm mb-[1px] relative shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
                </div>
                {/* Connector/Wire base */}
                <div className="w-3 h-2 bg-red-600 rounded-full shadow-inner border border-red-800" />
                {/* Wire */}
                <div className="absolute top-1 left-3 w-8 h-8 border-t-4 border-l-4 border-slate-900 rounded-tl-xl -z-10" />
            </div>

            {/* Negative Terminal (Black) */}
            <div className="absolute -top-1.5 right-4 flex flex-col items-center">
                {/* Terminal Post */}
                <div className="w-4 h-3 bg-slate-300 rounded-sm mb-[1px] relative shadow-sm">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40" />
                </div>
                {/* Connector/Wire base */}
                <div className="w-3 h-2 bg-slate-900 rounded-full shadow-inner border border-slate-600" />
                {/* Wire */}
                <div className="absolute top-1 right-3 w-8 h-8 border-t-4 border-r-4 border-slate-900 rounded-tr-xl -z-10" />
            </div>

            {/* Battery Label Info */}
            <div className="relative z-10 flex flex-col items-center mt-4">
                <span className="text-sm font-medium text-slate-200 tracking-wide text-shadow">{label}</span>
                <span className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Rechargeable Battery</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">12V 7.2Ah</span>

                {/* Safety Icons / Text */}
                <div className="flex gap-2 mt-2 opacity-60">
                    <div className="w-3 h-3 border border-slate-500 rounded-full flex items-center justify-center text-[6px] text-slate-500">Pb</div>
                    <div className="w-3 h-3 border border-slate-500 rounded-full flex items-center justify-center text-[6px] text-slate-500">♻</div>
                </div>
            </div>

            {/* Side Screws */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 shadow-inner border border-slate-700" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-800 shadow-inner border border-slate-700" />
        </div>
    );
}
