import type { PlacedDevice, Connection, RoomInfo, AGHeadFeature } from '../types/devices';
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
    onRemoveDetector?: (detectorId: string, socketId: string) => void;
    allDevices?: PlacedDevice[];
    // Raise Loop button props
    connections?: Connection[];
    hasConfig?: boolean;
    onRaiseLoop?: () => void;
    // Simulation mode props
    isSimulationMode?: boolean;
    isDeviceActivated?: boolean;
    onActivate?: (deviceId: string) => void;
    onDeactivate?: (deviceId: string) => void;
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
    onDeleteDevice,
    onRemoveDetector,
    allDevices = [],
    connections = [],
    hasConfig = false,
    onRaiseLoop,
    isSimulationMode = false,
    isDeviceActivated = false,
    onActivate,
    onDeactivate
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
    const isAGHead = selectedDevice.typeId === 'AG-head';
    const isAGSocket = selectedDevice.typeId === 'AG-socket';
    const isMCP = selectedDevice.typeId === 'mcp';
    const isMountedDetector = isAGSocket && !!selectedDevice.mountedDetectorId; // This represents a complete AG Detector
    const isActivatable = isSimulationMode && (isAGSocket || isMCP);

    // Get the mounted head device if this is a socket with a detector
    const mountedHead = isMountedDetector && allDevices
        ? allDevices.find(d => d.instanceId === selectedDevice.mountedDetectorId)
        : null;

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

    // Feature toggle handlers for AG Head
    const handleFeatureToggle = (feature: AGHeadFeature) => {
        const currentFeatures = selectedDevice.features || [];
        const hasFeature = currentFeatures.includes(feature);

        let newFeatures: AGHeadFeature[];
        if (hasFeature) {
            // Remove feature
            newFeatures = currentFeatures.filter(f => f !== feature);
        } else {
            // Add feature
            newFeatures = [...currentFeatures, feature];
        }
        onUpdateDevice({ ...selectedDevice, features: newFeatures });
    };

    // Beacon is mutually exclusive (R or W, not both)
    const handleBeaconChange = (beacon: 'BeaconR' | 'BeaconW' | 'none') => {
        const currentFeatures = selectedDevice.features || [];
        // Remove any existing beacon selection
        let newFeatures: AGHeadFeature[] = currentFeatures.filter(f => f !== 'BeaconR' && f !== 'BeaconW');
        // Add new beacon if not 'none'
        if (beacon !== 'none') {
            newFeatures = [...newFeatures, beacon];
        }
        onUpdateDevice({ ...selectedDevice, features: newFeatures });
    };

    const currentFeatures = selectedDevice.features || [];
    const hasBeaconR = currentFeatures.includes('BeaconR');
    const hasBeaconW = currentFeatures.includes('BeaconW');
    const beaconValue: 'BeaconR' | 'BeaconW' | 'none' = hasBeaconR ? 'BeaconR' : hasBeaconW ? 'BeaconW' : 'none';

    return (
        <div className="border-t border-slate-700 bg-slate-800/50">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-700/50 bg-slate-700/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {isMountedDetector ? 'AG Detector Properties' : isAGHead ? 'AG Head Properties' : 'Device Properties'}
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

                        {/* Raise Loop Button */}
                        {(() => {
                            const panelDevice = allDevices.find(d => d.typeId === 'panel');
                            const isConnectedToPanel = panelDevice && connections.some(conn =>
                                (conn.fromDeviceId === panelDevice.instanceId && conn.toDeviceId === selectedDevice.instanceId) ||
                                (conn.toDeviceId === panelDevice.instanceId && conn.fromDeviceId === selectedDevice.instanceId)
                            );
                            const isEnabled = isConnectedToPanel && hasConfig;
                            const hintText = !hasConfig ? 'Load config first' :
                                !isConnectedToPanel ? 'Connect to Panel first' :
                                    'Discover loop devices';

                            return (
                                <div className="pt-3 border-t border-slate-700 mt-3">
                                    <button
                                        onClick={onRaiseLoop}
                                        disabled={!isEnabled}
                                        className={`w-full py-2 px-3 rounded text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-2
                                            ${isEnabled
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Raise Loop
                                    </button>
                                    <p className="text-[10px] text-slate-500 text-center mt-1">
                                        {hintText}
                                    </p>
                                </div>
                            );
                        })()}
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
                ) : isMountedDetector ? (
                    /* AG Detector (Socket + Head) Properties */
                    <>
                        {/* Type - AG-detector */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                AG-detector
                            </span>
                        </div>

                        {/* Socket SN */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Socket SN</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {formatSN(selectedDevice.sn)}
                            </span>
                        </div>

                        {/* Head SN */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Head SN</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {mountedHead ? formatSN(mountedHead.sn) : 'Unknown'}
                            </span>
                        </div>

                        {/* Id */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Id</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.deviceId !== null ? selectedDevice.deviceId : '—'}
                            </span>
                        </div>

                        {/* C_Address */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">C_Address</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded min-w-[60px] text-center">
                                {selectedDevice.cAddress !== null ? selectedDevice.cAddress : '—'}
                            </span>
                        </div>

                        {/* Label */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Label</span>
                            <input
                                type="text"
                                maxLength={20}
                                value={selectedDevice.label}
                                onChange={handleLabelChange}
                                className="w-32 text-xs text-slate-200 bg-slate-700 border border-slate-600 rounded px-2 py-1"
                            />
                        </div>

                        {/* Features (from mounted head) */}
                        {mountedHead && mountedHead.features && mountedHead.features.length > 0 && (
                            <div className="border-t border-slate-700 pt-2 mt-2">
                                <div className="text-xs text-slate-400 mb-1.5">Features</div>
                                <div className="flex flex-wrap gap-1">
                                    {mountedHead.features.map(feature => (
                                        <span
                                            key={feature}
                                            className="text-[10px] px-1.5 py-0.5 bg-blue-600/30 text-blue-300 rounded border border-blue-500/30"
                                        >
                                            {feature === 'BeaconR' ? 'Beacon R' : feature === 'BeaconW' ? 'Beacon W' : feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : isAGHead ? (
                    /* AG Head (Standalone) Properties */
                    <>
                        {/* Type */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Type</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                AG Head
                            </span>
                        </div>
                        {/* SN */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">SN</span>
                            <span className="text-xs text-slate-200 font-mono bg-slate-700/50 px-2 py-1 rounded">
                                {formatSN(selectedDevice.sn)}
                            </span>
                        </div>
                        {/* Label */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Label</span>
                            <input
                                type="text"
                                maxLength={20}
                                value={selectedDevice.label}
                                onChange={handleLabelChange}
                                placeholder="Enter label..."
                                className="w-32 text-xs text-slate-200 bg-slate-700 border border-slate-600 rounded px-2 py-1"
                            />
                        </div>

                        {/* Features Section */}
                        <div className="border-t border-slate-700 pt-3 mt-3">
                            <div className="text-xs text-slate-400 mb-2">Features</div>

                            {/* Checkboxes for Sounder, CO, Voice */}
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 rounded px-1 py-0.5">
                                    <input
                                        type="checkbox"
                                        checked={currentFeatures.includes('Sounder')}
                                        onChange={() => handleFeatureToggle('Sounder')}
                                        className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <span className="text-xs text-slate-200">Sounder</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 rounded px-1 py-0.5">
                                    <input
                                        type="checkbox"
                                        checked={currentFeatures.includes('CO')}
                                        onChange={() => handleFeatureToggle('CO')}
                                        className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <span className="text-xs text-slate-200">CO</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-700/30 rounded px-1 py-0.5">
                                    <input
                                        type="checkbox"
                                        checked={currentFeatures.includes('Voice')}
                                        onChange={() => handleFeatureToggle('Voice')}
                                        className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                    />
                                    <span className="text-xs text-slate-200">Voice</span>
                                </label>
                            </div>

                            {/* Beacon Radio Buttons (mutually exclusive) */}
                            <div className="mt-3 pt-2 border-t border-slate-700/50">
                                <div className="text-xs text-slate-400 mb-1.5">Beacon</div>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="beacon"
                                            checked={beaconValue === 'none'}
                                            onChange={() => handleBeaconChange('none')}
                                            className="w-3 h-3 border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="text-xs text-slate-300">None</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="beacon"
                                            checked={beaconValue === 'BeaconR'}
                                            onChange={() => handleBeaconChange('BeaconR')}
                                            className="w-3 h-3 border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="text-xs text-slate-300">R</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="beacon"
                                            checked={beaconValue === 'BeaconW'}
                                            onChange={() => handleBeaconChange('BeaconW')}
                                            className="w-3 h-3 border-slate-500 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                                        />
                                        <span className="text-xs text-slate-300">W</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="text-[10px] text-slate-500 italic text-center mt-2">
                            Place on AG Socket to mount
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

                {/* Action Button - Remove Detector for mounted detectors (Socket View), Delete for others */}
                {/* Hidden in simulation mode */}
                {!isSimulationMode && (
                    <div className="pt-3 border-t border-slate-700 mt-3">
                        {isMountedDetector ? (
                            <button
                                onClick={() => onRemoveDetector?.(selectedDevice.mountedDetectorId!, selectedDevice.instanceId)}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold 
                                       py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Remove Head
                            </button>
                        ) : (
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
                        )}
                        <p className="text-[10px] text-slate-500 text-center mt-1">
                            {isMountedDetector ? 'Detector will be placed next to socket' : 'or press Delete key'}
                        </p>
                    </div>
                )}

                {/* Simulation Mode Activation Button */}
                {isActivatable && (
                    <div className="pt-3 border-t border-slate-700 mt-3">
                        <button
                            onClick={() => isDeviceActivated
                                ? onDeactivate?.(selectedDevice.instanceId)
                                : onActivate?.(selectedDevice.instanceId)
                            }
                            className={`w-full py-2.5 px-3 rounded text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                                ${isDeviceActivated
                                    ? 'bg-green-600 hover:bg-green-500 text-white'
                                    : 'bg-red-600 hover:bg-red-500 text-white animate-pulse'}`}
                        >
                            {isDeviceActivated ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Deactivate Alarm
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m2.828-9.9a9 9 0 0112.728 0" />
                                    </svg>
                                    Activate Fire Alarm
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-slate-500 text-center mt-1">
                            {isDeviceActivated ? 'Click to stop the alarm' : (isMCP ? 'Simulate breaking the glass' : 'Simulate smoke/heat detection')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
