import { useDraggable } from '@dnd-kit/core';
import { DEVICE_TYPES } from '../types/devices';
import type { DeviceType } from '../types/devices';

interface DraggableDeviceItemProps {
    deviceType: DeviceType;
}

/**
 * Individual draggable device item in the palette
 */
function DraggableDeviceItem({ deviceType }: DraggableDeviceItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${deviceType.id}`,
        data: {
            type: 'device',
            deviceTypeId: deviceType.id,
        },
    });

    // Get category-specific styling
    const getCategoryStyles = (category: DeviceType['category']) => {
        switch (category) {
            case 'detector':
                return {
                    bg: 'bg-blue-500/20',
                    icon: 'text-blue-400',
                    border: 'border-blue-500/30',
                };
            case 'sounder':
                return {
                    bg: 'bg-orange-500/20',
                    icon: 'text-orange-400',
                    border: 'border-orange-500/30',
                };
            case 'mcp':
                return {
                    bg: 'bg-red-500/20',
                    icon: 'text-red-400',
                    border: 'border-red-500/30',
                };
            case 'io':
                return {
                    bg: 'bg-green-500/20',
                    icon: 'text-green-400',
                    border: 'border-green-500/30',
                };
            case 'controller':
                return {
                    bg: 'bg-cyan-500/20',
                    icon: 'text-cyan-400',
                    border: 'border-cyan-500/30',
                };
        }
    };

    const styles = getCategoryStyles(deviceType.category);

    // Hide completely while dragging
    if (isDragging) {
        return <div ref={setNodeRef} className="h-0 overflow-hidden" {...listeners} {...attributes} />;
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-2 cursor-grab active:cursor-grabbing
                       transition-all duration-200 border border-slate-600/50"
        >
            <div className="flex flex-col items-center gap-1">
                {/* Device icon - different shape based on category */}
                <div className={`w-8 h-8 ${styles.bg} rounded-lg flex items-center justify-center ${styles.border} border`}>
                    {deviceType.id === 'panel' ? (
                        // Panel icon - rectangle with "P" label
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-3 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">P</text>
                        </svg>
                    ) : deviceType.category === 'controller' ? (
                        // Rectangle icon for controller/loop driver
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-3 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">LD</text>
                        </svg>
                    ) : deviceType.category === 'mcp' ? (
                        // Square icon for MCP (Manual Call Point)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <rect x="2" y="2" width="20" height="20" rx="2" strokeWidth="2" />
                            <path d="M7 12h10M12 7v10" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ) : deviceType.category === 'sounder' ? (
                        // Circle with sound waves for sounder
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="8" strokeWidth="2" />
                            <path d="M9 10 Q7 12 9 14" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M15 10 Q17 12 15 14" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    ) : deviceType.id === 'input-unit' ? (
                        // Input Unit icon - square with arrow pointing in
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                            <path d="M12 8v8M9 11l3-3 3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : deviceType.id === 'output-unit' ? (
                        // Output Unit icon - square with arrow pointing out
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                            <path d="M12 8v8M9 13l3 3 3-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : deviceType.id === 'AG-head' ? (
                        // AG Head icon - white dome with red LED (smaller version)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" fill="#F8FAFC" />
                            <circle cx="12" cy="12" r="5" strokeWidth="1.5" fill="#E2E8F0" />
                            <circle cx="12" cy="12" r="2" strokeWidth="1" fill="#EF4444" />
                        </svg>
                    ) : (
                        // Circle icon for detectors (AG Socket)
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-4 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <circle cx="12" cy="12" r="4" strokeWidth="2" />
                        </svg>
                    )}
                </div>

                <p className="text-xs font-medium text-white text-center leading-tight">{deviceType.name}</p>
            </div>
        </div>
    );
}


/**
 * Right-side panel containing draggable device palette
 */
interface DevicePaletteProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

export default function DevicePalette({ isCollapsed, onToggleCollapse }: DevicePaletteProps) {
    const deviceTypes = Object.values(DEVICE_TYPES);

    // Collapsed view - narrow strip with icon and vertical label
    if (isCollapsed) {
        return (
            <div className="flex-1 flex flex-col items-center py-4 text-white overflow-hidden">
                {/* Expand button at top */}
                <button
                    onClick={onToggleCollapse}
                    className="w-8 h-8 mb-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition-colors"
                    title="Expand Device Palette"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Grid icon */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                </div>

                {/* Vertical label */}
                <div className="flex-1 flex items-center">
                    <span
                        className="text-xs font-semibold text-slate-400 whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                    >
                        Device Palette
                    </span>
                </div>
            </div>
        );
    }

    // Expanded view - full content
    return (
        <div className="flex-1 flex flex-col text-white overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                            />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold">Device Palette</h2>
                        <p className="text-xs text-slate-400">Drag to floor plan</p>
                    </div>
                    {/* Collapse button */}
                    <button
                        onClick={onToggleCollapse}
                        className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition-colors"
                        title="Collapse Device Palette"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Devices List */}
            <div className="flex-1 p-3 overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Loop Devices
                </h3>

                {/* 2-column grid layout */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Row 1: AG Socket, AG Head */}
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'AG-socket')!} />
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'AG-head')!} />

                    {/* Row 2: MCP, Sounder */}
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'mcp')!} />
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'sounder')!} />

                    {/* Row 3: Input Unit, Output Unit */}
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'input-unit')!} />
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'output-unit')!} />

                    {/* Row 4: Loop Driver, Panel */}
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'loop-driver')!} />
                    <DraggableDeviceItem deviceType={deviceTypes.find(d => d.id === 'panel')!} />
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                    Stage 2: Device Placement
                </p>
            </div>
        </div>
    );
}
