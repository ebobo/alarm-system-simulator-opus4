interface SidebarProps {
    onGenerate: () => void;
    onOpenConfig: () => void;
}

export default function Sidebar({ onGenerate, onOpenConfig }: SidebarProps) {
    return (
        <div className="w-72 bg-gradient-to-b from-slate-800 to-slate-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Fire Alarm</h1>
                        <p className="text-xs text-slate-400">System Simulation</p>
                    </div>
                </div>
            </div>

            {/* Plans Section */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Floor Plans
                </h2>

                <div className="space-y-2">
                    {/* Generated Plan Option */}
                    <div className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 cursor-pointer transition-all duration-200 border border-slate-600/50 group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-white">Generated Plan</p>
                                <p className="text-xs text-slate-400">Randomly generated layout</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-700 space-y-3">
                <button
                    onClick={onOpenConfig}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 
                     rounded-lg transition-all duration-200 text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configure Rooms
                </button>

                <button
                    onClick={onGenerate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                     bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600
                     rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-orange-500/25"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Generate New Plan
                </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                    Stage 1: Floor Plan Viewer
                </p>
            </div>
        </div>
    );
}
