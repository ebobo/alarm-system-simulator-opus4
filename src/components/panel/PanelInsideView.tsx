// Panel Inside View - Shows the internal enclosure with DIN rail mounted modules
import PanelModule, { EmptyModuleSlot, MODULE_WIDTH, MODULE_HEIGHT } from './PanelModule';
import type { PlacedDevice, Connection } from '../../types/devices';

interface PanelInsideViewProps {
    placedDevices: PlacedDevice[];
    connections: Connection[];
    isPoweredOn: boolean;
    selectedDeviceId?: string | null;
    onSelectDevice?: (deviceId: string) => void;
}

// Enclosure dimensions - match front panel size (max-w-3xl ≈ 600px usable)
const ENCLOSURE_WIDTH = 600;
const ENCLOSURE_HEIGHT = 580;
const DIN_RAIL_HEIGHT = 10;
const MODULE_SPACING = 16;

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

    // Calculate modules per rail based on width
    const usableWidth = ENCLOSURE_WIDTH - 48; // padding
    const modulesPerRail = Math.floor(usableWidth / (MODULE_WIDTH + MODULE_SPACING));
    const RAIL_1_MAX_SLOTS = Math.min(modulesPerRail, 6);
    const RAIL_2_MAX_SLOTS = Math.min(modulesPerRail, 6);

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
        if (rail1Modules.length < RAIL_1_MAX_SLOTS) {
            rail1Modules.push(
                <PanelModule
                    key={ld.instanceId}
                    type="loop-driver"
                    label={ld.label || `Loop Driver ${index + 1}`}
                    loopNumber={index + 1}
                    status={getModuleStatus(ld.instanceId)}
                    isSelected={selectedDeviceId === ld.instanceId}
                    onClick={() => onSelectDevice?.(ld.instanceId)}
                />
            );
        }
    });

    // Fill remaining slots on rail 1 with empty slots (max 2 empty slots shown)
    const rail1EmptySlots = Math.min(2, RAIL_1_MAX_SLOTS - rail1Modules.length);
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
    const rail2EmptySlots = Math.min(2, RAIL_2_MAX_SLOTS - rail2Modules.length);
    for (let i = 0; i < rail2EmptySlots; i++) {
        rail2Modules.push(<EmptyModuleSlot key={`empty-rail2-${i}`} />);
    }

    // Calculate vertical positions for rails
    const rail1Y = 50;
    const rail2Y = rail1Y + MODULE_HEIGHT + 40;

    return (
        <div
            className="relative bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-xl border-4 border-slate-600 shadow-2xl overflow-hidden"
            style={{ width: ENCLOSURE_WIDTH, height: ENCLOSURE_HEIGHT }}
        >
            {/* Inner enclosure shadow effect */}
            <div className="absolute inset-3 bg-slate-950/80 rounded-lg shadow-inner border border-slate-800" />

            {/* Title */}
            <div className="absolute top-4 left-0 right-0 text-center z-10">
                <span className="text-sm text-slate-400 font-medium tracking-wide">PANEL ENCLOSURE</span>
            </div>

            {/* DIN Rail 1 with modules */}
            <div className="absolute left-6 right-6" style={{ top: rail1Y }}>
                {/* Rail background */}
                <div
                    className="absolute left-0 right-0 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded shadow-md z-0"
                    style={{ height: DIN_RAIL_HEIGHT, top: MODULE_HEIGHT - DIN_RAIL_HEIGHT - 4 }}
                >
                    {/* Rail profile lines */}
                    <div className="absolute top-1 left-0 right-0 h-[2px] bg-slate-200/50" />
                    <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-600/50" />
                </div>

                {/* Modules on Rail 1 */}
                <div
                    className="relative flex z-10"
                    style={{ gap: MODULE_SPACING }}
                >
                    {rail1Modules}
                </div>
            </div>

            {/* DIN Rail 2 with modules */}
            <div className="absolute left-6 right-6" style={{ top: rail2Y }}>
                {/* Rail background */}
                <div
                    className="absolute left-0 right-0 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 rounded shadow-md z-0"
                    style={{ height: DIN_RAIL_HEIGHT, top: MODULE_HEIGHT - DIN_RAIL_HEIGHT - 4 }}
                >
                    {/* Rail profile lines */}
                    <div className="absolute top-1 left-0 right-0 h-[2px] bg-slate-200/50" />
                    <div className="absolute bottom-1 left-0 right-0 h-[2px] bg-slate-600/50" />
                </div>

                {/* Modules on Rail 2 */}
                <div
                    className="relative flex z-10"
                    style={{ gap: MODULE_SPACING }}
                >
                    {rail2Modules}
                </div>
            </div>

            {/* Battery compartment */}
            <div className="absolute bottom-6 left-6 right-6 flex gap-4 justify-center z-10">
                {/* Battery 1 */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-28 h-14 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center shadow-inner">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 font-medium">BATTERY</span>
                            <span className="text-[8px] text-slate-600">12V 7Ah</span>
                        </div>
                    </div>
                </div>
                {/* Battery 2 */}
                <div className="flex flex-col items-center gap-1">
                    <div className="w-28 h-14 bg-slate-950 rounded-lg border border-slate-700 flex items-center justify-center shadow-inner">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-500 font-medium">BATTERY</span>
                            <span className="text-[8px] text-slate-600">12V 7Ah</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
