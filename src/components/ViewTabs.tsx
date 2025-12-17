// View tab navigation component
interface ViewTabsProps {
    activeView: 'floorplan' | 'panel';
    onViewChange: (view: 'floorplan' | 'panel') => void;
}

export default function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
    return (
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
                onClick={() => onViewChange('panel')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${activeView === 'panel'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
            >
                Panel
            </button>
        </div>
    );
}
