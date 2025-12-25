// Panel Inside View - Shows the internal enclosure with DIN rail mounted modules
import PanelModule, { EmptyModuleSlot, MODULE_HEIGHT } from './PanelModule';
import PanelBattery from './PanelBattery';
import type { PlacedDevice, Connection } from '../../types/devices';

interface PanelInsideViewProps {
    placedDevices: PlacedDevice[];
    connections: Connection[];
    isPoweredOn: boolean;
    selectedDeviceId?: string | null;
    onSelectDevice?: (deviceId: string) => void;
}

// Enclosure dimensions - Wider to match front panel proportions
const DIN_RAIL_HEIGHT = 80;    // Wide DIN rail (approx half module height 200px)
const MODULE_SPACING = 10;     // Reduced spacing to 10px

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

    // Max slots per rail - increased due to wider enclosure
    const RAIL_MAX_SLOTS = 8;

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

    // Fill remaining slots on rail 1 with empty slots (max 3 empty slots shown for better fill)
    const rail1EmptySlots = Math.min(3, RAIL_MAX_SLOTS - rail1Modules.length);
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

    // Fill remaining slots on rail 2 with empty slots
    const rail2EmptySlots = Math.min(3, RAIL_MAX_SLOTS - rail2Modules.length);
    for (let i = 0; i < rail2EmptySlots; i++) {
        rail2Modules.push(<EmptyModuleSlot key={`empty-rail2-${i}`} />);
    }

    return (
        // Match PanelFrame styling but wider (max-w-4xl) to match front panel visuals
        <div className="w-full max-w-4xl bg-gradient-to-b from-slate-700 to-slate-800 rounded-2xl border-4 border-slate-600 shadow-2xl p-[22px]">

            {/* Enclosure interior */}
            <div className="bg-slate-950/90 rounded-xl p-8 shadow-inner border border-slate-800 min-h-[520px] flex flex-col items-center">

                {/* DIN Rail 1 Area */}
                <div className="relative w-full flex justify-center mb-10">
                    {/* Wide DIN rail running through the CENTER of modules */}
                    <div
                        className="absolute left-4 right-4 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-400 rounded shadow-md z-0"
                        style={{
                            height: DIN_RAIL_HEIGHT,
                            top: MODULE_HEIGHT / 2 - DIN_RAIL_HEIGHT / 2
                        }}
                    >
                        {/* Rail profile details */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-300 shadow-sm" />
                        <div className="absolute top-[3px] left-0 right-0 h-[1px] bg-slate-600/30" />
                        {/* Middle groove removed per user request */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-600 shadow-sm" />
                    </div>

                    {/* Modules on Rail 1 */}
                    <div
                        className="relative flex z-10 px-8"
                        style={{ gap: MODULE_SPACING }}
                    >
                        {rail1Modules}
                    </div>
                </div>

                {/* DIN Rail 2 Area */}
                <div className="relative w-full flex justify-center mb-auto">
                    {/* Wide DIN rail */}
                    <div
                        className="absolute left-4 right-4 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-400 rounded shadow-md z-0"
                        style={{
                            height: DIN_RAIL_HEIGHT,
                            top: MODULE_HEIGHT / 2 - DIN_RAIL_HEIGHT / 2
                        }}
                    >
                        {/* Rail profile details */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-slate-300 shadow-sm" />
                        <div className="absolute top-[3px] left-0 right-0 h-[1px] bg-slate-600/30" />
                        {/* Middle groove removed per user request */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-600 shadow-sm" />
                    </div>

                    {/* Modules on Rail 2 */}
                    <div
                        className="relative flex z-10 px-8"
                        style={{ gap: MODULE_SPACING }}
                    >
                        {rail2Modules}
                    </div>
                </div>

                {/* Battery compartment */}
                <div className="w-full mt-10 pt-6 border-t border-slate-800/50 flex gap-12 justify-center relative">
                    {/* Battery shelf visual */}
                    <div className="absolute inset-x-4 top-0 h-[2px] bg-slate-800 shadow" />

                    <PanelBattery label="Battery 1" />
                    <PanelBattery label="Battery 2" />
                </div>
            </div>
        </div>
    );
}
