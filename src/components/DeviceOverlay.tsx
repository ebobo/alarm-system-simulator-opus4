import { useDraggable } from '@dnd-kit/core';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire } from '../types/devices';
import { getDeviceType } from '../types/devices';

interface DeviceOverlayProps {
    devices: PlacedDevice[];
    selectedDeviceId?: string | null;
    selectedWireId?: string | null;
    activeDragId?: string | null;
    projectionPosition?: { x: number; y: number } | null;
    projectionDeviceTypeId?: string | null;
    snapToSocketId?: string | null;  // Socket being snapped to during detector drag
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
    onWireClick?: (wireId: string) => void;
    connections?: Connection[];
    drawingWire?: DrawingWire | null;
    onWireStart?: (deviceId: string, terminalId: string, e: React.PointerEvent) => void;
    onWireEnd?: (deviceId: string, terminalId: string) => void;
    dragDelta?: { x: number; y: number } | null;
    alignmentGuides?: { horizontal: number | null; vertical: number | null };
}

// Draggable device rendered as HTML element
function DraggableDevice({
    device,
    isSelected,
    isDragging,
    isSnapTarget = false,
    viewportTransform,
    onDeviceClick,
    onWireStart,
    onWireEnd,
}: {
    device: PlacedDevice;
    isSelected: boolean;
    isDragging: boolean;
    isSnapTarget?: boolean;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
    onWireStart?: (deviceId: string, terminalId: string, e: React.PointerEvent) => void;
    onWireEnd?: (deviceId: string, terminalId: string) => void;
}) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: `placed-${device.instanceId}`,
        data: {
            type: 'placed-device',
            instanceId: device.instanceId,
            deviceTypeId: device.typeId,
        },
    });

    const deviceType = getDeviceType(device.typeId);
    if (!deviceType) return null;

    // Convert plan coordinates to screen coordinates
    const { scale, positionX, positionY } = viewportTransform;
    const screenX = device.x * scale + positionX;
    const screenY = device.y * scale + positionY;

    // Apply drag offset
    const dragOffsetX = transform?.x ?? 0;
    const dragOffsetY = transform?.y ?? 0;

    const sizeX = deviceType.width * scale;
    const sizeY = deviceType.height * scale;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                e.stopPropagation();
                onDeviceClick?.(device.instanceId);
            }}
            style={{
                position: 'absolute',
                left: screenX - sizeX / 2 + dragOffsetX,
                top: screenY - sizeY / 2 + dragOffsetY,
                width: sizeX,
                height: sizeY,
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                zIndex: isSelected ? 10 : 1,
            }}
            className="device-container"
        >
            {/* Device SVG */}
            <svg
                width={sizeX}
                height={sizeY}
                viewBox={`${-deviceType.width / 2} ${-deviceType.height / 2} ${deviceType.width} ${deviceType.height}`}
                style={{ overflow: 'visible' }}
            >
                {/* Render based on device type */}
                {device.typeId === 'loop-driver' ? (
                    <>
                        {/* Selection ring for rectangular device */}
                        {isSelected && (
                            <rect
                                x={-deviceType.width / 2 - 4}
                                y={-deviceType.height / 2 - 4}
                                width={deviceType.width + 8}
                                height={deviceType.height + 8}
                                rx="6"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Loop Driver body - outer rectangle */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="4"
                            fill="#F8FAFC"
                            stroke="#1E293B"
                            strokeWidth="2"
                        />

                        {/* Inner rectangle */}
                        <rect
                            x={-deviceType.width / 2 + 8}
                            y={-deviceType.height / 2 + 8}
                            width={deviceType.width - 16}
                            height={deviceType.height - 16}
                            rx="3"
                            fill="#E2E8F0"
                            stroke="#64748B"
                            strokeWidth="1.5"
                        />

                        {/* LD Label */}
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fontSize="14"
                            fontWeight="bold"
                            fill="#334155"
                            style={{ pointerEvents: 'none' }}
                        >
                            LD
                        </text>
                    </>
                ) : device.typeId === 'mcp' ? (
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

                        {/* MCP body - red square */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="3"
                            fill="#DC2626"
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
                            fill="#FECACA"
                            stroke="#B91C1C"
                            strokeWidth="1"
                        />

                        {/* Cross pattern */}
                        <line x1="-8" y1="0" x2="8" y2="0" stroke="#991B1B" strokeWidth="2" />
                        <line x1="0" y1="-8" x2="0" y2="8" stroke="#991B1B" strokeWidth="2" />
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

                        {/* Sounder body - orange circle */}
                        <circle r="19" fill="#F97316" stroke="#C2410C" strokeWidth="2" />

                        {/* Inner circle */}
                        <circle r="12" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.5" />

                        {/* Sound wave arcs */}
                        <path
                            d="M -5 -3 Q -8 0 -5 3"
                            fill="none"
                            stroke="#7C2D12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M 5 -3 Q 8 0 5 3"
                            fill="none"
                            stroke="#7C2D12"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />

                        {/* Center dot */}
                        <circle r="4" fill="#EA580C" />
                    </>
                ) : device.typeId === 'panel' ? (
                    <>
                        {/* Selection ring for Panel */}
                        {isSelected && (
                            <rect
                                x={-deviceType.width / 2 - 4}
                                y={-deviceType.height / 2 - 4}
                                width={deviceType.width + 8}
                                height={deviceType.height + 8}
                                rx="6"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Panel body - white outer rectangle */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="4"
                            fill="#F8FAFC"
                            stroke="#1E293B"
                            strokeWidth="2"
                        />

                        {/* Inner rectangle */}
                        <rect
                            x={-deviceType.width / 2 + 8}
                            y={-deviceType.height / 2 + 8}
                            width={deviceType.width - 16}
                            height={deviceType.height - 16}
                            rx="3"
                            fill="#E2E8F0"
                            stroke="#64748B"
                            strokeWidth="1.5"
                        />

                        {/* P Label */}
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fontSize="14"
                            fontWeight="bold"
                            fill="#0891B2"
                            style={{ pointerEvents: 'none' }}
                        >
                            P
                        </text>
                    </>
                ) : device.typeId === 'input-unit' ? (
                    <>
                        {/* Selection ring for Input Unit */}
                        {isSelected && (
                            <rect
                                x={-deviceType.width / 2 - 4}
                                y={-deviceType.height / 2 - 4}
                                width={deviceType.width + 8}
                                height={deviceType.height + 8}
                                rx="6"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Input Unit body - beige/cream color like the hardware */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="4"
                            fill="#E8E4DA"
                            stroke="#1E293B"
                            strokeWidth="2"
                        />

                        {/* Inner rectangle - label area */}
                        <rect
                            x={-deviceType.width / 2 + 6}
                            y={-deviceType.height / 2 + 6}
                            width={deviceType.width - 12}
                            height={deviceType.height - 12}
                            rx="3"
                            fill="#D4D0C6"
                            stroke="#64748B"
                            strokeWidth="1.5"
                        />

                        {/* IN Label */}
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="#334155"
                            style={{ pointerEvents: 'none' }}
                        >
                            IN
                        </text>

                        {/* Terminals - 4 sides */}
                        <circle cx="0" cy={-deviceType.height / 2 + 2} r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx={deviceType.width / 2 - 2} cy="0" r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx="0" cy={deviceType.height / 2 - 2} r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx={-deviceType.width / 2 + 2} cy="0" r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                    </>
                ) : device.typeId === 'output-unit' ? (
                    <>
                        {/* Selection ring for Output Unit */}
                        {isSelected && (
                            <rect
                                x={-deviceType.width / 2 - 4}
                                y={-deviceType.height / 2 - 4}
                                width={deviceType.width + 8}
                                height={deviceType.height + 8}
                                rx="6"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* Output Unit body - beige/cream color like the hardware */}
                        <rect
                            x={-deviceType.width / 2}
                            y={-deviceType.height / 2}
                            width={deviceType.width}
                            height={deviceType.height}
                            rx="4"
                            fill="#E8E4DA"
                            stroke="#1E293B"
                            strokeWidth="2"
                        />

                        {/* Inner rectangle - label area */}
                        <rect
                            x={-deviceType.width / 2 + 6}
                            y={-deviceType.height / 2 + 6}
                            width={deviceType.width - 12}
                            height={deviceType.height - 12}
                            rx="3"
                            fill="#D4D0C6"
                            stroke="#64748B"
                            strokeWidth="1.5"
                        />

                        {/* OUT Label */}
                        <text
                            x="0"
                            y="4"
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            fill="#334155"
                            style={{ pointerEvents: 'none' }}
                        >
                            OUT
                        </text>

                        {/* Terminals - 4 sides */}
                        <circle cx="0" cy={-deviceType.height / 2 + 2} r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx={deviceType.width / 2 - 2} cy="0" r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx="0" cy={deviceType.height / 2 - 2} r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                        <circle cx={-deviceType.width / 2 + 2} cy="0" r="3" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                    </>
                ) : device.typeId === 'AG-head' ? (
                    <>
                        {/* Selection ring for AG Head */}
                        {isSelected && (
                            <circle
                                r="17"
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="2"
                                strokeDasharray="4 2"
                            />
                        )}

                        {/* AG Head body - white dome */}
                        <circle r="15" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />

                        {/* Inner ring */}
                        <circle r="10" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

                        {/* Center indicator - red LED */}
                        <circle r="4" fill="#FEE2E2" stroke="#F87171" strokeWidth="1" />
                        <circle r="1.5" fill="#EF4444" />
                    </>
                ) : (
                    <>
                        {/* Snap target glow ring (shown when detector is being dragged near this socket) */}
                        {isSnapTarget && !device.mountedDetectorId && (
                            <circle
                                r="26"
                                fill="none"
                                stroke="#22C55E"
                                strokeWidth="3"
                                className="animate-pulse"
                                opacity="0.8"
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
                                <circle r="3" fill="#FEE2E2" stroke="#F87171" strokeWidth="0.5" />
                                <circle r="1" fill="#EF4444" />
                            </>
                        )}
                    </>
                )}

                {/* Terminals - only show if not mounted */}
                {!device.mountedDetectorId && deviceType.terminals.map((terminal) => {
                    const svgtX = terminal.relativeX * deviceType.width;
                    const svgtY = terminal.relativeY * deviceType.height;

                    // Check if terminals should be disabled (e.g. socket has mounted detector)
                    const isDisabled = !!device.mountedDetectorId;

                    // Get terminal color based on terminal type for loop driver
                    const getTerminalColor = () => {
                        if (isDisabled) {
                            return { fill: '#94A3B8', stroke: '#64748B' }; // Gray for disabled
                        }
                        if (device.typeId === 'loop-driver') {
                            if (terminal.id.startsWith('loop-in')) {
                                return { fill: '#F97316', stroke: '#C2410C' }; // Orange for loop in
                            } else if (terminal.id.startsWith('loop-out')) {
                                return { fill: '#38BDF8', stroke: '#0284C7' }; // Light blue for loop out
                            } else if (terminal.id === 'controller') {
                                return { fill: '#3B82F6', stroke: '#1D4ED8' }; // Dark blue for controller
                            }
                        }
                        if (device.typeId === 'panel') {
                            return { fill: '#22D3EE', stroke: '#0891B2' }; // Cyan for panel
                        }
                        return { fill: '#FBBF24', stroke: '#B45309' }; // Yellow default
                    };

                    const colors = getTerminalColor();

                    return (
                        <g key={terminal.id} transform={`translate(${svgtX}, ${svgtY})`}>
                            {/* Hit area - only interactive if not disabled */}
                            {!isDisabled && (
                                <circle
                                    r="8"
                                    fill="transparent"
                                    style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                                    onPointerDown={(e) => {
                                        e.stopPropagation();
                                        onWireStart?.(device.instanceId, terminal.id, e);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onPointerUp={(e) => {
                                        e.stopPropagation();
                                        onWireEnd?.(device.instanceId, terminal.id);
                                    }}
                                />
                            )}
                            {/* Visible terminal */}
                            <circle r="5" fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// Projection guide (rendered in SVG inside the transform)
function ProjectionGuide({
    x,
    y,
    viewportTransform,
    deviceTypeId,
}: {
    x: number;
    y: number;
    viewportTransform: ViewportTransform;
    deviceTypeId?: string;
}) {
    const { scale, positionX, positionY } = viewportTransform;
    const screenX = x * scale + positionX;
    const screenY = y * scale + positionY;

    // Different sizes for different device types
    const isLoopDriver = deviceTypeId === 'loop-driver';
    const isPanel = deviceTypeId === 'panel';
    const isMcp = deviceTypeId === 'mcp';
    const isSounder = deviceTypeId === 'sounder';
    const isAGHead = deviceTypeId === 'AG-head';
    const isInputUnit = deviceTypeId === 'input-unit';
    const isOutputUnit = deviceTypeId === 'output-unit';
    const isIOUnit = isInputUnit || isOutputUnit;
    const sizeX = isLoopDriver ? 50 * scale : isPanel ? 35 * scale : isMcp ? 35 * scale : isSounder ? 38 * scale : isAGHead ? 30 * scale : isIOUnit ? 36 * scale : 48 * scale;
    const sizeY = isLoopDriver ? 30 * scale : isPanel ? 25 * scale : isMcp ? 35 * scale : isSounder ? 38 * scale : isAGHead ? 30 * scale : isIOUnit ? 36 * scale : 48 * scale;

    return (
        <div
            style={{
                position: 'absolute',
                left: screenX - sizeX / 2,
                top: screenY - sizeY / 2,
                width: sizeX,
                height: sizeY,
                pointerEvents: 'none',
            }}
        >
            {isLoopDriver ? (
                // Rectangular projection for loop driver
                <svg width={sizeX} height={sizeY} viewBox="-25 -15 50 30">
                    <rect
                        x="-22"
                        y="-13"
                        width="44"
                        height="26"
                        rx="4"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <rect x="-20" y="-11" width="40" height="22" rx="3" fill="#3B82F6" opacity="0.15" />
                    <line x1="-15" y1="0" x2="15" y2="0" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                    <circle r="3" fill="#3B82F6" opacity="0.8" />
                </svg>
            ) : isPanel ? (
                // Smaller rectangular projection for panel
                <svg width={sizeX} height={sizeY} viewBox="-17.5 -12.5 35 25">
                    <rect
                        x="-15"
                        y="-10"
                        width="30"
                        height="20"
                        rx="3"
                        fill="none"
                        stroke="#22D3EE"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <rect x="-13" y="-8" width="26" height="16" rx="2" fill="#22D3EE" opacity="0.15" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-6" x2="0" y2="6" stroke="#22D3EE" strokeWidth="1" opacity="0.5" />
                    <circle r="2" fill="#22D3EE" opacity="0.8" />
                </svg>
            ) : isMcp ? (
                // Square projection for MCP
                <svg width={sizeX} height={sizeY} viewBox="-17.5 -17.5 35 35">
                    <rect
                        x="-15"
                        y="-15"
                        width="30"
                        height="30"
                        rx="3"
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <rect x="-13" y="-13" width="26" height="26" rx="2" fill="#DC2626" opacity="0.15" />
                    <line x1="-8" y1="0" x2="8" y2="0" stroke="#DC2626" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-8" x2="0" y2="8" stroke="#DC2626" strokeWidth="1" opacity="0.5" />
                    <circle r="2" fill="#DC2626" opacity="0.8" />
                </svg>
            ) : isSounder ? (
                // Circular projection for sounder (orange)
                <svg width={sizeX} height={sizeY} viewBox="-19 -19 38 38">
                    <circle
                        r="17"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <circle r="15" fill="#F97316" opacity="0.15" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#F97316" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#F97316" strokeWidth="1" opacity="0.5" />
                    <circle r="3" fill="#F97316" opacity="0.8" />
                </svg>
            ) : isIOUnit ? (
                // Square projection for IO Units (green)
                <svg width={sizeX} height={sizeY} viewBox="-18 -18 36 36">
                    <rect
                        x="-16"
                        y="-16"
                        width="32"
                        height="32"
                        rx="4"
                        fill="none"
                        stroke="#22C55E"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <rect x="-14" y="-14" width="28" height="28" rx="3" fill="#22C55E" opacity="0.15" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#22C55E" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#22C55E" strokeWidth="1" opacity="0.5" />
                    <circle cx="0" cy="-16" r="2" fill="#22C55E" opacity="0.8" />
                    <circle cx="16" cy="0" r="2" fill="#22C55E" opacity="0.8" />
                    <circle cx="0" cy="16" r="2" fill="#22C55E" opacity="0.8" />
                    <circle cx="-16" cy="0" r="2" fill="#22C55E" opacity="0.8" />
                </svg>
            ) : isAGHead ? (
                // Circular projection for AG Detector (white/gray)
                <svg width={sizeX} height={sizeY} viewBox="-15 -15 30 30">
                    <circle
                        r="13"
                        fill="none"
                        stroke="#64748B"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <circle r="11" fill="#F8FAFC" opacity="0.5" />
                    <circle r="7" fill="#E2E8F0" opacity="0.6" />
                    <circle r="2" fill="#EF4444" opacity="0.8" />
                </svg>
            ) : (
                // Circular projection for detectors
                <svg width={sizeX} height={sizeY} viewBox="-24 -24 48 48">
                    <circle
                        r="22"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                        opacity="0.7"
                    />
                    <circle r="20" fill="#3B82F6" opacity="0.15" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                    <circle r="3" fill="#3B82F6" opacity="0.8" />
                </svg>
            )}
        </div>
    );
}

/**
 * Overlay that renders devices as HTML elements positioned using viewport transform.
 * This allows devices to be properly draggable without interfering with pan/zoom.
 */
// Connection Rendering Helper
function Wire({
    id,
    startX, startY, endX, endY,
    isPreview = false,
    isSelected = false,
    isPowered = false,
    onClick,
}: {
    id?: string;
    startX: number; startY: number; endX: number; endY: number;
    isPreview?: boolean;
    isSelected?: boolean;
    isPowered?: boolean;
    onClick?: (id: string) => void;
}) {
    // Determine wire color based on state: selected > powered > default
    const getWireColor = () => {
        if (isPreview) return "#3B82F6"; // Blue for preview
        if (isSelected) return "#60A5FA"; // Light blue for selected
        if (isPowered) return "#F97316"; // Orange for powered
        return "#6B7280"; // Gray for default
    };

    const handleClick = (e: React.MouseEvent) => {
        if (id && onClick) {
            e.stopPropagation();
            onClick(id);
        }
    };

    return (
        <g>
            {/* Invisible wider line for easier clicking */}
            {!isPreview && (
                <line
                    x1={startX} y1={startY}
                    x2={endX} y2={endY}
                    stroke="transparent"
                    strokeWidth="12"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={handleClick}
                />
            )}
            {/* Visible wire */}
            <line
                x1={startX} y1={startY}
                x2={endX} y2={endY}
                stroke={getWireColor()}
                strokeWidth={isSelected ? "3" : "2"}
                strokeOpacity={isPreview ? 0.6 : 0.9}
                strokeDasharray={isPreview ? "5 5" : "none"}
                style={{ pointerEvents: 'none' }}
            />
        </g>
    );
}

export default function DeviceOverlay({
    devices,
    selectedDeviceId,
    selectedWireId,
    activeDragId,
    projectionPosition,
    projectionDeviceTypeId,
    snapToSocketId,
    viewportTransform,
    onDeviceClick,
    onWireClick,
    onWireStart,
    onWireEnd,
    connections = [],
    drawingWire,
    dragDelta,
    alignmentGuides,
}: DeviceOverlayProps) {
    const { scale, positionX, positionY } = viewportTransform;

    const getTerminalScreenPos = (deviceId: string, terminalId: string) => {
        const device = devices.find(d => d.instanceId === deviceId);
        if (!device) return null;

        const type = getDeviceType(device.typeId);
        if (!type) return null;

        const terminal = type.terminals.find(t => t.id === terminalId);
        if (!terminal) return null;

        let devScreenX = device.x * scale + positionX;
        let devScreenY = device.y * scale + positionY;

        // If this device is currently being dragged, add the drag delta
        if (activeDragId === `placed-${deviceId}` && dragDelta) {
            devScreenX += dragDelta.x;
            devScreenY += dragDelta.y;
        }

        // Use actual device type dimensions for terminal offset calculation
        const worldOffsetX = terminal.relativeX * type.width;
        const worldOffsetY = terminal.relativeY * type.height;

        return {
            x: devScreenX + worldOffsetX * scale,
            y: devScreenY + worldOffsetY * scale
        };
    };

    return (
        <div
            className="device-overlay"
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
            {/* Wires Layer */}
            <svg
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
            >
                {connections.map(conn => {
                    const start = getTerminalScreenPos(conn.fromDeviceId, conn.fromTerminalId);
                    const end = getTerminalScreenPos(conn.toDeviceId, conn.toTerminalId);
                    if (!start || !end) return null;
                    return (
                        <Wire
                            key={conn.id}
                            id={conn.id}
                            startX={start.x}
                            startY={start.y}
                            endX={end.x}
                            endY={end.y}
                            isSelected={selectedWireId === conn.id}
                            onClick={onWireClick}
                        />
                    );
                })}

                {drawingWire && (() => {
                    const start = getTerminalScreenPos(drawingWire.startDeviceId, drawingWire.startTerminalId);
                    if (!start) return null;
                    const endX = drawingWire.endX * scale + positionX;
                    const endY = drawingWire.endY * scale + positionY;
                    return <Wire startX={start.x} startY={start.y} endX={endX} endY={endY} isPreview={true} />;
                })()}

                {/* Alignment Guides */}
                {alignmentGuides?.horizontal !== null && alignmentGuides?.horizontal !== undefined && (
                    <line
                        x1={0}
                        y1={alignmentGuides.horizontal * scale + positionY}
                        x2="100%"
                        y2={alignmentGuides.horizontal * scale + positionY}
                        stroke="#10B981"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                    />
                )}
                {alignmentGuides?.vertical !== null && alignmentGuides?.vertical !== undefined && (
                    <line
                        x1={alignmentGuides.vertical * scale + positionX}
                        y1={0}
                        x2={alignmentGuides.vertical * scale + positionX}
                        y2="100%"
                        stroke="#10B981"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                    />
                )}

            </svg>

            {/* Projection guide */}
            {projectionPosition && (
                <ProjectionGuide
                    x={projectionPosition.x}
                    y={projectionPosition.y}
                    viewportTransform={viewportTransform}
                    deviceTypeId={projectionDeviceTypeId || undefined}
                />
            )}

            {/* Devices */}
            {devices
                .filter(device => !device.mountedOnSocketId) // Skip mounted detectors - shown via socket overlay
                .filter(device => {
                    // Defensive: skip devices with missing typeId
                    if (!device.typeId) {
                        return false;
                    }
                    // Defensive: skip devices if deviceType lookup fails
                    const deviceType = getDeviceType(device.typeId);
                    if (!deviceType) {
                        return false;
                    }
                    return true;
                })
                .map((device) => {
                    const isSelected = device.instanceId === selectedDeviceId;
                    const isDragging = activeDragId === `placed-${device.instanceId}`;
                    const isSnapTarget = device.instanceId === snapToSocketId;

                    return (
                        <div key={device.instanceId} style={{ pointerEvents: 'auto' }}>
                            <DraggableDevice
                                device={device}
                                isSelected={isSelected}
                                isDragging={isDragging}
                                isSnapTarget={isSnapTarget}
                                viewportTransform={viewportTransform}
                                onDeviceClick={onDeviceClick}
                                onWireStart={onWireStart}
                                onWireEnd={onWireEnd}
                            />
                        </div>
                    );
                })}
        </div>
    );
}
