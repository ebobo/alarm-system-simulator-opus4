// View tab navigation component
import { useState } from 'react';

interface ViewTabsProps {
    activeView: 'floorplan' | 'panel';
    onViewChange: (view: 'floorplan' | 'panel') => void;
    isPanelEnabled: boolean;
    panelDisabledReason?: 'no-panel' | 'not-saved';
}

export default function ViewTabs({ activeView, onViewChange, isPanelEnabled, panelDisabledReason }: ViewTabsProps) {
    const [showPopup, setShowPopup] = useState(false);

    const handlePanelClick = () => {
        if (isPanelEnabled) {
            onViewChange('panel');
        } else {
            setShowPopup(true);
            setTimeout(() => setShowPopup(false), 3000); // Auto-hide after 3 seconds
        }
    };

    const getPopupMessage = () => {
        if (panelDisabledReason === 'not-saved') {
            return 'Please save the project first before accessing the Panel view.';
        }
        return 'Please add a Panel device to the floor plan first.';
    };

    return (
        <div className="relative">
            <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                <button
                    onClick={() => onViewChange('floorplan')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeView === 'floorplan'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    Floor Plan
                </button>
                <button
                    onClick={handlePanelClick}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeView === 'panel'
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                            : isPanelEnabled
                                ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                                : 'text-slate-600 cursor-not-allowed'
                        }`}
                >
                    Panel
                </button>
            </div>

            {/* Popup message for disabled panel tab */}
            {showPopup && (
                <div className="absolute top-full left-0 mt-2 z-50 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                    <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-slate-300">{getPopupMessage()}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
