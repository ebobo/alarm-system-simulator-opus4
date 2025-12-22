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
        // Place toilets along the wall (assuming top/bottom placement based on aspect ratio)
        // For simplicity, just place 1 or 2 toilets
        return (
            <group>
                <group scale={[1.4, 1.4, 1.4]} position={[-width / 4, 0, -height / 2 + 1]}>
                    <Toilet x={0} z={0} rotation={0} />
                </group>
                {width > 20 && (
                    <group scale={[1.4, 1.4, 1.4]} position={[width / 4, 0, -height / 2 + 1]}>
                        <Toilet x={0} z={0} rotation={0} />
                    </group>
                )}
            </group>
        )

    }

    return null;
}

function Toilet({ x, z, rotation }: { x: number; z: number; rotation: number }) {
    return (
        <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
            {/* Tank */}
            <mesh position={[0, 1.2, -0.6]} castShadow>
                <boxGeometry args={[0.8, 1, 0.4]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Seat/Bowl Base */}
            <mesh position={[0, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.35, 0.3, 0.8]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Bowl Top */}
            <mesh position={[0, 1.0, 0.1]}>
                <cylinderGeometry args={[0.35, 0.35, 0.1]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            {/* Lid */}
            <mesh position={[0, 1.05, -0.2]} rotation={[Math.PI / 6, 0, 0]}>
                <boxGeometry args={[0.7, 0.8, 0.05]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    );
}


// --- Updated Wall & Geometry Components ---

function WallWithGap({
    startX, startZ, endX, endZ,
    gapStart, gapEnd, openingType = 'door'
}: {
    startX: number; startZ: number; endX: number; endZ: number;
    gapStart?: number; gapEnd?: number; openingType?: 'door' | 'window';
}) {
    const length = Math.sqrt((endX - startX) ** 2 + (endZ - startZ) ** 2);
    const angle = Math.atan2(endZ - startZ, endX - startX);

    // Material for walls
    const wallMaterial = <meshStandardMaterial color="#FFFFFF" roughness={0.5} />;
    const capMaterial = <meshStandardMaterial color="#1a1a1a" roughness={0.8} />;

    // Helper to render wall segment with cap
    const WallSegment = ({ length, x, z, angle }: { length: number, x: number, z: number, angle: number }) => (
        <group position={[x, WALL_HEIGHT / 2, z]} rotation={[0, -angle, 0]}>
            <mesh castShadow receiveShadow>
                <boxGeometry args={[length, WALL_HEIGHT, WALL_THICKNESS]} />
                {wallMaterial}
            </mesh>
            {/* Black Cap */}
            <mesh position={[0, WALL_HEIGHT / 2 + 0.01, 0]}>
                <boxGeometry args={[length, 0.05, WALL_THICKNESS]} />
                {capMaterial}
            </mesh>
        </group>
    );

    // If no gap, render single wall
    if (gapStart === undefined || gapEnd === undefined) {
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;
        return <WallSegment length={length} x={centerX} z={centerZ} angle={angle} />;
    }

    // Render wall with gap
    const segments: React.ReactElement[] = [];
    const gapStartNorm = gapStart / length;
    const gapEndNorm = gapEnd / length;

    if (gapStartNorm > 0.01) {
        const seg1Length = gapStart;
        const seg1CenterX = startX + (Math.cos(angle) * seg1Length / 2);
        const seg1CenterZ = startZ + (Math.sin(angle) * seg1Length / 2);
        segments.push(<WallSegment key="seg1" length={seg1Length} x={seg1CenterX} z={seg1CenterZ} angle={angle} />);
    }

    if (gapEndNorm < 0.99) {
        const seg2Length = length - gapEnd;
        const seg2StartX = startX + (Math.cos(angle) * gapEnd);
        const seg2StartZ = startZ + (Math.sin(angle) * gapEnd);
        const seg2CenterX = seg2StartX + (Math.cos(angle) * seg2Length / 2);
        const seg2CenterZ = seg2StartZ + (Math.sin(angle) * seg2Length / 2);
        segments.push(<WallSegment key="seg2" length={seg2Length} x={seg2CenterX} z={seg2CenterZ} angle={angle} />);
    }

    // Header above door
    const doorTopHeight = openingType === 'door' ? WALL_HEIGHT - DOOR_HEIGHT : WALL_HEIGHT - (WINDOW_Y_OFFSET + WINDOW_HEIGHT);
    const openingHeight = openingType === 'door' ? DOOR_HEIGHT : WINDOW_HEIGHT;
    const openingY = openingType === 'door' ? 0 : WINDOW_Y_OFFSET;

    if (doorTopHeight > 0) {
        const gapCenterX = startX + (Math.cos(angle) * (gapStart + gapEnd) / 2);
        const gapCenterZ = startZ + (Math.sin(angle) * (gapStart + gapEnd) / 2);

        segments.push(
            <group key="header" position={[gapCenterX, openingY + openingHeight + doorTopHeight / 2, gapCenterZ]} rotation={[0, -angle, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[gapEnd - gapStart, doorTopHeight, WALL_THICKNESS]} />
                    {wallMaterial}
                </mesh>
                {/* Black Cap for header */}
                <mesh position={[0, doorTopHeight / 2 + 0.01, 0]}>
                    <boxGeometry args={[gapEnd - gapStart, 0.05, WALL_THICKNESS]} />
                    {capMaterial}
                </mesh>
            </group>
        );
    }

    // Sill below window
    if (openingType === 'window') {
        const gapCenterX = startX + (Math.cos(angle) * (gapStart + gapEnd) / 2);
        const gapCenterZ = startZ + (Math.sin(angle) * (gapStart + gapEnd) / 2);

        segments.push(
            <group key="sill" position={[gapCenterX, WINDOW_Y_OFFSET / 2, gapCenterZ]} rotation={[0, -angle, 0]}>
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[gapEnd - gapStart, WINDOW_Y_OFFSET, WALL_THICKNESS]} />
                    {wallMaterial}
                </mesh>
                {/* Black Cap for sill */}
                <mesh position={[0, WINDOW_Y_OFFSET / 2 + 0.01, 0]}>
                    <boxGeometry args={[gapEnd - gapStart, 0.05, WALL_THICKNESS]} />
                    {capMaterial}
                </mesh>
            </group>
        );
    }

    return <>{segments}</>;
}


// --- Main Room Component ---

function Room3D({ room, allRooms }: { room: RoomData; allRooms: RoomData[] }) {
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

    // Calculate Window Gaps (Before Walls)
    interface WindowGap { gapStart: number; gapEnd: number }
    let windowTop: WindowGap | undefined;
    let windowBottom: WindowGap | undefined;
    let windowLeft: WindowGap | undefined;
    let windowRight: WindowGap | undefined;

    // We assume 1 window centered per exterior wall
    const WINDOW_WIDTH = 40;

    if (isExterior && type !== 'entrance' && type !== 'public') {
        if (isExterior.top) {
            windows.push(<Window3D key="win-top" x={x + width / 2 - WINDOW_WIDTH / 2} y={y} width={WINDOW_WIDTH} isHorizontal={true} />);
            windowTop = getDoorGap(x1, x2, x + width / 2 - WINDOW_WIDTH / 2, WINDOW_WIDTH);
        }
        if (isExterior.bottom && type !== 'entrance') {
            windows.push(<Window3D key="win-bottom" x={x + width / 2 - WINDOW_WIDTH / 2} y={y + height} width={WINDOW_WIDTH} isHorizontal={true} />);
            windowBottom = getDoorGap(x1, x2, x + width / 2 - WINDOW_WIDTH / 2, WINDOW_WIDTH);
        }
        if (isExterior.left) {
            windows.push(<Window3D key="win-left" x={x} y={y + height / 2 - WINDOW_WIDTH / 2} width={WINDOW_WIDTH} isHorizontal={false} />);
            windowLeft = getDoorGap(z1, z2, y + height / 2 - WINDOW_WIDTH / 2, WINDOW_WIDTH);
        }
        if (isExterior.right) {
            windows.push(<Window3D key="win-right" x={x + width} y={y + height / 2 - WINDOW_WIDTH / 2} width={WINDOW_WIDTH} isHorizontal={false} />);
            windowRight = getDoorGap(z1, z2, y + height / 2 - WINDOW_WIDTH / 2, WINDOW_WIDTH);
        }
    }

    // --- Neighbor Detection to prevent Double Walls ---
    const EPSILON = 5;
    const intervalsOverlap = (a1: number, w1: number, a2: number, w2: number) => {
        return Math.max(a1, a2) < Math.min(a1 + w1, a2 + w2) - EPSILON;
    };




    // We prioritize Top and Left walls.
    // If we have a neighbor to the Right, THEY render their Left. We skip our Right.
    // Unless neighbor is Public (which renders nothing) or Entrance (which behaves normally but let's be safe).
    // Actually Public Area has NO internal walls. So if neighbor is Public, WE MUST render the wall.

    // Generate Walls (Top, Bottom, Left, Right)

    // --- Interval Subtraction Logic ---
    type Interval = { start: number; end: number };

    const subtractInterval = (intervals: Interval[], subStart: number, subEnd: number): Interval[] => {
        const result: Interval[] = [];
        for (const interval of intervals) {
            // No overlap
            if (subEnd <= interval.start || subStart >= interval.end) {
                result.push(interval);
                continue;
            }
            // Overlap logic
            if (subStart > interval.start) {
                result.push({ start: interval.start, end: subStart });
            }
            if (subEnd < interval.end) {
                result.push({ start: subEnd, end: interval.end });
            }
        }
        return result;
    };

    const getWallSegments = (side: 'top' | 'bottom' | 'left' | 'right', totalLength: number) => {
        // Find all neighbors on this side
        const neighbors = allRooms.filter(r => {
            if (r.id === room.id) return false;
            switch (side) {
                case 'top': return Math.abs(r.y + r.height - room.y) < EPSILON && intervalsOverlap(r.x, r.width, room.x, room.width);
                case 'bottom': return Math.abs(room.y + room.height - r.y) < EPSILON && intervalsOverlap(r.x, r.width, room.x, room.width);
                case 'left': return Math.abs(r.x + r.width - room.x) < EPSILON && intervalsOverlap(r.y, r.height, room.y, room.height);
                case 'right': return Math.abs(room.x + room.width - r.x) < EPSILON && intervalsOverlap(r.y, r.height, room.y, room.height);
            }
        });

        let segments: Interval[] = [{ start: 0, end: totalLength }];

        for (const neighbor of neighbors) {
            // Determine overlap relative to my wall
            let subStart = 0;
            let subEnd = 0;
            switch (side) {
                case 'top':
                case 'bottom':
                    // Horizontal overlap: relative to my x
                    subStart = Math.max(0, neighbor.x - room.x);
                    subEnd = Math.min(totalLength, (neighbor.x + neighbor.width) - room.x);
                    break;
                case 'left':
                case 'right':
                    // Vertical overlap: relative to my y
                    subStart = Math.max(0, neighbor.y - room.y);
                    subEnd = Math.min(totalLength, (neighbor.y + neighbor.height) - room.y);
                    break;
            }

            // Decide if we should subtract this neighbor (i.e. let NEIGHBOR handle the wall, or create OPEN gap)
            // Priority: Public Area generally DEFFERS to specific rooms, EXCEPT when filling voids.
            // But if I am Public, I FILL voids. So I only subtract if neighbor renders.
            // If I am Office, I RENDER potentially double wall if partial? No, Logic says:

            let subtract = false;

            const iAmPublic = type === 'public';
            const neighborIsPublic = neighbor.type === 'public';
            const iAmEntrance = type === 'entrance' || label === 'Main Entrance';
            const neighborIsEntrance = neighbor.type === 'entrance' || neighbor.label === 'Main Entrance';

            // Rule 1: Entrance touches Public (Open connection)
            if (iAmEntrance && neighborIsPublic) subtract = true; // Open
            else if (iAmPublic && neighborIsEntrance) subtract = true; // Open

            // Rule 2: Public vs Standard Room (Corridor walls)
            // Standard Room renders wall. Public subtracts.
            else if (iAmPublic && !neighborIsPublic) subtract = true;
            else if (!iAmPublic && neighborIsPublic) subtract = false; // I generate wall

            // Rule 3: Standard vs Standard (e.g. Office vs Office) - Top/Left Priority
            else {
                // If I am Top/Left, I render. If I am Bottom/Right, neighbor renders (I subtract).
                if (side === 'right' || side === 'bottom') subtract = true;
            }

            if (subtract) {
                segments = subtractInterval(segments, subStart, subEnd);
            }
        }

        // Final Filter: If I am Public, and I have 0 neighbors on a side?
        // My logic keeps the segment. So I render wall against void. Correct.
        // If I am Public, and I have neighbor covering 100%, segments=[]. Correct.

        // If I am Entrance (Bottom) vs Public (Top). I subtracted. segments=[]. No wall. Open. Correct.

        return segments;
    };

    // Generate Wall Meshes from Segments

    // Top
    const topSegments = getWallSegments('top', width);
    // Explicit exclusions still apply? NO, logic handles Entrance/Public relations now.
    // Except 'isExterior'. If isExterior.top, we ALWAYS render full width (or segments?).
    // Usually exterior has NO neighbors. So neighbors=[] -> segments=[0, width]. Correct.
    // What if isExterior is false, but neighbors=[]? (Gap in layout). We render. Correct.

    topSegments.forEach((seg, i) => {
        // Check for Door in this segment
        const segmentAbsX1 = x1 + seg.start * SCALE;
        const segmentAbsX2 = x1 + seg.end * SCALE;

        let localDoor: { gapStart: number, gapEnd: number, type: 'door' | 'window' } | null = null;

        // Door logic (Top)
        if (door && door.direction === 'top') {
            // Is door within this segment?
            const dStart = door.x;

            // Relative to room x
            const relStart = dStart - room.x;
            const relEnd = relStart + 40;

            if (relStart >= seg.start - 1 && relEnd <= seg.end + 1) {
                localDoor = {
                    gapStart: (relStart - seg.start) * SCALE,
                    gapEnd: (relEnd - seg.start) * SCALE,
                    type: 'door'
                };
            }
        }
        // Window logic (Top)
        if (isExterior?.top && windowTop) {
            // Window is centered. width 40.
            const wCenter = width / 2;
            const wStart = wCenter - 20;
            const wEnd = wCenter + 20;
            if (wStart >= seg.start - 1 && wEnd <= seg.end + 1) {
                // Re-calculate local gap
                localDoor = {
                    gapStart: (wStart - seg.start) * SCALE,
                    gapEnd: (wEnd - seg.start) * SCALE,
                    type: 'window'
                };
            }
        }

        walls.push(<WallWithGap key={`top-${i}`} startX={segmentAbsX1} startZ={z1} endX={segmentAbsX2} endZ={z1}
            gapStart={localDoor?.gapStart} gapEnd={localDoor?.gapEnd} openingType={localDoor?.type} />);
    });


    // Bottom
    const bottomSegments = getWallSegments('bottom', width);
    bottomSegments.forEach((seg, i) => {
        const segmentAbsX1 = x1 + seg.start * SCALE;
        const segmentAbsX2 = x1 + seg.end * SCALE;
        let localDoor: { gapStart: number, gapEnd: number, type: 'door' | 'window' } | null = null;

        if (door && door.direction === 'bottom') {
            const relStart = door.x - room.x;
            const relEnd = relStart + 40;
            if (relStart >= seg.start - 1 && relEnd <= seg.end + 1) {
                localDoor = { gapStart: (relStart - seg.start) * SCALE, gapEnd: (relEnd - seg.start) * SCALE, type: 'door' };
            }
        }
        if (isExterior?.bottom && windowBottom) {
            const wCenter = width / 2;
            const wStart = wCenter - 20;
            const wEnd = wCenter + 20;
            if (wStart >= seg.start - 1 && wEnd <= seg.end + 1) {
                localDoor = { gapStart: (wStart - seg.start) * SCALE, gapEnd: (wEnd - seg.start) * SCALE, type: 'window' };
            }
        }
        walls.push(<WallWithGap key={`bottom-${i}`} startX={segmentAbsX1} startZ={z2} endX={segmentAbsX2} endZ={z2}
            gapStart={localDoor?.gapStart} gapEnd={localDoor?.gapEnd} openingType={localDoor?.type} />);
    });


    // Left
    const leftSegments = getWallSegments('left', height);
    leftSegments.forEach((seg, i) => {
        const segmentAbsZ1 = z1 + seg.start * SCALE;
        const segmentAbsZ2 = z1 + seg.end * SCALE;
        let localDoor: { gapStart: number, gapEnd: number, type: 'door' | 'window' } | null = null;

        if (door && door.direction === 'left') {
            const relStart = door.y - room.y;
            const relEnd = relStart + 40;
            if (relStart >= seg.start - 1 && relEnd <= seg.end + 1) {
                localDoor = { gapStart: (relStart - seg.start) * SCALE, gapEnd: (relEnd - seg.start) * SCALE, type: 'door' };
            }
        }
        if (isExterior?.left && windowLeft) {
            const wCenter = height / 2;
            const wStart = wCenter - 20;
            const wEnd = wCenter + 20;
            if (wStart >= seg.start - 1 && wEnd <= seg.end + 1) {
                localDoor = { gapStart: (wStart - seg.start) * SCALE, gapEnd: (wEnd - seg.start) * SCALE, type: 'window' };
            }
        }
        walls.push(<WallWithGap key={`left-${i}`} startX={x1} startZ={segmentAbsZ1} endX={x1} endZ={segmentAbsZ2}
            gapStart={localDoor?.gapStart} gapEnd={localDoor?.gapEnd} openingType={localDoor?.type} />);
    });


    // Right
    const rightSegments = getWallSegments('right', height);
    rightSegments.forEach((seg, i) => {
        const segmentAbsZ1 = z1 + seg.start * SCALE;
        const segmentAbsZ2 = z1 + seg.end * SCALE;
        let localDoor: { gapStart: number, gapEnd: number, type: 'door' | 'window' } | null = null;

        if (door && door.direction === 'right') {
            const relStart = door.y - room.y;
            const relEnd = relStart + 40;
            if (relStart >= seg.start - 1 && relEnd <= seg.end + 1) {
                localDoor = { gapStart: (relStart - seg.start) * SCALE, gapEnd: (relEnd - seg.start) * SCALE, type: 'door' };
            }
        }
        if (isExterior?.right && windowRight) {
            const wCenter = height / 2;
            const wStart = wCenter - 20;
            const wEnd = wCenter + 20;
            if (wStart >= seg.start - 1 && wEnd <= seg.end + 1) {
                localDoor = { gapStart: (wStart - seg.start) * SCALE, gapEnd: (wEnd - seg.start) * SCALE, type: 'window' };
            }
        }
        walls.push(<WallWithGap key={`right-${i}`} startX={x2} startZ={segmentAbsZ1} endX={x2} endZ={segmentAbsZ2}
            gapStart={localDoor?.gapStart} gapEnd={localDoor?.gapEnd} openingType={localDoor?.type} />);
    });



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

// Helper to find nearest wall for device
const snapToWall = (x: number, y: number, rooms: RoomData[]) => {
    let nearestDist = Infinity;
    let newX = x;
    let newY = y;
    let rotation = 0;

    const SNAP_DIST = 40; // Pixel distance to snap

    rooms.forEach(room => {
        // Left wall
        if (Math.abs(x - room.x) < SNAP_DIST && y >= room.y && y <= room.y + room.height) {
            if (Math.abs(x - room.x) < nearestDist) {
                nearestDist = Math.abs(x - room.x);
                newX = room.x;
                newY = y;
                rotation = -Math.PI / 2; // Face right
            }
        }
        // Right wall
        if (Math.abs(x - (room.x + room.width)) < SNAP_DIST && y >= room.y && y <= room.y + room.height) {
            if (Math.abs(x - (room.x + room.width)) < nearestDist) {
                nearestDist = Math.abs(x - (room.x + room.width));
                newX = room.x + room.width;
                newY = y;
                rotation = Math.PI / 2; // Face left
            }
        }
        // Top wall
        if (Math.abs(y - room.y) < SNAP_DIST && x >= room.x && x <= room.x + room.width) {
            if (Math.abs(y - room.y) < nearestDist) {
                nearestDist = Math.abs(y - room.y);
                newX = x;
                newY = room.y;
                rotation = Math.PI; // Face down
            }
        }
        // Bottom wall
        if (Math.abs(y - (room.y + room.height)) < SNAP_DIST && x >= room.x && x <= room.x + room.width) {
            if (Math.abs(y - (room.y + room.height)) < nearestDist) {
                nearestDist = Math.abs(y - (room.y + room.height));
                newX = x;
                newY = room.y + room.height;
                rotation = 0; // Face up
            }
        }
    });

    if (nearestDist < SNAP_DIST) {
        // Push slightly into room to avoid z-fighting with wall
        const offset = 2.0; // 2 units in 3D scale (approx)
        if (rotation === 0) newY -= offset;
        if (rotation === Math.PI) newY += offset;
        if (rotation === Math.PI / 2) newX -= offset;
        if (rotation === -Math.PI / 2) newX += offset;

        return { x: newX, y: newY, rotation, isWall: true };
    }

    return { x, y, rotation: 0, isWall: false };
};

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
function Sounder3D({ x, y, isActivated, onClick, rooms }: { x: number; y: number; isActivated: boolean; onClick?: () => void, rooms: RoomData[] }) {
    const { x: finalX, y: finalY, rotation, isWall } = useMemo(() => snapToWall(x, y, rooms), [x, y, rooms]);
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current && isActivated) {
            // Pulse animation
            const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
            groupRef.current.scale.setScalar(scale);
        } else if (groupRef.current) {
            groupRef.current.scale.setScalar(1);
        }
    });

    return (
        <group
            ref={groupRef}
            position={[finalX * SCALE, isWall ? WALL_HEIGHT * 0.7 : WALL_HEIGHT * 0.7, finalY * SCALE]}
            rotation={[0, rotation + Math.PI, 0]} // Face outward from wall
        >
            <mesh onClick={onClick} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.2, 1.4, 1.0, 32]} />
                <meshStandardMaterial color={isActivated ? '#ef4444' : '#f97316'} roughness={0.2} />
            </mesh>
            {/* Grill */}
            <mesh position={[0, 0, 0.51]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[1.8, 0.2, 0.1]} />
                <meshStandardMaterial color="#c2410c" />
            </mesh>
            <mesh position={[0, 0, 0.51]} rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[1.8, 0.2, 0.1]} />
                <meshStandardMaterial color="#c2410c" />
            </mesh>
            {isActivated && <pointLight color="#FF0000" intensity={2} distance={15} />}
        </group>
    )
}

