// 3D Simulation View using Three.js / React Three Fiber
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { parseRoomsFromSVG, getSVGDimensions, ROOM_COLORS_3D } from '../utils/roomParser';
import type { RoomData } from '../utils/roomParser';
import type { PlacedDevice } from '../types/devices';

interface SimulationView3DProps {
    svgContent: string;
    placedDevices: PlacedDevice[];
    activatedDevices: Set<string>;
    activatedSounders: Set<string>;
    onDeviceClick?: (deviceId: string) => void;
}

// Configuration
const SCALE = 0.1;
const WALL_HEIGHT = 8;
const WALL_THICKNESS = 0.5;
const DOOR_WIDTH = 4;
const DOOR_HEIGHT = 6.5;
const WINDOW_HEIGHT = 4;
const WINDOW_Y_OFFSET = 2.5;

// --- Procedural Materials & Geometries ---

// Floor material types
type FloorType = 'carpet' | 'wood' | 'tile' | 'concrete';

const getRoomFloorType = (type: string): FloorType => {
    switch (type) {
        case 'office': return 'carpet';
        case 'meeting': return 'wood';
        case 'toilet': return 'tile';
        case 'entrance': return 'tile';
        case 'server': return 'concrete';
        default: return 'carpet';
    }
};

const getFloorColor = (type: FloorType, originalColor: string): string => {
    switch (type) {
        case 'carpet': return '#CBD5E1'; // Slate 300
        case 'wood': return '#E2C799';   // Light wood
        case 'tile': return '#F1F5F9';   // Slate 100
        case 'concrete': return '#94A3B8';
        default: return originalColor;
    }
};

// --- Components ---

