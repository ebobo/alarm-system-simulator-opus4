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
            className="bg-slate-700/50 hover:bg-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing
                       transition-all duration-200 border border-slate-600/50"
        >
            <div className="flex items-center gap-3">
                {/* Device icon - different shape based on category */}
                <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center ${styles.border} border`}>
                    {deviceType.category === 'controller' ? (
                        // Rectangle icon for controller/loop driver
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-6 h-4 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 16"
                            stroke="currentColor"
                        >
                            <rect x="1" y="1" width="22" height="14" rx="2" strokeWidth="2" />
                            <text x="12" y="11" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">LD</text>
                        </svg>
                    ) : (
                        // Circle icon for detectors
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${styles.icon}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <circle cx="12" cy="12" r="4" strokeWidth="2" />
                        </svg>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{deviceType.name}</p>
                    <p className="text-xs text-slate-400">{deviceType.terminals.length} terminals</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Right-side panel containing draggable device palette
 */
export default function DevicePalette() {
    const deviceTypes = Object.values(DEVICE_TYPES);

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
                    <div>
                        <h2 className="text-sm font-semibold">Device Palette</h2>
                        <p className="text-xs text-slate-400">Drag to floor plan</p>
                    </div>
                </div>
            </div>

            {/* Devices List */}
            <div className="flex-1 p-3 overflow-y-auto">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Loop Devices
                </h3>

                <div className="space-y-2">
                    {deviceTypes.map((deviceType) => (
                        <DraggableDeviceItem key={deviceType.id} deviceType={deviceType} />
                    ))}
                </div>

                {/* Future devices placeholder */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 text-center italic">
                        More devices coming soon
                    </p>
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