function MCP3D({ x, y, isActivated, onClick, rooms }: { x: number; y: number; isActivated: boolean; onClick?: () => void, rooms: RoomData[] }) {
    const { x: finalX, y: finalY, rotation, isWall } = useMemo(() => snapToWall(x, y, rooms), [x, y, rooms]);

    return (
        <group
            position={[finalX * SCALE, isWall ? WALL_HEIGHT * 0.4 : WALL_HEIGHT * 0.4, finalY * SCALE]}
            rotation={[0, rotation, 0]}
        >
            {/* Mounting Box */}
            <mesh position={[0, 0, -0.3]}>
                <boxGeometry args={[2, 2.5, 0.5]} />
                <meshStandardMaterial color="#991b1b" />
            </mesh>
            {/* Main Body */}
            <mesh onClick={onClick}>
                <boxGeometry args={[1.8, 2.2, 0.5]} />
                <meshStandardMaterial color="#dc2626" roughness={0.3} />
            </mesh>
            {/* White Element */}
            <mesh position={[0, 0, 0.26]}>
                <boxGeometry args={[0.8, 0.8, 0.05]} />
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
            {/* Glass - Simplified for better transparency */}
            <mesh>
                <boxGeometry args={[w, WINDOW_HEIGHT, d * 0.5]} />
                <meshStandardMaterial
                    color="#bae6fd"
                    transparent
                    opacity={0.3}
                    roughness={0}
                    metalness={0.9}
                    emissive="#bae6fd"
                    emissiveIntensity={0.2}
                />
            </mesh>
            {/* Frame - Outer */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[w + 0.2, WINDOW_HEIGHT + 0.2, d]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            {/* Only show frame edge, hack by using inner cutout? No, simple box frame is fine if we make glass thinner inside */}
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
                <Room3D key={room.id} room={room} allRooms={rooms} />
            ))}

            {/* Devices */}
            {detectors.filter(d => !d.mountedOnSocketId).map(d => (
                <Detector3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedDevices.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} />
            ))}
            {sounders.map(d => (
                <Sounder3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedSounders.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} rooms={rooms} />
            ))}
            {mcps.map(d => (
                <MCP3D key={d.instanceId} x={d.x} y={d.y} isActivated={activatedDevices.has(d.instanceId)} onClick={() => onDeviceClick?.(d.instanceId)} rooms={rooms} />
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
