// Panel Frame component - wraps the entire panel simulator
import type { ReactNode } from 'react';

interface PanelFrameProps {
    projectName: string;
    children: ReactNode;
    statusText?: string;
}

export default function PanelFrame({ projectName, children, statusText }: PanelFrameProps) {
    return (
        <div className="flex-1 flex items-center justify-center bg-slate-900 p-8">
            <div className="max-w-3xl w-full">
                {/* Panel Frame */}
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl p-8">
                    {/* Panel Header */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white tracking-wider">AutroSafe V</h2>
                        <p className="text-slate-400 text-sm">{projectName} Fire Alarm Panel</p>
                    </div>

                    {/* Panel Content */}
                    {children}

                    {/* Status Bar */}
                    {statusText && (
                        <div className="text-center mt-4">
                            <p className="text-slate-500 text-xs">{statusText}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
