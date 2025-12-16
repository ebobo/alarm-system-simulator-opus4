import { useDraggable } from '@dnd-kit/core';
import type { PlacedDevice, ViewportTransform } from '../types/devices';
import { getDeviceType } from '../types/devices';

interface DeviceOverlayProps {
    devices: PlacedDevice[];
    selectedDeviceId?: string | null;
    activeDragId?: string | null;
    projectionPosition?: { x: number; y: number } | null;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
    onTerminalClick?: (instanceId: string, terminalId: string) => void;
}

// Draggable device rendered as HTML element
function DraggableDevice({
    device,
    isSelected,
    isDragging,
    viewportTransform,
    onDeviceClick,
}: {
    device: PlacedDevice;
    isSelected: boolean;
    isDragging: boolean;
    viewportTransform: ViewportTransform;
    onDeviceClick?: (instanceId: string) => void;
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
                <circle cx="0" cy="-22" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="22" cy="0" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="0" cy="22" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
                <circle cx="-22" cy="0" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
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
export default function DeviceOverlay({
    devices,
    selectedDeviceId,
    activeDragId,
    projectionPosition,
    viewportTransform,
    onDeviceClick,
}: DeviceOverlayProps) {
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
            {/* Projection guide */}
            {projectionPosition && (
                <ProjectionGuide
                    x={projectionPosition.x}
                    y={projectionPosition.y}
                    viewportTransform={viewportTransform}
                />
            )}

            {/* Devices - pointer events enabled for each device */}
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
                        />
                    </div>
                );
            })}
        </div>
    );
}
