// Simulation View - shows floor plan with activatable devices (no wires/connectors)
import { useCallback, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import type { PlacedDevice, ViewportTransform } from '../types/devices';
import SimulationDeviceOverlay from '../components/SimulationDeviceOverlay';

interface SimulationViewProps {
    svgContent: string;
    placedDevices: PlacedDevice[];
    selectedDeviceId: string | null;
    activatedDevices: Set<string>;
    onDeviceClick: (deviceId: string) => void;
    onFloorPlanClick: () => void;
}

// Zoom controls component - uses useControls from react-zoom-pan-pinch
function Controls() {
    const { zoomIn, zoomOut, resetTransform } = useControls();

    return (
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <button
                onClick={() => zoomIn()}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 
                   hover:bg-gray-50 transition-all duration-200 flex items-center justify-center
                   text-gray-700 font-bold text-xl"
                title="Zoom In"
            >
                +
            </button>
            <button
                onClick={() => zoomOut()}
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

export default function SimulationView({
    svgContent,
    placedDevices,
    selectedDeviceId,
    activatedDevices,
    onDeviceClick,
    onFloorPlanClick,
}: SimulationViewProps) {
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
        scale: 1,
        positionX: 0,
        positionY: 0,
    });

    const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
        const state = ref.state;
        setViewportTransform({
            scale: state.scale,
            positionX: state.positionX,
            positionY: state.positionY,
        });
    }, []);

    return (
        <div className="flex-1 p-4" onClick={onFloorPlanClick}>
            <div className="relative w-full h-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {/* Simulation Mode Banner */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-md">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-white text-sm font-medium">Simulation Mode</span>
                    </div>
                </div>

                <TransformWrapper
                    ref={transformRef}
                    initialScale={1}
                    minScale={0.3}
                    maxScale={4}
                    centerOnInit={true}
                    wheel={{ step: 0.1 }}
                    panning={{ velocityDisabled: true }}
                    onTransformed={handleTransform}
                    onInit={handleTransform}
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
                        {/* Floor Plan SVG */}
                        <div
                            className="bg-white rounded-lg shadow-2xl relative"
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    </TransformComponent>
                </TransformWrapper>

                {/* Device Overlay (no wires, no terminals) */}
                <SimulationDeviceOverlay
                    devices={placedDevices}
                    selectedDeviceId={selectedDeviceId}
                    activatedDevices={activatedDevices}
                    viewportTransform={viewportTransform}
                    onDeviceClick={onDeviceClick}
                />

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 z-10 px-3 py-2 bg-slate-800/90 rounded-lg shadow-md">
                    <p className="text-white text-xs">
                        Click on a detector or MCP to select it, then use the property panel to activate.
                    </p>
                </div>
            </div>
        </div>
    );
}
