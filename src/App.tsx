import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import FloorPlanViewer from './components/FloorPlanViewer';
import Sidebar from './components/Sidebar';
import DevicePalette from './components/DevicePalette';
import ConfigModal from './components/ConfigModal';
import SaveNameDialog from './components/SaveNameDialog';
import { generateFloorPlan, defaultConfig } from './utils/floorPlanGenerator';
import { useCoordinates } from './hooks/useCoordinates';
import { generateInstanceId, generateSerialNumber, getDeviceType } from './types/devices';
import DevicePropertyPanel from './components/DevicePropertyPanel';
import { saveProject, loadProject, deleteProject, getProjectList, generateProjectId, getMostRecentProject } from './utils/storage';
import { exportToExcel } from './utils/excelExport';
import type { RoomConfig } from './utils/floorPlanGenerator';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire, RoomInfo } from './types/devices';
import type { ProjectListEntry } from './types/storage';

// SVG Drag preview component - shows the device icon
function DeviceDragPreview({ deviceTypeId }: { deviceTypeId: string | null }) {
  if (deviceTypeId === 'loop-driver') {
    // Loop driver preview - rectangle with terminals on left, right, bottom
    return (
      <svg width="50" height="30" viewBox="-25 -15 50 30" className="drop-shadow-lg">
        <rect x="-23" y="-13" width="46" height="26" rx="3" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
        <rect x="-15" y="-7" width="30" height="14" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">LD</text>
        {/* Terminals - left, right, bottom */}
        <circle cx="-23" cy="0" r="4" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
        <circle cx="23" cy="0" r="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" />
        <circle cx="0" cy="13" r="4" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
      </svg>
    );
  }

  if (deviceTypeId === 'mcp') {
    // MCP preview - red square with cross pattern
    return (
      <svg width="35" height="35" viewBox="-17.5 -17.5 35 35" className="drop-shadow-lg">
        <rect x="-15" y="-15" width="30" height="30" rx="3" fill="#DC2626" stroke="#991B1B" strokeWidth="2" />
        <rect x="-10" y="-10" width="20" height="20" rx="2" fill="#FECACA" stroke="#B91C1C" strokeWidth="1" />
        {/* Cross pattern */}
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#991B1B" strokeWidth="2" />
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#991B1B" strokeWidth="2" />
        {/* Terminals */}
        <circle cx="0" cy="-15" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="15" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="0" cy="15" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="-15" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      </svg>
    );
  }

  if (deviceTypeId === 'sounder') {
    // Sounder preview - orange circle with sound waves
    return (
      <svg width="38" height="38" viewBox="-19 -19 38 38" className="drop-shadow-lg">
        <circle r="17" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
        <circle r="11" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.5" />
        {/* Sound wave arcs */}
        <path d="M -4 -2 Q -6 0 -4 2" fill="none" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 4 -2 Q 6 0 4 2" fill="none" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" />
        <circle r="3" fill="#EA580C" />
        {/* Terminals */}
        <circle cx="0" cy="-17" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="17" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="0" cy="17" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
        <circle cx="-17" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      </svg>
    );
  }

  // Default - detector preview (circle)
  return (
    <svg width="40" height="40" viewBox="-20 -20 40 40" className="drop-shadow-lg">
      {/* Outer circle */}
      <circle r="18" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
      {/* Inner circle */}
      <circle r="12" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
      {/* Center indicator */}
      <circle r="4" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1" />
      {/* Center dot */}
      <circle r="1.5" fill="#64748B" />
      {/* Terminals */}
      <circle cx="0" cy="-16" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      <circle cx="16" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      <circle cx="0" cy="16" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
      <circle cx="-16" cy="0" r="3" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
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
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);

  // Room selection state
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null);

  // Save/Load state
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [showNewProjectConfirm, setShowNewProjectConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveNameDialog, setShowSaveNameDialog] = useState(false);

  // Project management state
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState('Generated Plan');
  const [projectList, setProjectList] = useState<ProjectListEntry[]>([]);

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

  // Refs to track latest state for save function (fixes stale closure issue)
  const latestStateRef = useRef({
    config,
    svgContent,
    placedDevices,
    connections,
  });

  // Keep refs in sync with state
  useEffect(() => {
    latestStateRef.current = {
      config,
      svgContent,
      placedDevices,
      connections,
    };
  }, [config, svgContent, placedDevices, connections]);

  // Configure drag sensor with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    })
  );

  // Load saved project or generate default on initial load
  useEffect(() => {
    // Load project list first
    const list = getProjectList();
    setProjectList(list);

    // Load most recent project or generate default
    const savedProject = getMostRecentProject();
    if (savedProject) {
      setConfig(savedProject.config);
      setSvgContent(savedProject.svgContent);
      setPlacedDevices(savedProject.placedDevices);
      setConnections(savedProject.connections);
      setCurrentProjectId(savedProject.id);
      setCurrentProjectName(savedProject.name);
    } else {
      const initialPlan = generateFloorPlan(defaultConfig);
      setSvgContent(initialPlan);
      setCurrentProjectId(null);
      setCurrentProjectName('Generated Plan');
    }
  }, []);

  const handleGenerate = () => {
    const newPlan = generateFloorPlan(config);
    setSvgContent(newPlan);
    setPlacedDevices([]);
    setConnections([]);
    setSelectedDeviceId(null);
    // Reset to new unsaved project
    setCurrentProjectId(null);
    setCurrentProjectName('Generated Plan');
  };

  const handleConfigApply = (newConfig: RoomConfig) => {
    setConfig(newConfig);
    const newPlan = generateFloorPlan(newConfig);
    setSvgContent(newPlan);
    setPlacedDevices([]);
    setConnections([]);
    setSelectedDeviceId(null);
    // Reset to unsaved state
    setCurrentProjectId(null);
    setCurrentProjectName('Generated Plan');
  };

  // Handle save button click
  const handleSave = () => {
    // If project name is "Generated Plan", show dialog to get name
    if (currentProjectName === 'Generated Plan') {
      setShowSaveNameDialog(true);
    } else {
      // Save with existing name
      doSaveProject(currentProjectId!, currentProjectName);
    }
  };

  // Actually save the project with a name
  const doSaveProject = (id: string, name: string) => {
    try {
      const { config: currentConfig, svgContent: currentSvg, placedDevices: currentDevices, connections: currentConnections } = latestStateRef.current;
      saveProject({
        id,
        name,
        config: currentConfig,
        svgContent: currentSvg,
        placedDevices: currentDevices,
        connections: currentConnections,
      });
      setCurrentProjectId(id);
      setCurrentProjectName(name);
      setProjectList(getProjectList());
      setSaveNotification('Project saved!');
      setTimeout(() => setSaveNotification(null), 2000);
    } catch {
      setSaveNotification('Failed to save!');
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  // Handle save with name from dialog
  const handleSaveWithName = (name: string) => {
    const id = currentProjectId || generateProjectId();
    doSaveProject(id, name);
    setShowSaveNameDialog(false);
  };

  // Start new project (with confirmation)
  const handleNewProject = () => {
    if (placedDevices.length > 0 || connections.length > 0) {
      setShowNewProjectConfirm(true);
    } else {
      setIsConfigOpen(true);
    }
  };

  const confirmNewProject = () => {
    setShowNewProjectConfirm(false);
    setIsConfigOpen(true);
  };

  // Delete saved project
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (currentProjectId) {
      deleteProject(currentProjectId);
      setProjectList(getProjectList());
    }
    setShowDeleteConfirm(false);
    // Reset to default state
    setConfig(defaultConfig);
    const newPlan = generateFloorPlan(defaultConfig);
    setSvgContent(newPlan);
    setPlacedDevices([]);
    setConnections([]);
    setSelectedDeviceId(null);
    setCurrentProjectId(null);
    setCurrentProjectName('Generated Plan');
    setSaveNotification('Project deleted');
    setTimeout(() => setSaveNotification(null), 2000);
  };

  // Handle export to Excel
  const handleExport = () => {
    try {
      exportToExcel(currentProjectName, svgContent);
      setSaveNotification('Exported to Excel!');
      setTimeout(() => setSaveNotification(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setSaveNotification('Export failed!');
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  // Handle selecting a project from the sidebar
  const handleSelectProject = (id: string) => {
    const project = loadProject(id);
    if (project) {
      setConfig(project.config);
      setSvgContent(project.svgContent);
      setPlacedDevices(project.placedDevices);
      setConnections(project.connections);
      setCurrentProjectId(project.id);
      setCurrentProjectName(project.name);
      setSelectedDeviceId(null);
    }
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
      setSelectedWireId(null);   // Deselect wire when placing device
      setSelectedRoom(null);     // Deselect room when placing device
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
    setSelectedWireId(null); // Deselect wire when selecting device
    setSelectedRoom(null);   // Deselect room when selecting device
  };

  // Handle wire click for selection
  const handleWireClick = (wireId: string) => {
    setSelectedWireId(prev => (prev === wireId ? null : wireId));
    setSelectedDeviceId(null); // Deselect device when selecting wire
    setSelectedRoom(null);     // Deselect room when selecting wire
  };

  // Handle room click for selection
  const handleRoomClick = (roomInfo: RoomInfo) => {
    setSelectedRoom(prev => (prev?.id === roomInfo.id ? null : roomInfo));
    setSelectedDeviceId(null); // Deselect device when selecting room
    setSelectedWireId(null);   // Deselect wire when selecting room
  };

  // Handle floor plan empty area click - deselect all
  const handleFloorPlanClick = () => {
    setSelectedDeviceId(null);
    setSelectedWireId(null);
    setSelectedRoom(null);
  };

  // Handle Delete key to remove selected wire or device
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input
        if ((e.target as HTMLElement).tagName === 'INPUT') return;

        // Delete selected wire
        if (selectedWireId) {
          setConnections(prev => prev.filter(c => c.id !== selectedWireId));
          setSelectedWireId(null);
        }

        // Delete selected device and its connected wires
        if (selectedDeviceId) {
          // Remove all connections to/from this device
          setConnections(prev => prev.filter(c =>
            c.fromDeviceId !== selectedDeviceId && c.toDeviceId !== selectedDeviceId
          ));
          // Remove the device
          setPlacedDevices(prev => prev.filter(d => d.instanceId !== selectedDeviceId));
          setSelectedDeviceId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, selectedDeviceId]);

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
          onExport={handleExport}
          projectList={projectList}
          currentProjectId={currentProjectId}
          currentProjectName={currentProjectName}
          onSelectProject={handleSelectProject}
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
            <div className="flex items-center gap-3">
              {/* Save notification */}
              {saveNotification && (
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${saveNotification.includes('Failed')
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
                  }`}>
                  {saveNotification}
                </span>
              )}

              <button
                onClick={handleNewProject}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                New
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Viewer */}
          <div className="flex-1 p-4" onClick={handleFloorPlanClick}>
            <FloorPlanViewer
              svgContent={svgContent}
              placedDevices={placedDevices}
              selectedDeviceId={selectedDeviceId}
              selectedWireId={selectedWireId}
              selectedRoomId={selectedRoom?.id ?? null}
              activeDragId={activeDragId}
              projectionPosition={projectionPosition}
              projectionDeviceTypeId={getDraggedDeviceTypeId()}
              onTransformChange={handleTransformChange}
              onDeviceClick={handleDeviceClick}
              onWireClick={handleWireClick}
              onRoomClick={handleRoomClick}
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
            selectedWire={connections.find(c => c.id === selectedWireId) || null}
            selectedRoom={selectedRoom}
            floorPlanInfo={{
              name: currentProjectName,
              rooms: { offices: config.offices, meetingRooms: config.meetingRooms, toilets: config.toilets },
              deviceCount: placedDevices.length,
              wireCount: connections.length,
            }}
            onUpdateDevice={handleUpdateDevice}
            onDeleteWire={(wireId) => {
              setConnections(prev => prev.filter(c => c.id !== wireId));
              setSelectedWireId(null);
            }}
            onDeleteDevice={(deviceId) => {
              // Remove all connections to/from this device
              setConnections(prev => prev.filter(c =>
                c.fromDeviceId !== deviceId && c.toDeviceId !== deviceId
              ));
              // Remove the device
              setPlacedDevices(prev => prev.filter(d => d.instanceId !== deviceId));
              setSelectedDeviceId(null);
            }}
          />
        </div>

        {/* Config Modal */}
        <ConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onApply={handleConfigApply}
          initialConfig={config}
        />

        {/* Save Name Dialog */}
        <SaveNameDialog
          isOpen={showSaveNameDialog}
          onSave={handleSaveWithName}
          onCancel={() => setShowSaveNameDialog(false)}
        />

        {/* New Project Confirmation Modal */}
        {showNewProjectConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewProjectConfirm(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Create New Project?</h3>
              <p className="text-sm text-gray-600 mb-4">
                You have unsaved changes. Would you like to save before creating a new project?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowNewProjectConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleSave();
                    confirmNewProject();
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                >
                  Save & New
                </button>
                <button
                  onClick={confirmNewProject}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg"
                >
                  Discard & New
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Saved Project?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete your saved project. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay - shows the device icon while dragging */}
      <DragOverlay dropAnimation={null}>
        {isDragging && <DeviceDragPreview deviceTypeId={getDraggedDeviceTypeId()} />}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
