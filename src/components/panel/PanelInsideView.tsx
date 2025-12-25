// Panel Inside View - Shows the internal enclosure with DIN rail mounted modules
import PanelModule, { EmptyModuleSlot, MODULE_HEIGHT } from './PanelModule';
import type { PlacedDevice, Connection } from '../../types/devices';

interface PanelInsideViewProps {
    placedDevices: PlacedDevice[];
    connections: Connection[];
    isPoweredOn: boolean;
    selectedDeviceId?: string | null;
    onSelectDevice?: (deviceId: string) => void;
}

// Enclosure dimensions - match front panel size
const DIN_RAIL_HEIGHT = 20;    // Wide DIN rail
const MODULE_SPACING = 20;

export default function PanelInsideView({
    placedDevices,
    connections,
    isPoweredOn,
    selectedDeviceId,
    onSelectDevice
}: PanelInsideViewProps) {
    // Find controller (panel) and check if it's connected
    const panelDevice = placedDevices.find(d => d.typeId === 'panel');

    // Find loop drivers
    const loopDrivers = placedDevices.filter(d => d.typeId === 'loop-driver');

    // Check if loop driver is connected to panel
    const isLoopDriverConnected = (loopDriverId: string) => {
        if (!panelDevice) return false;
        return connections.some(conn =>
            (conn.fromDeviceId === panelDevice.instanceId && conn.toDeviceId === loopDriverId) ||
            (conn.toDeviceId === panelDevice.instanceId && conn.fromDeviceId === loopDriverId)
        );
    };

    // Get module status based on power and connections
    const getModuleStatus = (deviceId: string, isController: boolean = false): 'online' | 'fault' | 'warning' | 'offline' => {
        if (!isPoweredOn) return 'offline';
        if (isController) return 'online';
        if (isLoopDriverConnected(deviceId)) return 'online';
        return 'warning';
    };

    // Max slots per rail
    const RAIL_MAX_SLOTS = 6;

    // Build Rail 1 modules (Controller + Loop Drivers)
    const rail1Modules: React.ReactNode[] = [];

    // Controller is always first on rail 1
    if (panelDevice) {
        rail1Modules.push(
            <PanelModule
                key="controller"
                type="controller"
                label="Controller"
                status={getModuleStatus(panelDevice.instanceId, true)}
                isSelected={selectedDeviceId === panelDevice.instanceId}
                onClick={() => onSelectDevice?.(panelDevice.instanceId)}
            />
        );
    }

    // Loop drivers on rail 1
    loopDrivers.forEach((ld, index) => {
        if (rail1Modules.length < RAIL_MAX_SLOTS) {
            rail1Modules.push(
                <PanelModule
                    key={ld.instanceId}
                    type="loop-driver"
                    label={ld.label || `Loop ${index + 1}`}
                    loopNumber={index + 1}
                    status={getModuleStatus(ld.instanceId)}
                    isSelected={selectedDeviceId === ld.instanceId}
                    onClick={() => onSelectDevice?.(ld.instanceId)}
                />
            );
        }
    });

    // Fill remaining slots on rail 1 with empty slots (max 2 empty slots shown)
    const rail1EmptySlots = Math.min(2, RAIL_MAX_SLOTS - rail1Modules.length);
    for (let i = 0; i < rail1EmptySlots; i++) {
        rail1Modules.push(<EmptyModuleSlot key={`empty-rail1-${i}`} />);
    }

    // Build Rail 2 modules (Power module only for now)
    const rail2Modules: React.ReactNode[] = [];

    // Power module (always present when panel exists)
    if (panelDevice) {
        rail2Modules.push(
            <PanelModule
                key="power"
                type="power"
                label="Power Supply"
                status={isPoweredOn ? 'online' : 'offline'}
            />
        );
    }

    // Fill remaining slots on rail 2 with empty slots (max 2 empty slots shown)
    const rail2EmptySlots = Math.min(2, RAIL_MAX_SLOTS - rail2Modules.length);
    for (let i = 0; i < rail2EmptySlots; i++) {
        rail2Modules.push(<EmptyModuleSlot key={`empty-rail2-${i}`} />);
    }

    return (
        // Match PanelFrame styling: bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl p-8
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl p-8">
            {/* Header - match front panel */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white tracking-wider">AutroSafe V</h2>
                <p className="text-slate-400 text-sm">Panel Enclosure (Inside View)</p>
            </div>

            {/* Enclosure interior */}
            <div className="bg-slate-950/90 rounded-xl p-6 shadow-inner border border-slate-800 min-h-[460px]">

                {/* DIN Rail 1 with modules */}
                <div className="relative mb-8">
                    {/* Wide DIN rail running through the CENTER of modules */}
                    <div
                        className="absolute left-0 right-0 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-400 rounded shadow-md z-0"
                        style={{
                            height: DIN_RAIL_HEIGHT,
                            top: MODULE_HEIGHT / 2 - DIN_RAIL_HEIGHT / 2
                        }}
                    >
                        {/* Rail profile - top edge */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-300" />
                        {/* Rail center groove */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] bg-slate-600" />
                        {/* Rail profile - bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-600" />
                    </div>

                    {/* Modules on Rail 1 */}
                    <div
                        className="relative flex z-10"
                        style={{ gap: MODULE_SPACING }}
                    >
                        {rail1Modules}
                    </div>
                </div>

                {/* Spacer for labels */}
                <div className="h-4" />

                {/* DIN Rail 2 with modules */}
                <div className="relative">
                    {/* Wide DIN rail running through the CENTER of modules */}
                    <div
                        className="absolute left-0 right-0 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-400 rounded shadow-md z-0"
                        style={{
                            height: DIN_RAIL_HEIGHT,
                            top: MODULE_HEIGHT / 2 - DIN_RAIL_HEIGHT / 2
                        }}
                    >
                        {/* Rail profile - top edge */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-300" />
                        {/* Rail center groove */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[4px] bg-slate-600" />
                        {/* Rail profile - bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-600" />
                    </div>

                    {/* Modules on Rail 2 */}
                    <div
                        className="relative flex z-10"
                        style={{ gap: MODULE_SPACING }}
                    >
                        {rail2Modules}
                    </div>
                </div>
            </div>

            {/* Battery compartment */}
            <div className="mt-6 flex gap-6 justify-center">
                {/* Battery 1 */}
                <div className="w-32 h-16 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center shadow-inner">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500 font-medium">BATTERY</span>
                        <span className="text-[10px] text-slate-600">12V 7Ah</span>
                    </div>
                </div>
                {/* Battery 2 */}
                <div className="w-32 h-16 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center shadow-inner">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500 font-medium">BATTERY</span>
                        <span className="text-[10px] text-slate-600">12V 7Ah</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
