// View tab navigation component
import { useState } from 'react';

interface ViewTabsProps {
    activeView: 'floorplan' | 'panel' | 'simulation';
    onViewChange: (view: 'floorplan' | 'panel' | 'simulation') => void;
    isPanelEnabled: boolean;
    panelDisabledReason?: 'no-panel' | 'not-saved';
    isSimulationEnabled: boolean;
    simulationDisabledReason?: 'no-config' | 'config-mismatch' | 'not-saved' | 'no-floorplan';
}

export default function ViewTabs({
    activeView,
    onViewChange,
    isPanelEnabled,
    panelDisabledReason,
    isSimulationEnabled,
    simulationDisabledReason
}: ViewTabsProps) {
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');

    const handlePanelClick = () => {
        if (isPanelEnabled) {
            onViewChange('panel');
        } else {
            showDisabledPopup('panel');
        }
    };

    const handleSimulationClick = () => {
        if (isSimulationEnabled) {
            onViewChange('simulation');
        } else {
            showSimulationDisabledPopup();
        }
    };

    const showDisabledPopup = (view: 'panel') => {
        if (panelDisabledReason === 'not-saved') {
            setPopupMessage(`Please save the project first before accessing the ${view === 'panel' ? 'Panel' : 'Simulation'} view.`);
        } else {
            setPopupMessage('Please add a Panel device to the floor plan first.');
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    const showSimulationDisabledPopup = () => {
        if (simulationDisabledReason === 'no-floorplan') {
            setPopupMessage('Please generate a floor plan first before accessing the Simulation view.');
        } else if (simulationDisabledReason === 'not-saved') {
            setPopupMessage('Please save the project first before accessing the Simulation view.');
        } else if (simulationDisabledReason === 'no-config') {
            setPopupMessage('Please load a configuration file (.faconfig) before running the simulation.');
        } else if (simulationDisabledReason === 'config-mismatch') {
            setPopupMessage('Configuration mismatch detected. Please ensure all devices match the loaded configuration.');
        } else {
            setPopupMessage('Simulation requires a saved project with a matching configuration.');
        }
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
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
                <button
                    onClick={handleSimulationClick}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeView === 'simulation'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                        : isSimulationEnabled
                            ? 'text-slate-400 hover:text-white hover:bg-slate-700'
                            : 'text-slate-600 cursor-not-allowed'
                        }`}
                >
                    Simulation
                </button>
            </div>

            {/* Popup message for disabled tabs */}
            {showPopup && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                    <div className="flex items-start gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-slate-300">{popupMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
