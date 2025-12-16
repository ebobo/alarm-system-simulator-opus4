import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import FloorPlanViewer from './components/FloorPlanViewer';
import Sidebar from './components/Sidebar';
import DevicePalette from './components/DevicePalette';
import ConfigModal from './components/ConfigModal';
import { generateFloorPlan, defaultConfig } from './utils/floorPlanGenerator';
import { useCoordinates } from './hooks/useCoordinates';
import { generateInstanceId, generateSerialNumber, getDeviceType } from './types/devices';
import DevicePropertyPanel from './components/DevicePropertyPanel';
import type { RoomConfig } from './utils/floorPlanGenerator';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire } from './types/devices';

// SVG Drag preview component - shows the device icon
function DeviceDragPreview({ deviceTypeId }: { deviceTypeId: string | null }) {
  if (deviceTypeId === 'loop-driver') {
    // Loop driver preview - rectangle with 2 terminals
    return (
      <svg width="60" height="40" viewBox="-30 -20 60 40" className="drop-shadow-lg">
        <rect x="-28" y="-18" width="56" height="36" rx="3" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
        <rect x="-20" y="-10" width="40" height="20" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">LD</text>
        {/* Terminals - 1 top centered, 1 bottom centered */}
        <circle cx="0" cy="-18" r="4" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
        <circle cx="0" cy="18" r="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
      </svg>
    );
  }

  // Default - detector preview (circle)
  return (
    <svg width="60" height="60" viewBox="-30 -30 60 60" className="drop-shadow-lg">
      {/* Outer circle */}
      <circle r="25" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
      {/* Inner circle */}
      <circle r="16" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
      {/* Center indicator */}
      <circle r="6" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
      {/* Center dot */}
      <circle r="2" fill="#64748B" />
      {/* Terminals */}
      <circle cx="0" cy="-22" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="22" cy="0" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="0" cy="22" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
      <circle cx="-22" cy="0" r="4" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
    </svg>
  );
}

