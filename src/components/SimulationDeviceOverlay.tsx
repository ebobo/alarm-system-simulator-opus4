// Simulation Device Overlay - simplified device rendering without wires/connectors
import type { PlacedDevice, ViewportTransform } from '../types/devices';
import { getDeviceType } from '../types/devices';

interface SimulationDeviceOverlayProps {
    devices: PlacedDevice[];
    selectedDeviceId?: string | null;
    activatedDevices: Set<string>;
    activatedSounders: Set<string>;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
}

// Simple device rendered without terminals (for simulation mode)
function SimulationDevice({
    device,
    isSelected,
    isActivated,
    viewportTransform,
    onDeviceClick,
}: {
    device: PlacedDevice;
    isSelected: boolean;
    isActivated: boolean;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
}) {
    const deviceType = getDeviceType(device.typeId);
    if (!deviceType) return null;

    // Convert plan coordinates to screen coordinates
    const { scale, positionX, positionY } = viewportTransform;
    const screenX = device.x * scale + positionX;
    const screenY = device.y * scale + positionY;

    const sizeX = deviceType.width * scale;
    const sizeY = deviceType.height * scale;

    // Activation glow style
    const activationStyle = isActivated ? {
        filter: 'drop-shadow(0 0 8px #EF4444) drop-shadow(0 0 16px #EF4444)',
        animation: 'pulse 1s infinite',
    } : {};

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onDeviceClick?.(device.instanceId);
            }}
            style={{
                position: 'absolute',
                left: screenX - sizeX / 2,
                top: screenY - sizeY / 2,
                width: sizeX,
                height: sizeY,
                cursor: 'pointer',
                zIndex: isSelected ? 10 : 1,
                ...activationStyle,
            }}
            className="simulation-device"
        >
            <svg
                width={sizeX}
                height={sizeY}
                viewBox={`${-deviceType.width / 2} ${-deviceType.height / 2} ${deviceType.width} ${deviceType.height}`}
                style={{ overflow: 'visible' }}
            >
                {/* Render based on device type - NO TERMINALS */}
                {device.typeId === 'mcp' ? (
                    <>
                        {/* Selection ring for MCP */}
                        {isSelected && (
                            <rect
                                x={-deviceType.width / 2 - 4}
                                y={-deviceType.height / 2 - 4}
                                width={deviceType.width + 8}
                                height={deviceType.height + 8}
                                rx="4"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Activation glow ring */}
                        {isActivated && (
                            <rect
                                x={-deviceType.width / 2 - 6}
                                y={-deviceType.height / 2 - 6}
                                width={deviceType.width + 12}
                                height={deviceType.height + 12}
                                rx="6"
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="3"
                                className="animate-pulse"
                            />
                        )}

                        {/* MCP body - red square */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="3"
                            fill={isActivated ? "#B91C1C" : "#DC2626"}
                            stroke="#991B1B"
                            strokeWidth="2"
                        />

                        {/* Inner white square - break glass area */}
                        <rect
                            x={-deviceType.width / 2 + 5}
                            y={-deviceType.height / 2 + 5}
                            width={deviceType.width - 10}
                            height={deviceType.height - 10}
                            rx="2"
                            fill={isActivated ? "#FCA5A5" : "#FECACA"}
                            stroke="#B91C1C"
                            strokeWidth="1"
                        />

                        {/* Cross pattern */}
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#991B1B" strokeWidth="2" />
                        <line x1="0" y1="-8" x2="0" y2="8" stroke="#991B1B" strokeWidth="2" />

                        {/* Activated indicator */}
                        {isActivated && (
                            <circle r="6" fill="#EF4444" className="animate-ping" opacity="0.5" />
                        )}
                    </>
                ) : device.typeId === 'sounder' ? (
                    <>
                        {/* Selection ring for sounder */}
                        {isSelected && (
                            <circle
                                r="21"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Activation glow ring */}
                        {isActivated && (
                            <circle
                                r="24"
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="3"
                                className="animate-pulse"
                            />
                        )}

                        {/* Sounder body - orange circle */}
                        <circle r="19" fill={isActivated ? "#EA580C" : "#F97316"} stroke="#C2410C" strokeWidth="2" />

                        {/* Inner circle */}
                        <circle r="12" fill={isActivated ? "#FB923C" : "#FDBA74"} stroke="#EA580C" strokeWidth="1.5" />

                        {/* Sound wave arcs - animated when active */}
                        <path
                            d="M -5 -3 Q -8 0 -5 3"
                            fill="none"
                            stroke="#7C2D12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity={isActivated ? 1 : 0.7}
                        />
                        <path
                            d="M 5 -3 Q 8 0 5 3"
                            fill="none"
                            stroke="#7C2D12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            opacity={isActivated ? 1 : 0.7}
                        />

                        {/* Center dot */}
                        <circle r="4" fill={isActivated ? "#DC2626" : "#EA580C"} />

                        {/* Activated indicator */}
                        {isActivated && (
                            <circle r="6" fill="#EF4444" className="animate-ping" opacity="0.4" />
                        )}
                    </>
                ) : device.typeId === 'AG-socket' || (device.typeId === 'AG-head' && !device.mountedOnSocketId) ? (
                    <>
                        {/* Activation glow ring */}
                        {isActivated && (
                            <circle
                                r="26"
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="3"
                                className="animate-pulse"
                            />
                        )}

                        {/* Selection ring for circular device */}
                        {isSelected && (
                            <circle
                                r="22"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Device base - circles */}
                        <circle r="20" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
                        <circle r="13" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
                        <circle r="5" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                        <circle r="2" fill="#64748B" />

                        {/* Mounted detector head overlay (shown when socket has mounted detector) */}
                        {device.mountedDetectorId && (
                            <>
                                <circle r="12" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                                <circle r="8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
                                <circle r="3" fill={isActivated ? "#EF4444" : "#FEE2E2"} stroke="#F87171" strokeWidth="0.5" />
                                <circle r="1" fill={isActivated ? "#B91C1C" : "#EF4444"} />
                            </>
                        )}

                        {/* Activated indicator */}
                        {isActivated && (
                            <circle r="4" fill="#EF4444" className="animate-ping" opacity="0.6" />
                        )}
                    </>
                ) : null}
            </svg>
        </div>
    );
}

export default function SimulationDeviceOverlay({
    devices,
    selectedDeviceId,
    activatedDevices,
    activatedSounders,
    viewportTransform,
    onDeviceClick,
}: SimulationDeviceOverlayProps) {
    return (
        <div
            className="simulation-device-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            {/* CSS for pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse {
                    animation: pulse 1s ease-in-out infinite;
                }
                .animate-ping {
                    animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `}</style>

            {/* Devices - filter out loop-driver, panel, and mounted detectors */}
            {devices
                .filter(device => {
                    // Skip loop drivers and panels - they shouldn't be visible in simulation
                    if (device.typeId === 'loop-driver' || device.typeId === 'panel') {
                        return false;
                    }
                    // Skip mounted detectors - shown via socket overlay
                    if (device.mountedOnSocketId) {
                        return false;
                    }
                    // Defensive: skip devices with missing typeId or device type
                    if (!device.typeId || !getDeviceType(device.typeId)) {
                        return false;
                    }
                    return true;
                })
                .map((device) => {
                    const isSelected = device.instanceId === selectedDeviceId;
                    // For sounders, check activatedSounders; for detectors/MCPs, check activatedDevices
                    const isActivated = device.typeId === 'sounder'
                        ? activatedSounders.has(device.instanceId)
                        : activatedDevices.has(device.instanceId);

                    return (
                        <div key={device.instanceId} style={{ pointerEvents: 'auto' }}>
                            <SimulationDevice
                                device={device}
                                isSelected={isSelected}
                                isActivated={isActivated}
                                viewportTransform={viewportTransform}
                                onDeviceClick={onDeviceClick}
                            />
                        </div>
                    );
                })}
        </div>
    );
}
