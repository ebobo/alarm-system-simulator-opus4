import type { PlacedDevice, Connection, RoomInfo } from '../types/devices';
import { PIXELS_PER_METER } from '../utils/floorPlanGenerator';

interface FloorPlanInfo {
    name: string;
    rooms: { offices: number; meetingRooms: number; toilets: number };
    deviceCount: number;
    wireCount: number;
}

interface DevicePropertyPanelProps {
    selectedDevice: PlacedDevice | null;
    selectedWire: Connection | null;
    selectedRoom: RoomInfo | null;
    floorPlanInfo: FloorPlanInfo;
    onUpdateDevice: (device: PlacedDevice) => void;
    onDeleteWire?: (wireId: string) => void;
    onDeleteDevice?: (deviceId: string) => void;
}

// Format room type for display
const formatRoomType = (type: string): string => {
    const typeMap: Record<string, string> = {
        office: 'Office',
        meeting: 'Meeting Room',
        toilet: 'Toilet',
        entrance: 'Entrance',
        public: 'Public Area',
        server: 'Server Room',
        storage: 'Storage',
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

/**
 * Property panel component for displaying and editing device properties
 * Shows floor plan info when nothing selected, room info when room selected,
 * wire info when wire selected, device info when device selected
 */
export default function DevicePropertyPanel({
    selectedDevice,
    selectedWire,
    selectedRoom,
    floorPlanInfo,
    onUpdateDevice,
    onDeleteWire,
    onDeleteDevice
}: DevicePropertyPanelProps) {
    // Show room info when room is selected
    if (selectedRoom) {
        // Convert pixels to meters (approx 27.33 px/m based on 30m building width)
        const widthMeters = (selectedRoom.width / PIXELS_PER_METER).toFixed(1);
        const heightMeters = (selectedRoom.height / PIXELS_PER_METER).toFixed(1);
        const areaMeters = ((selectedRoom.width / PIXELS_PER_METER) * (selectedRoom.height / PIXELS_PER_METER)).toFixed(1);

        return (
            <div className="border-t border-slate-700 bg-slate-800/50">
                <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Room Properties
                    </h3>
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Name</span>
                        <span className="text-xs text-slate-200 font-medium">{selectedRoom.uniqueLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Type</span>
                        <span className="text-xs text-slate-200">{formatRoomType(selectedRoom.type)}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Width</span>
                            <span className="text-xs text-slate-200 font-mono">{widthMeters} m</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">Height</span>
                            <span className="text-xs text-slate-200 font-mono">{heightMeters} m</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">Area</span>
                            <span className="text-xs text-slate-200 font-mono">{areaMeters} m²</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show floor plan info when nothing is selected
    if (!selectedDevice && !selectedWire) {
        return (
            <div className="border-t border-slate-700 bg-slate-800/50">
                <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Floor Plan
                    </h3>
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Name</span>
                        <span className="text-xs text-slate-200">{floorPlanInfo.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Offices</span>
                        <span className="text-xs text-slate-200">{floorPlanInfo.rooms.offices}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Meeting Rooms</span>
                        <span className="text-xs text-slate-200">{floorPlanInfo.rooms.meetingRooms}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Toilets</span>
                        <span className="text-xs text-slate-200">{floorPlanInfo.rooms.toilets}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Devices</span>
                            <span className="text-xs text-slate-200">{floorPlanInfo.deviceCount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">Connections</span>
                            <span className="text-xs text-slate-200">{floorPlanInfo.wireCount}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show wire info when wire is selected
    if (selectedWire) {
        return (
            <div className="border-t border-slate-700 bg-slate-800/50">
                <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Wire Connection
                    </h3>
                </div>
                <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Status</span>
                        <span className="text-xs text-slate-200">Connected</span>
                    </div>
                    <div className="pt-2">
                        <button
                            onClick={() => onDeleteWire?.(selectedWire.id)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold 
                                       py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete Wire
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mt-1">
                            or press Delete key
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Device is selected - show device properties
    if (!selectedDevice) return null;

    const isLoopDriver = selectedDevice.typeId === 'loop-driver';
    const isPanel = selectedDevice.typeId === 'panel';

    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newLabel = e.target.value.slice(0, 20); // Max 20 characters
        onUpdateDevice({ ...selectedDevice, label: newLabel });
    };

    const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateDevice({ ...selectedDevice, ipAddress: e.target.value });
    };

    // Format SN as 12-digit hex string (48 bits)
    const formatSN = (sn: number): string => {
        return sn.toString(16).toUpperCase().padStart(12, '0');
    };

    return (
        <div className="border-t border-slate-700 bg-slate-800/50">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Device Properties
                </h3>
            </div>

            {/* Properties Grid */}
            <div className="p-3 space-y-2">
                {isLoopDriver ? (
                    /* Loop Driver Properties */
                    <>
                        {/* Type - Always BSD-1000 */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                BSD-1000
                            </span>
                        </div>

                        {/* IP Address - Editable */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">IP</span>
                            <input
                                type="text"
                                value={selectedDevice.ipAddress || ''}
                                onChange={handleIpChange}
                                placeholder="0.0.0.0"
                                className="w-28 text-xs text-slate-200 font-mono bg-slate-700 border border-slate-600 
                                           rounded px-2 py-1 focus:outline-none focus:border-blue-500 
                                           placeholder:text-slate-500"
                            />
                        </div>
                    </>
                ) : isPanel ? (
                    /* Panel Properties - simpler, no Id/C_Address */
                    <>
                        {/* Type - Read only */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {selectedDevice.deviceType}
                            </span>
                        </div>

                        {/* Label - Editable string, max 20 chars */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Label</span>
                            <input
                                type="text"
                                maxLength={20}
                                value={selectedDevice.label}
                                onChange={handleLabelChange}
                                placeholder="Enter label..."
                                className="w-32 text-xs text-slate-200 bg-slate-700 border border-slate-600 
                                           rounded px-2 py-1 focus:outline-none focus:border-blue-500 
                                           placeholder:text-slate-500"
                            />
                        </div>

                        {/* Character count for label */}
                        <div className="flex justify-end">
                            <span className="text-[10px] text-slate-500">
                                {selectedDevice.label.length}/20 characters
                            </span>
                        </div>
                    </>
                ) : (
                    /* AG Socket / Other Device Properties */
                    <>
                        {/* Type - Read only */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {selectedDevice.deviceType}
                            </span>
                        </div>

                        {/* SN - Read only */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">SN</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {formatSN(selectedDevice.sn)}
                            </span>
                        </div>

                        {/* Id - Read only, assigned when loop powers on */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Id</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.deviceId !== null ? selectedDevice.deviceId : '—'}
                            </span>
                        </div>

                        {/* C_Address - Read only, assigned when loop powers on */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">C_Address</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.cAddress !== null ? selectedDevice.cAddress : '—'}
                            </span>
                        </div>

                        {/* Label - Editable string, max 20 chars */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Label</span>
                            <input
                                type="text"
                                maxLength={20}
                                value={selectedDevice.label}
                                onChange={handleLabelChange}
                                placeholder="Enter label..."
                                className="w-32 text-xs text-slate-200 bg-slate-700 border border-slate-600 
                                           rounded px-2 py-1 focus:outline-none focus:border-blue-500 
                                           placeholder:text-slate-500"
                            />
                        </div>

                        {/* Character count for label */}
                        <div className="flex justify-end">
                            <span className="text-[10px] text-slate-500">
                                {selectedDevice.label.length}/20 characters
                            </span>
                        </div>
                    </>
                )}

                {/* Delete Device Button - shown for all devices */}
                <div className="pt-3 border-t border-slate-700 mt-3">
                    <button
                        onClick={() => onDeleteDevice?.(selectedDevice.instanceId)}
                        className="w-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold 
                                   py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Device
                    </button>
                    <p className="text-[10px] text-slate-500 text-center mt-1">
                        or press Delete key
                    </p>
                </div>
            </div>
        </div>
    );
}
