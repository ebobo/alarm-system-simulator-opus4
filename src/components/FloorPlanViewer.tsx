import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

interface FloorPlanViewerProps {
    svgContent: string;
}

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

export default function FloorPlanViewer({ svgContent }: FloorPlanViewerProps) {
    return (
        <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-inner">
            <TransformWrapper
                initialScale={1}
                minScale={0.3}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
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
                    }}
                >
                    <div
                        className="bg-white rounded-lg shadow-2xl"
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                    />
                </TransformComponent>
            </TransformWrapper>

            {/* Zoom instructions */}
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                Scroll to zoom • Drag to pan
            </div>
        </div>
    );
}