// High-quality Floor with border
function Floor3D({ x, y, width, height, type }: {
    x: number; y: number; width: number; height: number; type: string;
}) {
    const floorType = getRoomFloorType(type);
    const color = getFloorColor(floorType, ROOM_COLORS_3D[type]);

    const w = width * SCALE;
    const h = height * SCALE;
    const centerX = (x + width / 2) * SCALE;
    const centerZ = (y + height / 2) * SCALE;

    return (
        <group position={[centerX, 0.02, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh receiveShadow>
                <planeGeometry args={[w - 0.2, h - 0.2]} /> {/* Slight inset for wall gap */}
                <meshStandardMaterial
                    color={color}
                    roughness={floorType === 'wood' ? 0.4 : 0.8}
                    metalness={floorType === 'tile' ? 0.3 : 0.1}
                />
            </mesh>
            {/* Baseboard/Skirting board logic could go here if we had perimeter data easily accessible */}
        </group>
    );
}

// Procedural Furniture

function Chair({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
            {/* Legs */}
            <mesh position={[0.2, 0.6, 0.2]} castShadow>
                <boxGeometry args={[0.05, 1.2, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.2, 0.6, 0.2]} castShadow>
                <boxGeometry args={[0.05, 1.2, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0.2, 0.6, -0.2]} castShadow>
                <boxGeometry args={[0.05, 1.2, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[-0.2, 0.6, -0.2]} castShadow>
                <boxGeometry args={[0.05, 1.2, 0.05]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Seat */}
            <mesh position={[0, 1.3, 0]} castShadow>
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            {/* Back */}
            <mesh position={[0, 2, -0.23]} castShadow>
                <boxGeometry args={[0.5, 1.5, 0.05]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
        </group>
    );
}

function MeetingTable({ x, z, width, length }: { x: number; z: number; width: number; length: number }) {
    return (
        <group position={[x, 0, z]}>
            {/* Table Top */}
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[width, 0.1, length]} />
                <meshStandardMaterial color="#8B5E3C" roughness={0.3} />
            </mesh>
            {/* Base */}
            <mesh position={[0, 1.25, 0]} castShadow>
                <cylinderGeometry args={[width * 0.3, width * 0.3, 2.5, 16]} />
                <meshStandardMaterial color="#1f1f1f" />
            </mesh>

            {/* Chairs */}
            <Chair x={-width / 2 - 0.5} z={0} rotation={Math.PI / 2} />
            <Chair x={width / 2 + 0.5} z={0} rotation={-Math.PI / 2} />
            {length > 4 && (
                <>
                    <Chair x={-width / 2 - 0.5} z={1} rotation={Math.PI / 2} />
                    <Chair x={width / 2 + 0.5} z={1} rotation={-Math.PI / 2} />
                    <Chair x={-width / 2 - 0.5} z={-1} rotation={Math.PI / 2} />
                    <Chair x={width / 2 + 0.5} z={-1} rotation={-Math.PI / 2} />
                </>
            )}
        </group>
    );
}

function OfficeDesk({ x, z, rotation = 0 }: { x: number; z: number; rotation?: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
            {/* Desk Top */}
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[3, 0.1, 1.5]} />
                <meshStandardMaterial color="#F1F5F9" />
            </mesh>
            {/* Side Panel L */}
            <mesh position={[-1.4, 1.25, 0]} castShadow>
                <boxGeometry args={[0.1, 2.5, 1.5]} />
                <meshStandardMaterial color="#CBD5E1" />
            </mesh>
            {/* Side Panel R */}
            <mesh position={[1.4, 1.25, 0]} castShadow>
                <boxGeometry args={[0.1, 2.5, 1.5]} />
                <meshStandardMaterial color="#CBD5E1" />
            </mesh>
            {/* Modesty Panel */}
            <mesh position={[0, 1.8, -0.6]} castShadow>
                <boxGeometry args={[2.8, 1.4, 0.05]} />
                <meshStandardMaterial color="#CBD5E1" />
            </mesh>
            {/* Monitor */}
            <mesh position={[0, 3, 0.3]} rotation={[0, 0, 0]} castShadow>
                <boxGeometry args={[1, 0.6, 0.05]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 2.6, 0.3]}>
                <cylinderGeometry args={[0.1, 0.2, 0.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Chair */}
            <Chair x={0} z={1.2} rotation={Math.PI} />
        </group>
    )
}

function RoomFurniture({ type, width, height }: { type: string, width: number, height: number }) {
    if (type === 'meeting') {
        return <MeetingTable x={0} z={0} width={Math.min(width, height) * 0.4} length={Math.max(width, height) * 0.6} />;
    }

    if (type === 'office') {
        // Place 1-4 desks depending on size
        const count = Math.min(4, Math.floor((width * height) / 40));

        if (count <= 1) {
            return <OfficeDesk x={0} z={0} />;
        }

        // Simple quadrant placement for multiple desks
        if (width > height) {
            return (
                <group>
                    <OfficeDesk x={-width / 4} z={0} />
                    <OfficeDesk x={width / 4} z={0} />
                </group>
            )
        } else {
            return (
                <group>
                    <OfficeDesk x={0} z={-height / 4} />
                    <OfficeDesk x={0} z={height / 4} />
                </group>
            )
        }
    }

    if (type === 'toilet') {
        return (
            <group>
                <mesh position={[0, 1.5, 0]} castShadow>
                    <boxGeometry args={[width * 0.6, 3, 0.1]} />
                    <meshStandardMaterial color="#E2E8F0" />
                </mesh>
            </group>
        )
    }

    return null;
}


// --- Updated Wall & Geometry Components ---

function WallWithGap({
    startX, startZ, endX, endZ,
    gapStart, gapEnd
}: {
    startX: number; startZ: number; endX: number; endZ: number;
    gapStart?: number; gapEnd?: number;
}) {
    const length = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
    const angle = Math.atan2(endZ - startZ, endX - startX);

    // Material for walls
    const wallMaterial = <meshStandardMaterial color="#FFFFFF" roughness={0.5} />;

    // If no gap, render single wall
    if (gapStart === undefined || gapEnd === undefined) {
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;

        return (
            <mesh position={[centerX, WALL_HEIGHT / 2, centerZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
                {wallMaterial}
            </mesh>
        );
    }

    // Render wall with gap
    const segments: React.ReactElement[] = [];
    const gapStartNorm = gapStart / length;
    const gapEndNorm = gapEnd / length;

    if (gapStartNorm > 0.01) {
        const seg1Length = gapStart;
        const seg1CenterX = startX + (Math.cos(angle) * seg1Length / 2);
        const seg1CenterZ = startZ + (Math.sin(angle) * seg1Length / 2);

        segments.push(
            <mesh key="seg1" position={[seg1CenterX, WALL_HEIGHT / 2, seg1CenterZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                <boxGeometry args={[seg1Length, WALL_HEIGHT, WALL_THICKNESS]} />
                {wallMaterial}
            </mesh>
        );
    }

    if (gapEndNorm < 0.99) {
        const seg2Length = length - gapEnd;
        const seg2StartX = startX + (Math.cos(angle) * gapEnd);
        const seg2StartZ = startZ + (Math.sin(angle) * gapEnd);
        const seg2CenterX = seg2StartX + (Math.cos(angle) * seg2Length / 2);
        const seg2CenterZ = seg2StartZ + (Math.sin(angle) * seg2Length / 2);

        segments.push(
            <mesh key="seg2" position={[seg2CenterX, WALL_HEIGHT / 2, seg2CenterZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                <boxGeometry args={[seg2Length, WALL_HEIGHT, WALL_THICKNESS]} />
                {wallMaterial}
            </mesh>
        );
    }

    // Header above door
    const doorTopHeight = WALL_HEIGHT - DOOR_HEIGHT;
    if (doorTopHeight > 0) {
        const gapCenterX = startX + (Math.cos(angle) * (gapStart + gapEnd) / 2);
        const gapCenterZ = startZ + (Math.sin(angle) * (gapStart + gapEnd) / 2);

        segments.push(
            <mesh key="doorTop" position={[gapCenterX, DOOR_HEIGHT + doorTopHeight / 2, gapCenterZ]} rotation={[0, -angle, 0]} castShadow receiveShadow>
                <boxGeometry args={[gapEnd - gapStart, doorTopHeight, WALL_THICKNESS]} />
                {wallMaterial}
            </mesh>
        );
    }

    return <>{segments}</>;
}


// --- Main Room Component ---

function Room3D({ room }: { room: RoomData }) {
    const { x, y, width, height, type, label, door, isExterior } = room;

    const walls: React.ReactElement[] = [];
    const windows: React.ReactElement[] = [];

    const x1 = x * SCALE;
    const z1 = y * SCALE;
    const x2 = (x + width) * SCALE;
    const z2 = (y + height) * SCALE;

    const getDoorGap = (wallStart: number, wallEnd: number, doorPos: number, doorWidth: number) => {
        const doorPosScaled = doorPos * SCALE;
        const doorWidthScaled = doorWidth * SCALE;
        const gapStart = Math.abs(doorPosScaled - Math.min(wallStart, wallEnd));
        return { gapStart, gapEnd: gapStart + doorWidthScaled };
    };

    // Generate Walls (Top, Bottom, Left, Right)
    // ... (Logic same as before but using updated WallWithGap)
    // Top
    const hasDoorTop = door && door.direction === 'top';
    walls.push(<WallWithGap key="top" startX={x1} startZ={z1} endX={x2} endZ={z1}
        gapStart={hasDoorTop ? getDoorGap(x1, x2, door.x, 40).gapStart : undefined}
        gapEnd={hasDoorTop ? getDoorGap(x1, x2, door.x, 40).gapEnd : undefined} />);

    // Bottom
    const hasDoorBottom = door && door.direction === 'bottom';
    walls.push(<WallWithGap key="bottom" startX={x1} startZ={z2} endX={x2} endZ={z2}
        gapStart={hasDoorBottom ? getDoorGap(x1, x2, door.x, 40).gapStart : undefined}
        gapEnd={hasDoorBottom ? getDoorGap(x1, x2, door.x, 40).gapEnd : undefined} />);

    // Left
    const hasDoorLeft = door && door.direction === 'left';
    walls.push(<WallWithGap key="left" startX={x1} startZ={z1} endX={x1} endZ={z2}
        gapStart={hasDoorLeft ? getDoorGap(z1, z2, door.y, 40).gapStart : undefined}
        gapEnd={hasDoorLeft ? getDoorGap(z1, z2, door.y, 40).gapEnd : undefined} />);

    // Right
    const hasDoorRight = door && door.direction === 'right';
    walls.push(<WallWithGap key="right" startX={x2} startZ={z1} endX={x2} endZ={z2}
        gapStart={hasDoorRight ? getDoorGap(z1, z2, door.y, 40).gapStart : undefined}
        gapEnd={hasDoorRight ? getDoorGap(z1, z2, door.y, 40).gapEnd : undefined} />);

    // Add Windows
    if (isExterior && type !== 'entrance' && type !== 'public') {
        if (isExterior.top) windows.push(<Window3D key="win-top" x={x + width / 2 - 20} y={y} width={40} isHorizontal={true} />);
        if (isExterior.bottom && type !== 'entrance') windows.push(<Window3D key="win-bottom" x={x + width / 2 - 20} y={y + height} width={40} isHorizontal={true} />);
        if (isExterior.left) windows.push(<Window3D key="win-left" x={x} y={y + height / 2 - 20} width={40} isHorizontal={false} />);
        if (isExterior.right) windows.push(<Window3D key="win-right" x={x + width} y={y + height / 2 - 20} width={40} isHorizontal={false} />);
    }

    const centerX = (x + width / 2) * SCALE;
    const centerZ = (y + height / 2) * SCALE;

    return (
        <group>
            <Floor3D x={x} y={y} width={width} height={height} type={type} />
            {walls}
            {windows}
            {door && <Door3D x={door.x} y={door.y} direction={door.direction} />}

            {/* Furniture - centered in room */}
            <group position={[centerX, 0, centerZ]}>
                <RoomFurniture type={type} width={width * SCALE} height={height * SCALE} />
            </group>

            <Text
                position={[centerX, 0.2, centerZ]} // On floor
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={1.5}
                color="#000000"
                fillOpacity={0.4}
                anchorX="center"
                anchorY="middle"
            >
                {label.replace(/\s*\d+$/, '')}
            </Text>
        </group>
    );
}

// --- Devices (Refined) ---

function Detector3D({ x, y, isActivated, onClick }: { x: number; y: number; isActivated: boolean; onClick?: () => void }) {
    const meshRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (meshRef.current && isActivated) {
            meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
        }
    });

    return (
        <group position={[x * SCALE, WALL_HEIGHT - 0.2, y * SCALE]}>
            {/* Detailed Smoke Detector */}
            <mesh ref={meshRef} onClick={onClick}>
                <cylinderGeometry args={[0.8, 1, 0.4, 32]} />
                <meshStandardMaterial color={isActivated ? '#EF4444' : '#FFFFFF'} roughness={0.2} metalness={0.1} />
            </mesh>
            {/* LED Ring */}
            <mesh position={[0, -0.18, 0]}>
                <torusGeometry args={[0.8, 0.05, 8, 32]} />
                <meshBasicMaterial color={isActivated ? '#FF0000' : '#CCCCCC'} />
            </mesh>
            {/* Grill details */}
            <mesh position={[0, -0.21, 0]}>
                <cylinderGeometry args={[0.6, 0.6, 0.05, 16]} />
                <meshStandardMaterial color="#eeeeee" />
            </mesh>
            {isActivated && <pointLight color="#FF0000" intensity={1.5} distance={10} />}
        </group>
    );
}

// ... (Sounder3D and MCP3D simplified for brevity but assume similar refinement)
function Sounder3D({ x, y, isActivated, onClick }: { x: number; y: number; isActivated: boolean; onClick?: () => void }) {
    // Wall mounted sounder
    return (
        <group position={[x * SCALE, WALL_HEIGHT * 0.7, y * SCALE]}>
            <mesh onClick={onClick} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.2, 1.4, 1.0, 32]} />
                <meshStandardMaterial color={isActivated ? '#ef4444' : '#f97316'} roughness={0.2} />
            </mesh>
            {isActivated && <pointLight color="#FF0000" intensity={2} distance={15} />}
        </group>
    )
}

function MCP3D({ x, y, isActivated, onClick }: { x: number; y: number; isActivated: boolean; onClick?: () => void }) {
    return (
        <group position={[x * SCALE, WALL_HEIGHT * 0.4, y * SCALE]}>
            <mesh onClick={onClick}>
                <boxGeometry args={[1.8, 1.8, 0.5]} />
                <meshStandardMaterial color="#dc2626" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.3]}>
                <boxGeometry args={[0.8, 0.8, 0.1]} />
                <meshStandardMaterial color={isActivated ? '#FFFF00' : '#FFFFFF'} />
            </mesh>
        </group>
    )
}

// Re-use Door3D and Window3D logic from before, they were okay
function Door3D({ x, y, direction }: { x: number; y: number; direction: string }) {
    const posX = x * SCALE;
    const posZ = y * SCALE;
    const isHorizontal = direction === 'top' || direction === 'bottom';

    return (
        <group position={[posX + DOOR_WIDTH / 2, 0, posZ]}>
            {/* Frame */}
            <mesh position={[0, DOOR_HEIGHT / 2, 0]} rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}>
                <boxGeometry args={[DOOR_WIDTH + 0.4, DOOR_HEIGHT + 0.2, 0.6]} /> {/* Thicker frame */}
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Door Leaf */}
            <mesh position={[0, DOOR_HEIGHT / 2, 0]} rotation={[0, isHorizontal ? 0 : Math.PI / 2, 0]}>
                <boxGeometry args={[DOOR_WIDTH, DOOR_HEIGHT, 0.2]} />
                <meshStandardMaterial color="#8B4513" roughness={0.6} />
            </mesh>
            {/* Handle */}
            <mesh position={[isHorizontal ? 1.5 : 0, DOOR_HEIGHT * 0.45, isHorizontal ? 0.2 : 1.5]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}

function Window3D({ x, y, width, isHorizontal }: { x: number; y: number; width: number; isHorizontal: boolean }) {
    const posX = x * SCALE;
    const posZ = y * SCALE;
    const w = isHorizontal ? width * SCALE : WALL_THICKNESS * 2;
    const d = isHorizontal ? WALL_THICKNESS * 2 : width * SCALE;
    return (
        <group position={[posX + (isHorizontal ? w / 2 : 0), WINDOW_Y_OFFSET + WINDOW_HEIGHT / 2, posZ + (isHorizontal ? 0 : d / 2)]}>
            <mesh castShadow>
                <boxGeometry args={[w, WINDOW_HEIGHT, d]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[w * 0.9, WINDOW_HEIGHT * 0.9, d * 0.6]} />
                <meshStandardMaterial color="#bae6fd" transparent opacity={0.6} metalness={0.9} roughness={0} />
            </mesh>
        </group>
    );
}

// --- Main Scene ---

function Scene({ svgContent, placedDevices, activatedDevices, activatedSounders, onDeviceClick }: SimulationView3DProps) {
    const rooms = useMemo(() => parseRoomsFromSVG(svgContent), [svgContent]);
    const dimensions = useMemo(() => getSVGDimensions(svgContent), [svgContent]);
    const detectors = placedDevices.filter(d => d.typeId === 'AG-socket' || d.typeId === 'AG-head');
    const sounders = placedDevices.filter(d => d.typeId === 'sounder');
    const mcps = placedDevices.filter(d => d.typeId === 'mcp');
    const centerX = (dimensions.width / 2) * SCALE;
    const centerZ = (dimensions.height / 2) * SCALE;

    return (
        <>
            {/* Lighting Setup */}
            {/* Environment preset provides realistic reflection and fill light */}
            <Environment preset="city" />

            {/* Main sunlight */}
            <directionalLight
                position={[80, 100, 50]}
                intensity={2.5}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0001}
            >
                <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100]} />
            </directionalLight>

            {/* Fill light */}
            <ambientLight intensity={0.4} />

            {/* Contact Shadows for grounding grounding objects */}
            <ContactShadows
                position={[centerX, 0.01, centerZ]}
                opacity={0.6}
                scale={300}
                blur={2}
                far={10}
                resolution={512}
                color="#000000"
            />

            {/* Ground Plane (Infinite look) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.1, centerZ]} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial color="#f0f2f5" />
            </mesh>

            {/* Rooms & Furniture */}
            {rooms.map((room) => (
                <Room3D key={room.id} room={room} />
            ))}

            {/* Devices */}
            {detectors.filter(d => !d.mountedOnSocketId).map(d => (
                <Detector3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedDevices.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} />
            ))}
            {sounders.map(d => (
                <Sounder3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedSounders.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} />
            ))}
            {mcps.map(d => (
                <MCP3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedDevices.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} />
            ))}

            <OrbitControls makeDefault minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={150} target={[centerX, 0, centerZ]} />
        </>
    );
}

export default function SimulationView3D(props: SimulationView3DProps) {
    const dimensions = useMemo(() => getSVGDimensions(props.svgContent), [props.svgContent]);
    const centerX = (dimensions.width / 2) * SCALE;
    const centerZ = (dimensions.height / 2) * SCALE;

    return (
        <div className="flex-1 w-full h-full relative" style={{ minHeight: '100%', background: '#e2e8f0' }}>
            <Canvas
                style={{ width: '100%', height: '100%' }}
                camera={{ position: [centerX + 30, 40, centerZ + 40], fov: 50 }}
                shadows
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
            >
                <Scene {...props} />
            </Canvas>
            {/* UI Controls */}
            <div className="absolute top-4 left-4 z-10 px-3 py-2 bg-white/90 rounded-lg shadow-md backdrop-blur-sm">
                <p className="text-slate-800 text-xs font-semibold">🖱️ Drag to rotate • Scroll to zoom</p>
            </div>
            {props.activatedSounders.size > 0 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-600 rounded-full shadow-xl animate-pulse text-white font-bold">
                    🔥 FIRE ALARM ACTIVE ({props.activatedSounders.size})
                </div>
            )}
        </div>
    );
}
