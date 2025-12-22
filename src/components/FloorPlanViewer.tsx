import { useCallback, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useDroppable } from '@dnd-kit/core';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire, RoomInfo } from '../types/devices';
import DeviceOverlay from './DeviceOverlay';

interface FloorPlanViewerProps {
    svgContent: string;
    placedDevices: PlacedDevice[];
    selectedDeviceId?: string | null;
    selectedWireId?: string | null;
    selectedRoomId?: string | null;  // Reserved for future use
    activeDragId?: string | null;
    projectionPosition?: { x: number; y: number } | null;
    projectionDeviceTypeId?: string | null;
    snapToSocketId?: string | null;  // Socket being snapped to during detector drag
    onTransformChange?: (transform: ViewportTransform) => void;
    onDeviceClick?: (instanceId: string) => void;
    onWireClick?: (wireId: string) => void;
    onRoomClick?: (roomInfo: RoomInfo) => void;
    connections: Connection[];
    drawingWire: DrawingWire | null;
    onWireStart: (deviceId: string, terminalId: string, e: React.PointerEvent) => void;
    onWireEnd: (deviceId: string, terminalId: string) => void;
    dragDelta?: { x: number; y: number } | null;
    alignmentGuides?: { horizontal: number | null; vertical: number | null };
}

function Controls() {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
                onClick={() => zoomIn(0.1)}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 
                   hover:bg-gray-50 transition-all duration-200 flex items-center justify-center
                   text-gray-700 font-bold text-xl"
                title="Zoom In"
            >
                +
            </button>
            <button
                onClick={() => zoomOut(0.1)}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 
                   hover:bg-gray-50 transition-all duration-200 flex items-center justify-center
                   text-gray-700 font-bold text-xl"
                title="Zoom Out"
            >
                −
            </button>
            <button
                onClick={() => resetTransform()}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 
                   hover:bg-gray-50 transition-all duration-200 flex items-center justify-center
                   text-gray-600"
                title="Reset View"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
        </div>
    );
}

export default function FloorPlanViewer({
    svgContent,
    placedDevices,
    selectedDeviceId,
    selectedWireId,
    selectedRoomId: _,  // Reserved for future use
    activeDragId,
    projectionPosition,
    projectionDeviceTypeId,
    snapToSocketId,
    onTransformChange,
    onDeviceClick,
    onWireClick,
    onRoomClick,
    connections,
    drawingWire,
    onWireStart,
    onWireEnd,
    dragDelta,
    alignmentGuides,
}: FloorPlanViewerProps) {
    const transformRef = useRef<ReactZoomPanPinchRef>(null);

    // Local state for viewport transform (for device positioning)
    const [localTransform, setLocalTransform] = useState<ViewportTransform>({
        scale: 1,
        positionX: 0,
        positionY: 0,
    });

    // Setup droppable area
    const { isOver, setNodeRef } = useDroppable({
        id: 'floor-plan-drop-zone',
    });

    // Handle transform changes from zoom/pan
    const handleTransformChange = useCallback((ref: ReactZoomPanPinchRef) => {
        const transform = {
            scale: ref.state.scale,
            positionX: ref.state.positionX,
            positionY: ref.state.positionY,
        };
        setLocalTransform(transform);
        onTransformChange?.(transform);
    }, [onTransformChange]);

    // Handle SVG click to detect room clicks
    const handleSvgClick = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;

        // Check if clicking on a room rect element
        const roomId = target.getAttribute('data-room-id');
        if (roomId) {
            e.stopPropagation();
            const roomInfo: RoomInfo = {
                id: roomId,
                type: target.getAttribute('data-room-type') || 'unknown',
                uniqueLabel: target.getAttribute('data-room-label') || roomId,
                x: parseFloat(target.getAttribute('data-room-x') || '0'),
                y: parseFloat(target.getAttribute('data-room-y') || '0'),
                width: parseFloat(target.getAttribute('data-room-width') || '0'),
                height: parseFloat(target.getAttribute('data-room-height') || '0'),
            };
            onRoomClick?.(roomInfo);
        }
    }, [onRoomClick]);

    // Determine if we should show the drop indicator
    const showDropIndicator = isOver && activeDragId?.startsWith('palette-');

    return (
        <div
            ref={setNodeRef}
            className={`
        relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 
        rounded-xl overflow-hidden shadow-inner
        ${showDropIndicator ? 'ring-4 ring-blue-400/50 ring-inset' : ''}
      `}
            data-floor-plan-container
        >
            <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={0.3}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
                onTransformed={handleTransformChange}
                onInit={handleTransformChange}
            >
                <Controls />
                <TransformComponent
                    wrapperStyle={{
                        width: '100%',
                        height: '100%',
                    }}
                    contentStyle={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px',
                        position: 'relative',
                    }}
                >
                    {/* Floor plan SVG */}
                    <div
                        className="bg-white rounded-lg shadow-2xl relative"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                        onClick={handleSvgClick}
                    />
                </TransformComponent>
            </TransformWrapper>

            {/* Device overlay - rendered OUTSIDE TransformComponent 
          so it can handle its own drag events properly */}
            <DeviceOverlay
                devices={placedDevices}
                selectedDeviceId={selectedDeviceId}
                selectedWireId={selectedWireId}
                activeDragId={activeDragId}
                projectionPosition={projectionPosition}
                projectionDeviceTypeId={projectionDeviceTypeId}
                snapToSocketId={snapToSocketId}
                viewportTransform={localTransform}
                onDeviceClick={onDeviceClick}
                onWireClick={onWireClick}
                connections={connections}
                drawingWire={drawingWire}
                onWireStart={onWireStart}
                onWireEnd={onWireEnd}
                dragDelta={dragDelta}
                alignmentGuides={alignmentGuides}
            />

            {/* Drop zone indicator */}
            {showDropIndicator && (
                <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
                        Drop device here
                    </span>
                </div>
            )}

            {/* Zoom instructions */}
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                Scroll to zoom • Drag to pan
            </div>
        </div>
    );
}
