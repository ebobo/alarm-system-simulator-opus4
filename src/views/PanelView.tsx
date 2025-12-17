// Panel Simulator View - AutroSafe style control panel
interface PanelViewProps {
    projectName: string;
}

export default function PanelView({ projectName }: PanelViewProps) {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
            <div className="max-w-3xl w-full">
                {/* Panel Frame */}
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl p-8">
                    {/* Panel Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-wider">AUTROSAFE</h2>
                        <p className="text-slate-400 text-sm">{projectName} Fire Alarm Panel</p>
                    </div>

                    {/* LCD Display */}
                    <div className="bg-slate-900 rounded-lg border-2 border-slate-600 p-4 mb-6 font-mono">
                        <div className="bg-green-950 rounded p-4 border border-green-900">
                            <p className="text-green-400 text-lg">SYSTEM NORMAL</p>
                            <p className="text-green-600 text-sm mt-2">No configuration loaded</p>
                            <p className="text-green-600 text-sm">Loop: Offline</p>
                            <p className="text-green-700 text-xs mt-4">Press LOAD CONFIG to begin</p>
                        </div>
                    </div>

                    {/* Status LEDs */}
                    <div className="flex justify-center gap-6 mb-8">
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
                            <span className="text-xs text-slate-400 mt-1">POWER</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-400 mt-1">ALARM</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-400 mt-1">FAULT</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-400 mt-1">DISABLED</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-slate-600" />
                            <span className="text-xs text-slate-400 mt-1">MUTE</span>
                        </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {/* Navigation cluster */}
                        <div className="col-span-1 flex flex-col items-center gap-1">
                            <button className="w-10 h-10 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold transition-colors">
                                ▲
                            </button>
                            <div className="flex gap-1">
                                <button className="w-10 h-10 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold transition-colors">
                                    ◄
                                </button>
                                <button className="w-10 h-10 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold transition-colors">
                                    ►
                                </button>
                            </div>
                            <button className="w-10 h-10 bg-slate-600 hover:bg-slate-500 rounded text-white font-bold transition-colors">
                                ▼
                            </button>
                        </div>

                        {/* Main control buttons */}
                        <div className="col-span-3 grid grid-cols-4 gap-2">
                            <button className="py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg">
                                RESET
                            </button>
                            <button className="py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg">
                                MUTE
                            </button>
                            <button className="py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg">
                                ACK
                            </button>
                            <button className="py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg">
                                TEST
                            </button>

                            <button className="py-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-sm font-semibold transition-colors">
                                MENU
                            </button>
                            <button className="py-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-sm font-semibold transition-colors">
                                ESC
                            </button>
                            <button className="py-3 bg-slate-600 hover:bg-slate-500 rounded-lg text-white text-sm font-semibold transition-colors col-span-2">
                                ENTER
                            </button>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex gap-3 justify-center border-t border-slate-600 pt-6">
                        <button className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-white font-semibold transition-all shadow-lg shadow-orange-500/25">
                            Load Config
                        </button>
                        <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed" disabled>
                            Power On Loop
                        </button>
                    </div>

                    {/* Status Bar */}
                    <div className="text-center mt-4">
                        <p className="text-slate-500 text-xs">Status: Standby - No Config Loaded</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