function App() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<RoomConfig>(defaultConfig);

  // Device placement state
  const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number } | null>(null);

  // Wire connection state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawingWire, setDrawingWire] = useState<DrawingWire | null>(null);

  // Projection position (where the device will land)
  const [projectionPosition, setProjectionPosition] = useState<{ x: number; y: number } | null>(null);

  // Alignment guides for snapping
  const [alignmentGuides, setAlignmentGuides] = useState<{ horizontal: number | null; vertical: number | null }>({ horizontal: null, vertical: null });

  // Viewport state
  const [viewportTransform, setViewportTransform] = useState<ViewportTransform>({
    scale: 1,
    positionX: 0,
    positionY: 0,
  });

  // Refs for coordinate conversion
  const containerRef = useRef<HTMLDivElement>(null);
  const { screenToFloorPlan } = useCoordinates();

  // Configure drag sensor with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    })
  );

  // Generate floor plan on initial load
  useEffect(() => {
    const initialPlan = generateFloorPlan(defaultConfig);
    setSvgContent(initialPlan);
  }, []);

  const handleGenerate = () => {
    const newPlan = generateFloorPlan(config);
    setSvgContent(newPlan);
    setPlacedDevices([]);
    setSelectedDeviceId(null);
  };

  const handleConfigApply = (newConfig: RoomConfig) => {
    setConfig(newConfig);
    const newPlan = generateFloorPlan(newConfig);
    setSvgContent(newPlan);
    setPlacedDevices([]);
    setSelectedDeviceId(null);
  };

  // Handle viewport transform changes from FloorPlanViewer
  const handleTransformChange = useCallback((transform: ViewportTransform) => {
    setViewportTransform(transform);
  }, []);

  // Helper to get floor plan container rect
  const getContainerRect = () => {
    const container = document.querySelector('[data-floor-plan-container]');
    return container?.getBoundingClientRect() ?? null;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;
    setActiveDragId(id);

    // If dragging a placed device, select it
    if (id.startsWith('placed-')) {
      const instanceId = id.replace('placed-', '');
      setSelectedDeviceId(instanceId);
    }
  };

  // Handle drag move - update projection position
  const handleDragMove = (event: DragMoveEvent) => {
    const { activatorEvent, delta } = event;
    const pointerEvent = activatorEvent as PointerEvent;
    if (!pointerEvent) return;

    // Update drag delta
    setDragDelta({ x: delta.x, y: delta.y });

    const containerRect = getContainerRect();
    if (!containerRect) return;

    // Calculate current pointer position
    const currentX = pointerEvent.clientX + delta.x;
    const currentY = pointerEvent.clientY + delta.y;

    // Check if pointer is over the floor plan
    if (
      currentX >= containerRect.left &&
      currentX <= containerRect.right &&
      currentY >= containerRect.top &&
      currentY <= containerRect.bottom
    ) {
      // Convert to plan coordinates
      const planCoords = screenToFloorPlan(currentX, currentY, viewportTransform, containerRect);

      // Calculate snapping
      const SNAP_THRESHOLD = 5; // units in plan coordinates
      let snappedX = planCoords.x;
      let snappedY = planCoords.y;
      let guideX: number | null = null;
      let guideY: number | null = null;

      // Find alignment candidates excluding the currently dragged device (if it exists)
      const currentDragInstanceId = activeDragId?.startsWith('placed-') ? activeDragId.replace('placed-', '') : null;

      for (const device of placedDevices) {
        if (device.instanceId === currentDragInstanceId) continue;

        // Horizontal alignment (match Y)
        const distY = Math.abs(device.y - planCoords.y);
        if (distY < SNAP_THRESHOLD) {
          snappedY = device.y;
          guideY = device.y;
        }

        // Vertical alignment (match X)
        const distX = Math.abs(device.x - planCoords.x);
        if (distX < SNAP_THRESHOLD) {
          snappedX = device.x;
          guideX = device.x;
        }
      }

      setProjectionPosition({ x: snappedX, y: snappedY });
      setAlignmentGuides({ horizontal: guideY, vertical: guideX });

    } else {
      setProjectionPosition(null);
      setAlignmentGuides({ horizontal: null, vertical: null });
    }
  };

  // Handle drag end - place or move device
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const id = active.id as string;

    setActiveDragId(null);
    setProjectionPosition(null);
    setDragDelta(null);
    setAlignmentGuides({ horizontal: null, vertical: null });

    const containerRect = getContainerRect();
    if (!containerRect) return;

    // Get final pointer position
    const pointerEvent = event.activatorEvent as PointerEvent;
    if (!pointerEvent) return;

    const dropX = pointerEvent.clientX + delta.x;
    const dropY = pointerEvent.clientY + delta.y;

    // Check if dropped on floor plan area
    const isOverFloorPlan =
      dropX >= containerRect.left &&
      dropX <= containerRect.right &&
      dropY >= containerRect.top &&
      dropY <= containerRect.bottom;

    if (!isOverFloorPlan && !over) {
      // If moving a placed device outside the floor plan, delete it
      if (id.startsWith('placed-')) {
        const instanceId = id.replace('placed-', '');
        setPlacedDevices(prev => prev.filter(d => d.instanceId !== instanceId));
        setSelectedDeviceId(null);
      }
      return;
    }

    // Convert to plan coordinates
    const planCoords = screenToFloorPlan(dropX, dropY, viewportTransform, containerRect);

    // Apply snapping logic (same as handleDragMove)
    const SNAP_THRESHOLD = 5;
    let finalX = planCoords.x;
    let finalY = planCoords.y;

    // Calculate snapping if we have alignment candidates
    const currentDragInstanceId = id.startsWith('placed-') ? id.replace('placed-', '') : null;

    for (const device of placedDevices) {
      if (device.instanceId === currentDragInstanceId) continue;

      // Horizontal alignment (match Y)
      const distY = Math.abs(device.y - planCoords.y);
      if (distY < SNAP_THRESHOLD) {
        finalY = device.y;
      }

      // Vertical alignment (match X)
      const distX = Math.abs(device.x - planCoords.x);
      if (distX < SNAP_THRESHOLD) {
        finalX = device.x;
      }
    }

    if (id.startsWith('palette-')) {
      // Adding new device from palette
      const deviceTypeId = id.replace('palette-', '');
      const deviceType = getDeviceType(deviceTypeId);
      if (!deviceType) return;

      // Determine the device type label based on category
      const getDeviceTypeLabel = () => {
        if (deviceTypeId === 'loop-driver') return 'BSD-1000';
        if (deviceTypeId === 'autroguard-base') return 'AG socket';
        return deviceType.name;
      };

      const newDevice: PlacedDevice = {
        instanceId: generateInstanceId(),
        typeId: deviceTypeId,
        x: finalX,
        y: finalY,
        rotation: 0,
        // Initialize device properties
        deviceType: getDeviceTypeLabel(),
        deviceId: null,
        cAddress: null,
        label: '',
        sn: generateSerialNumber(),
        ipAddress: deviceTypeId === 'loop-driver' ? '' : undefined,
      };

      setPlacedDevices(prev => [...prev, newDevice]);
      setSelectedDeviceId(newDevice.instanceId);
    } else if (id.startsWith('placed-')) {
      // Moving existing device
      const instanceId = id.replace('placed-', '');
      setPlacedDevices(prev =>
        prev.map(device =>
          device.instanceId === instanceId
            ? { ...device, x: finalX, y: finalY }
            : device
        )
      );
    }
  };

  // Handle device click for selection
  const handleDeviceClick = (instanceId: string) => {
    setSelectedDeviceId(prev => (prev === instanceId ? null : instanceId));
  };

  // Handle device property updates
  const handleUpdateDevice = useCallback((updatedDevice: PlacedDevice) => {
    setPlacedDevices(prev =>
      prev.map(device =>
        device.instanceId === updatedDevice.instanceId ? updatedDevice : device
      )
    );
  }, []);

  // Handle wire start
  const handleWireStart = (deviceId: string, terminalId: string, e: React.PointerEvent) => {
    // Convert screen coordinates to plan coordinates for the initial end position
    const containerRect = getContainerRect();
    if (!containerRect) return;

    const planCoords = screenToFloorPlan(e.clientX, e.clientY, viewportTransform, containerRect);

    setDrawingWire({
      startDeviceId: deviceId,
      startTerminalId: terminalId,
      endX: planCoords.x,
      endY: planCoords.y,
    });
  };

  // Handle wire end (complete connection)
  const handleWireEnd = (deviceId: string, terminalId: string) => {
    if (!drawingWire) return;

    // Don't connect to self or same device
    if (drawingWire.startDeviceId === deviceId) {
      setDrawingWire(null);
      return;
    }

    // Check if ANY connection already exists between these two devices
    // The user requested: "one detetcor can only connetor to another detecor once"
    const devicesAlreadyConnected = connections.some(c =>
      (c.fromDeviceId === drawingWire.startDeviceId && c.toDeviceId === deviceId) ||
      (c.fromDeviceId === deviceId && c.toDeviceId === drawingWire.startDeviceId)
    );

    if (devicesAlreadyConnected) {
      console.log("Devices already connected, skipping duplicate connection.");
      setDrawingWire(null);
      return;
    }

    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      fromDeviceId: drawingWire.startDeviceId,
      fromTerminalId: drawingWire.startTerminalId,
      toDeviceId: deviceId,
      toTerminalId: terminalId,
    };
    setConnections(prev => [...prev, newConnection]);

    setDrawingWire(null);
  };

  // Global pointer move for wire drawing
  // attached to the main container
  const handlePointerMove = (e: React.PointerEvent) => {
    if (drawingWire) {
      const containerRect = getContainerRect();
      if (!containerRect) return;
      const planCoords = screenToFloorPlan(e.clientX, e.clientY, viewportTransform, containerRect);

      setDrawingWire(prev => prev ? {
        ...prev,
        endX: planCoords.x,
        endY: planCoords.y
      } : null);
    }
  };

  // Global pointer up to cancel wire if released elsewhere
  const handlePointerUp = () => {
    if (drawingWire) {
      setDrawingWire(null);
    }
  };

  // Check if we're actively dragging and get the device type being dragged
  const isDragging = activeDragId !== null;
  const getDraggedDeviceTypeId = (): string | null => {
    if (!activeDragId) return null;
    if (activeDragId.startsWith('palette-')) {
      return activeDragId.replace('palette-', '');
    }
    if (activeDragId.startsWith('placed-')) {
      const instanceId = activeDragId.replace('placed-', '');
      const device = placedDevices.find(d => d.instanceId === instanceId);
      return device?.typeId || null;
    }
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div
        className="h-screen flex bg-gray-100"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Left Sidebar */}
        <Sidebar
          onGenerate={handleGenerate}
          onOpenConfig={() => setIsConfigOpen(true)}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Floor Plan Viewer</h2>
              <p className="text-xs text-gray-500">
                {config.offices} offices • {config.meetingRooms} meeting rooms • {config.toilets} toilets
                {placedDevices.length > 0 && ` • ${placedDevices.length} device${placedDevices.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stage 2</span>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 p-4">
            <FloorPlanViewer
              svgContent={svgContent}
              placedDevices={placedDevices}
              selectedDeviceId={selectedDeviceId}
              activeDragId={activeDragId}
              projectionPosition={projectionPosition}
              projectionDeviceTypeId={getDraggedDeviceTypeId()}
              onTransformChange={handleTransformChange}
              onDeviceClick={handleDeviceClick}
              connections={connections}
              drawingWire={drawingWire}
              onWireStart={handleWireStart}
              onWireEnd={handleWireEnd}
              dragDelta={dragDelta}
              alignmentGuides={alignmentGuides}
            />
          </div>
        </div>

        {/* Right Sidebar - Device Palette and Property Panel */}
        <div className="w-64 flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 border-l border-slate-700">
          <div className="flex-1 overflow-hidden">
            <DevicePalette />
          </div>
          <DevicePropertyPanel
            selectedDevice={placedDevices.find(d => d.instanceId === selectedDeviceId) || null}
            onUpdateDevice={handleUpdateDevice}
          />
        </div>

        {/* Config Modal */}
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onApply={handleConfigApply}
          initialConfig={config}
        />
      </div>

      {/* Drag Overlay - shows the device icon while dragging */}
      <DragOverlay dropAnimation={null}>
        {isDragging && <DeviceDragPreview deviceTypeId={getDraggedDeviceTypeId()} />}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
