import { useDraggable } from '@dnd-kit/core';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire } from '../types/devices';
import { getDeviceType } from '../types/devices';

interface DeviceOverlayProps {
    devices: PlacedDevice[];
    selectedDeviceId?: string | null;
    activeDragId?: string | null;
    projectionPosition?: { x: number; y: number } | null;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
    connections?: Connection[];
    drawingWire?: DrawingWire | null;
    onWireStart?: (deviceId: string, terminalId: string, e: React.PointerEvent) => void;
    onWireEnd?: (deviceId: string, terminalId: string) => void;
    dragDelta?: { x: number; y: number } | null;
}

// Draggable device rendered as HTML element
function DraggableDevice({
    device,
    isSelected,
    isDragging,
    viewportTransform,
    onDeviceClick,
    onWireStart,
    onWireEnd,
}: {
    device: PlacedDevice;
    isSelected: boolean;
    isDragging: boolean;
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

    const size = 50 * scale;

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
                left: screenX - size / 2 + dragOffsetX,
                top: screenY - size / 2 + dragOffsetY,
                width: size,
                height: size,
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                zIndex: isSelected ? 10 : 1,
            }}
            className="device-container"
        >
            {/* Device SVG */}
            <svg
                width={size}
                height={size}
                viewBox="-30 -30 60 60"
                style={{ overflow: 'visible' }}
            >
                {/* Selection ring */}
                {isSelected && (
                    <circle
                        r="28"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                    />
                )}

                {/* Device base */}
                <circle r="25" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
                <circle r="16" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
                <circle r="6" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
                <circle r="2" fill="#64748B" />

                {/* Terminals */}
                {deviceType.terminals.map((terminal) => {
                    const svgtX = terminal.relativeX * 50;
                    const svgtY = terminal.relativeY * 50;

                    return (
                        <g key={terminal.id} transform={`translate(${svgtX}, ${svgtY})`}>
                            {/* Hit area */}
                            <circle
                                r="8"
                                fill="transparent"
                                style={{ cursor: 'crosshair', pointerEvents: 'all' }}
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    onWireStart?.(device.instanceId, terminal.id, e);
                                }}
                                onPointerUp={(e) => {
                                    e.stopPropagation();
                                    onWireEnd?.(device.instanceId, terminal.id);
                                }}
                            />
                            {/* Visible terminal */}
                            <circle r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />
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
}: {
    x: number;
    y: number;
    viewportTransform: ViewportTransform;
}) {
    const { scale, positionX, positionY } = viewportTransform;
    const screenX = x * scale + positionX;
    const screenY = y * scale + positionY;
    const size = 60 * scale;

    return (
        <div
            style={{
                position: 'absolute',
                left: screenX - size / 2,
                top: screenY - size / 2,
                width: size,
                height: size,
                pointerEvents: 'none',
            }}
        >
            <svg width={size} height={size} viewBox="-30 -30 60 60">
                <circle
                    r="28"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    opacity="0.7"
                />
                <circle r="25" fill="#3B82F6" opacity="0.15" />
                <line x1="-15" y1="0" x2="15" y2="0" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                <line x1="0" y1="-15" x2="0" y2="15" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
                <circle r="3" fill="#3B82F6" opacity="0.8" />
            </svg>
        </div>
    );
}

/**
 * Overlay that renders devices as HTML elements positioned using viewport transform.
 * This allows devices to be properly draggable without interfering with pan/zoom.
 */
// Connection Rendering Helper
function Wire({
    startX, startY, endX, endY, isPreview = false
}: {
    startX: number; startY: number; endX: number; endY: number; isPreview?: boolean
}) {
    return (
        <line
            x1={startX} y1={startY}
            x2={endX} y2={endY}
            stroke={isPreview ? "#3B82F6" : "#EF4444"}
            strokeWidth="2"
            strokeOpacity={isPreview ? 0.6 : 0.8}
            strokeDasharray={isPreview ? "5 5" : "none"}
            style={{ pointerEvents: 'none' }}
        />
    );
}

export default function DeviceOverlay({
    devices,
    selectedDeviceId,
    activeDragId,
    projectionPosition,
    viewportTransform,
    onDeviceClick,
    onWireStart,
    onWireEnd,
    connections = [],
    drawingWire,
    dragDelta,
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

        const worldOffsetX = terminal.relativeX * 50;
        const worldOffsetY = terminal.relativeY * 50;

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
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
            >
                {connections.map(conn => {
                    const start = getTerminalScreenPos(conn.fromDeviceId, conn.fromTerminalId);
                    const end = getTerminalScreenPos(conn.toDeviceId, conn.toTerminalId);
                    if (!start || !end) return null;
                    return <Wire key={conn.id} startX={start.x} startY={start.y} endX={end.x} endY={end.y} />;
                })}

                {drawingWire && (() => {
                    const start = getTerminalScreenPos(drawingWire.startDeviceId, drawingWire.startTerminalId);
                    if (!start) return null;
                    const endX = drawingWire.endX * scale + positionX;
                    const endY = drawingWire.endY * scale + positionY;
                    return <Wire startX={start.x} startY={start.y} endX={endX} endY={endY} isPreview={true} />;
                })()}
            </svg>

            {/* Projection guide */}
            {projectionPosition && (
                <ProjectionGuide
                    x={projectionPosition.x}
                    y={projectionPosition.y}
                    viewportTransform={viewportTransform}
                />
            )}

            {/* Devices */}
            {devices.map((device) => {
                const isSelected = device.instanceId === selectedDeviceId;
                const isDragging = activeDragId === `placed-${device.instanceId}`;

                return (
                    <div key={device.instanceId} style={{ pointerEvents: 'auto' }}>
                        <DraggableDevice
                            device={device}
                            isSelected={isSelected}
                            isDragging={isDragging}
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
