import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import FloorPlanViewer from './components/FloorPlanViewer';
import Sidebar from './components/Sidebar';
import ConfigModal from './components/ConfigModal';
import SaveNameDialog from './components/SaveNameDialog';
import ViewTabs from './components/ViewTabs';
import PanelView from './views/PanelView';
import SimulationView from './views/SimulationView';
import SimulationView3D from './views/SimulationView3D';
import UnifiedSidebar from './components/UnifiedSidebar';
import type { UnifiedSidebarTab } from './components/UnifiedSidebar';
import { generateFloorPlan, defaultConfig } from './utils/floorPlanGenerator';
import { useCoordinates } from './hooks/useCoordinates';
import { generateInstanceId, generateSerialNumber, getDeviceType } from './types/devices';
import DevicePropertyPanel from './components/DevicePropertyPanel';
import FloatingContainer from './components/FloatingContainer';
import { saveProject, loadProject, deleteProject, getProjectList, generateProjectId, getMostRecentProject } from './utils/storage';
import { exportToExcel, exportSVG } from './utils/excelExport';
import { deriveModulesFromFloorPlan } from './utils/moduleUtils';
import { validateDeviceMatch } from './utils/faconfigParser';
import { computeActivatedSounders } from './utils/simulationEngine';
import type { RoomConfig } from './utils/floorPlanGenerator';
import type { PlacedDevice, ViewportTransform, Connection, DrawingWire, RoomInfo } from './types/devices';
import type { ProjectListEntry } from './types/storage';
import type { FAConfig } from './types/faconfig';
import { parseFAConfig } from './utils/faconfigParser';

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

  if (deviceTypeId === 'panel') {
    // Panel preview - smaller rectangle with "P" label and top terminal only
    return (
      <svg width="35" height="25" viewBox="-17.5 -12.5 35 25" className="drop-shadow-lg">
        <rect x="-16" y="-11" width="32" height="22" rx="3" fill="#F8FAFC" stroke="#1E293B" strokeWidth="2" />
        <rect x="-10" y="-6" width="20" height="12" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0891B2">P</text>
        {/* Terminal - top only */}
        <circle cx="0" cy="-11" r="3" fill="#22D3EE" stroke="#0891B2" strokeWidth="1.5" />
      </svg>
    );
  }

  if (deviceTypeId === 'AG-head') {
    // AG Head preview (formerly AG Detector) - white dome with red LED, no terminals
    return (
      <svg width="30" height="30" viewBox="-15 -15 30 30" className="drop-shadow-lg">
        {/* Outer circle - white */}
        <circle r="14" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
        {/* Inner circle */}
        <circle r="9" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Center indicator - red LED */}
        <circle r="3.5" fill="#FEE2E2" stroke="#F87171" strokeWidth="1" />
        {/* Center dot */}
        <circle r="1.5" fill="#EF4444" />
      </svg>
    );
  }

  // Default - AG Socket preview (circle with terminals)
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
  const [snapToSocketId, setSnapToSocketId] = useState<string | null>(null); // Socket to snap detector to

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
  const [currentProjectName, setCurrentProjectName] = useState('New Project');

  // View state
  const [activeView, setActiveView] = useState<'floorplan' | 'panel' | 'simulation'>('floorplan');

  // Simulation state - activated devices
  const [activatedDevices, setActivatedDevices] = useState<Set<string>>(new Set());
  const [is3DSimulation, setIs3DSimulation] = useState(false);

  // System alarm state - persists until RESET is pressed on panel
  const [isSystemAlarm, setIsSystemAlarm] = useState(false);
  const [alarmTriggerInfo, setAlarmTriggerInfo] = useState<{ deviceLabel: string; zoneName: string } | null>(null);
  const [persistentSounders, setPersistentSounders] = useState<Set<string>>(new Set());

  // Loaded config for panel simulation
  const [loadedConfig, setLoadedConfig] = useState<FAConfig | null>(null);
  const [configImportError, setConfigImportError] = useState<string | null>(null);
  const configInputRef = useRef<HTMLInputElement>(null);
  const [projectList, setProjectList] = useState<ProjectListEntry[]>([]);

  // Panel power state (shared with PanelView via prop drilling)
  const [isPanelPoweredOn, setIsPanelPoweredOn] = useState(false);

  // Discovery version - increments each time "Raise Loop" is clicked to trigger re-discovery
  const [discoveryVersion, setDiscoveryVersion] = useState(0);

  // Unified sidebar tab state (persisted across view changes)
  const [unifiedSidebarTab, setUnifiedSidebarTab] = useState<UnifiedSidebarTab>('devices');

  // Sidebar collapse states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUnifiedSidebarCollapsed, setIsUnifiedSidebarCollapsed] = useState(false);

  // Config tab section collapse states (persisted across tab switches)
  const [isConfigDevicesCollapsed, setIsConfigDevicesCollapsed] = useState(false);
  const [isConfigZonesCollapsed, setIsConfigZonesCollapsed] = useState(true); // Default collapsed

  // Floating property panel state
  const [isPropertyPanelFloating, setIsPropertyPanelFloating] = useState(false);
  const [propertyPanelPosition, setPropertyPanelPosition] = useState({ x: 100, y: 100 });

  // Store discovered devices in state - only updates when Raise Loop is clicked
  const [discoveredDevicesMap, setDiscoveredDevicesMap] = useState<Map<string, { cAddress: number; discoveredFrom: 'out' | 'in' }>>(new Map());

  // Run discovery when discoveryVersion changes (Raise Loop clicked)
  useEffect(() => {
    if (!isPanelPoweredOn) {
      // Clear discovered devices when powered off
      setDiscoveredDevicesMap(new Map());
      return;
    }

    // Run discovery - import and call discovery function
    import('./utils/loopDiscovery').then(({ discoverAllLoops }) => {
      const discovered = discoverAllLoops(placedDevices, connections);
      const newMap = new Map<string, { cAddress: number; discoveredFrom: 'out' | 'in' }>();

      for (const [, devices] of discovered) {
        for (const device of devices) {
          newMap.set(device.instanceId, {
            cAddress: device.cAddress,
            discoveredFrom: device.discoveredFrom
          });
        }
      }

      setDiscoveredDevicesMap(newMap);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discoveryVersion, isPanelPoweredOn]); // Only run on Raise Loop click, NOT on device/connection changes

  // Computed: panel modules derived from floor plan
  // Uses discoveredDevicesMap for device info (only populated after Raise Loop click)
  const panelModules = useMemo(() => {
    return deriveModulesFromFloorPlan(
      placedDevices,
      connections,
      isPanelPoweredOn && discoveredDevicesMap.size > 0 ? discoveredDevicesMap : undefined
    );
  }, [placedDevices, connections, isPanelPoweredOn, discoveredDevicesMap]);

  // Computed: device match result for panel
  const panelDeviceMatch = useMemo(() => {
    if (!loadedConfig || !isPanelPoweredOn) return null;
    return validateDeviceMatch(loadedConfig, placedDevices);
  }, [loadedConfig, placedDevices, isPanelPoweredOn]);

  // Computed: activated sounders based on C&E rules
  // When detectors/MCPs are activated, this computes which sounders should also activate
  const activatedSounders = useMemo(() => {
    return computeActivatedSounders(loadedConfig, placedDevices, activatedDevices);
  }, [loadedConfig, placedDevices, activatedDevices]);

  // Effect: Trigger system alarm and persist sounders state
  useEffect(() => {
    if (activatedSounders.size > 0) {
      // Add new sounders to persistent set (they stay until RESET)
      setPersistentSounders(prev => {
        const updated = new Set(prev);
        activatedSounders.forEach(id => updated.add(id));
        return updated;
      });

      // Trigger alarm if not already active
      if (!isSystemAlarm) {
        // Find the first activated device to show in alarm info
        const firstActivatedId = Array.from(activatedDevices)[0];
        const firstDevice = placedDevices.find(d => d.instanceId === firstActivatedId);

        // Get location from config if available
        const configDevice = loadedConfig?.devices.find(d => d.address === firstDevice?.label);

        setIsSystemAlarm(true);
        setAlarmTriggerInfo(firstDevice ? {
          deviceLabel: firstDevice.label || 'Unknown device',
          zoneName: configDevice?.location || 'Unknown location'
        } : null);
      }
    }
  }, [activatedSounders, activatedDevices, placedDevices, isSystemAlarm, loadedConfig]);

  // Handle alarm reset from panel
  const handleAlarmReset = useCallback(() => {
    setIsSystemAlarm(false);
    setAlarmTriggerInfo(null);
    setActivatedDevices(new Set());
    setPersistentSounders(new Set());  // Clear persistent sounders only on reset
  }, []);

  // Sync discovered cAddress back to PlacedDevice when discovery completes
  // This allows the property panel to display the assigned address
  useEffect(() => {
    if (!isPanelPoweredOn || discoveredDevicesMap.size === 0) {
      // When powered off or no discovery, clear all cAddress values
      setPlacedDevices(prev => {
        const needsUpdate = prev.some(d => d.cAddress !== null);
        if (!needsUpdate) return prev;
        return prev.map(d => ({ ...d, cAddress: null }));
      });
      return;
    }

    // Sync discovered addresses to devices
    setPlacedDevices(prev => prev.map(d => {
      const discovered = discoveredDevicesMap.get(d.instanceId);
      return {
        ...d,
        cAddress: discovered?.cAddress ?? null
      };
    }));
  }, [isPanelPoweredOn, discoveredDevicesMap]);

  // Check if panel/loop driver exist
  const hasPanelDevice = placedDevices.some(d => d.typeId === 'panel');
  const isProjectSaved = currentProjectId !== null;
  const isPanelEnabled = isProjectSaved && hasPanelDevice;
  const panelDisabledReason: 'no-panel' | 'not-saved' | undefined =
    !isProjectSaved ? 'not-saved' : !hasPanelDevice ? 'no-panel' : undefined;


  // Always enable simulation view to allow checking 3D model without config
  const isSimulationEnabled = true;
  const simulationDisabledReason: 'no-config' | 'config-mismatch' | 'not-saved' | undefined = undefined;

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

  // Configure drag sensors - split mouse and touch for better reliability
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
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
      setCurrentProjectName('New Project');
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
    setCurrentProjectName('New Project');
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
    setCurrentProjectName('New Project');
  };

  // Handle save button click
  const handleSave = () => {
    // If project name is "Generated Plan", show dialog to get name
    if (currentProjectName === 'New Project') {
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
    setCurrentProjectName('New Project');
    setSaveNotification('Project deleted');
    setTimeout(() => setSaveNotification(null), 2000);
  };

  // Handle export to Excel and SVG
  const handleExport = () => {
    try {
      exportToExcel(currentProjectName, svgContent);
      // Small delay to prevent browser blocking second download
      setTimeout(() => {
        exportSVG(svgContent, currentProjectName);
      }, 100);
      setSaveNotification('Exported Excel + SVG!');
      setTimeout(() => setSaveNotification(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setSaveNotification('Export failed!');
      setTimeout(() => setSaveNotification(null), 3000);
    }
  };

  // Handle config file selection from sidebar
  const handleConfigFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setConfigImportError(null);

    try {
      const text = await file.text();
      const result = parseFAConfig(text);

      if (result.success) {
        setLoadedConfig(result.config);
        setSaveNotification('Config loaded!');
        setTimeout(() => setSaveNotification(null), 2000);
      } else {
        setConfigImportError(result.error);
      }
    } catch (e) {
      setConfigImportError(e instanceof Error ? e.message : 'Failed to read file');
    }

    // Reset input so same file can be selected again
    if (configInputRef.current) {
      configInputRef.current.value = '';
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
    setActiveDragId(event.active.id as string);
    setDragDelta({ x: 0, y: 0 });

    // If dragging a placed device, select it
    const id = event.active.id as string;
    if (id.startsWith('placed-')) {
      const instanceId = id.replace('placed-', '');
      setSelectedDeviceId(instanceId);
    }
  };

  // Handle drag move - update projection position
  const handleDragMove = (event: DragMoveEvent) => {
    const { activatorEvent, delta, active } = event;
    const pointerEvent = activatorEvent as PointerEvent;
    if (!pointerEvent) return;

    // Update drag delta
    setDragDelta({ x: delta.x, y: delta.y });

    const containerRect = getContainerRect();
    if (!containerRect) return;

    // Calculate current pointer position
    const currentX = pointerEvent.clientX + delta.x;
    const currentY = pointerEvent.clientY + delta.y;

    // Check if dragging AG-head (from palette or existing)
    const dragId = active.id as string;
    let isDraggingDetector = dragId === 'palette-AG-head';

    // Also check if dragging an existing placed detector
    if (!isDraggingDetector && dragId.startsWith('placed-')) {
      const instanceId = dragId.replace('placed-', '');
      const device = placedDevices.find(d => d.instanceId === instanceId);
      if (device && device.typeId === 'AG-head') {
        isDraggingDetector = true;
      }
    }

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
      const SOCKET_SNAP_THRESHOLD = 30; // Larger threshold for socket snap
      let snappedX = planCoords.x;
      let snappedY = planCoords.y;
      let guideX: number | null = null;
      let guideY: number | null = null;
      let foundSnapSocket: string | null = null;

      // Find alignment candidates excluding the currently dragged device (if it exists)
      const currentDragInstanceId = activeDragId?.startsWith('placed-') ? activeDragId.replace('placed-', '') : null;

      for (const device of placedDevices) {
        if (device.instanceId === currentDragInstanceId) continue;

        // Check for socket snap when dragging detector
        if (isDraggingDetector &&
          device.typeId === 'AG-socket' &&
          !device.mountedDetectorId) {
          const distToSocket = Math.sqrt(
            Math.pow(device.x - planCoords.x, 2) +
            Math.pow(device.y - planCoords.y, 2)
          );
          if (distToSocket < SOCKET_SNAP_THRESHOLD) {
            // Snap to socket center
            snappedX = device.x;
            snappedY = device.y;
            foundSnapSocket = device.instanceId;
            // Skip regular alignment when snapping to socket
            continue;
          }
        }

        // Horizontal alignment (match Y)
        const distY = Math.abs(device.y - planCoords.y);
        if (distY < SNAP_THRESHOLD && !foundSnapSocket) {
          snappedY = device.y;
          guideY = device.y;
        }

        // Vertical alignment (match X)
        const distX = Math.abs(device.x - planCoords.x);
        if (distX < SNAP_THRESHOLD && !foundSnapSocket) {
          snappedX = device.x;
          guideX = device.x;
        }
      }

      setSnapToSocketId(foundSnapSocket);
      setProjectionPosition({ x: snappedX, y: snappedY });
      setAlignmentGuides(foundSnapSocket ? { horizontal: null, vertical: null } : { horizontal: guideY, vertical: guideX });

    } else {
      setProjectionPosition(null);
      setAlignmentGuides({ horizontal: null, vertical: null });
      setSnapToSocketId(null);
    }
  };

  // Handle drag end - place or move device
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const id = active.id as string;

    // Reset drag state
    setActiveDragId(null);
    setDragDelta({ x: 0, y: 0 });
    setProjectionPosition(null);
    setSnapToSocketId(null);
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
    const SOCKET_SNAP_THRESHOLD = 30;
    let finalX = planCoords.x;
    let finalY = planCoords.y;

    // Check if dropping AG-head (palette or existing)
    const isDroppingDetectorFromPalette = id === 'palette-AG-head';
    let isDroppingDetector = isDroppingDetectorFromPalette;

    const currentDragInstanceId = id.startsWith('placed-') ? id.replace('placed-', '') : null;

    if (!isDroppingDetector && currentDragInstanceId) {
      const device = placedDevices.find(d => d.instanceId === currentDragInstanceId);
      if (device && device.typeId === 'AG-head') {
        isDroppingDetector = true;
      }
    }

    // Calculate snapping if we have alignment candidates
    for (const device of placedDevices) {
      if (device.instanceId === currentDragInstanceId) continue;

      // Check for socket snap when dropping detector
      if (isDroppingDetector &&
        device.typeId === 'AG-socket' &&
        !device.mountedDetectorId) {
        const distToSocket = Math.sqrt(
          Math.pow(device.x - planCoords.x, 2) +
          Math.pow(device.y - planCoords.y, 2)
        );
        if (distToSocket < SOCKET_SNAP_THRESHOLD) {
          // Snap to socket center
          finalX = device.x;
          finalY = device.y;
          break; // Socket found, no need for further snapping
        }
      }

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
        if (deviceTypeId === 'AG-socket') return 'AG-socket';
        if (deviceTypeId === 'AG-head') return 'AG Head';
        return deviceType.name;
      };

      // Check if AG-head is being dropped on/near an AG-socket for auto-mounting
      if (deviceTypeId === 'AG-head') {
        const MOUNT_THRESHOLD = 30; // Distance within which detector auto-mounts to socket
        const targetSocket = placedDevices.find(dev =>
          dev.typeId === 'AG-socket' &&
          !dev.mountedDetectorId && // Socket doesn't already have a detector
          Math.abs(dev.x - finalX) < MOUNT_THRESHOLD &&
          Math.abs(dev.y - finalY) < MOUNT_THRESHOLD
        );

        if (targetSocket) {
          // Create new detector at socket position with mounting
          // Label logic: socket label takes precedence, use default if socket is empty
          const finalLabel = targetSocket.label || '';

          try {
            const newDetector: PlacedDevice = {
              instanceId: generateInstanceId(),
              typeId: deviceTypeId,
              x: targetSocket.x,  // Detector position matches socket
              y: targetSocket.y,
              rotation: 0,
              deviceType: 'AG-detector',
              deviceId: null,
              cAddress: null,
              label: finalLabel,
              sn: generateSerialNumber(),
              mountedOnSocketId: targetSocket.instanceId,
            };

            setPlacedDevices(prev => [
              ...prev.map(dev =>
                dev.instanceId === targetSocket.instanceId
                  ? { ...dev, mountedDetectorId: newDetector.instanceId, label: finalLabel }
                  : dev
              ),
              newDetector
            ]);

            // Select the socket (which now represents the AG Detector)
            setSelectedDeviceId(targetSocket.instanceId);
            setSelectedWireId(null);
            setSelectedRoom(null);
          } catch (error) {
            // Silently fail if mounting fails
          }
          return;
        }
      }

      // Regular device placement (including free-placed AG-head)
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
      // Check for mounting when moving an existing detector
      if (currentDragInstanceId) {
        const movedDevice = placedDevices.find(d => d.instanceId === currentDragInstanceId);

        // If moving AG-head onto an empty AG-socket
        if (movedDevice?.typeId === 'AG-head') {
          const MOUNT_THRESHOLD = 30;
          const targetSocket = placedDevices.find(dev =>
            dev.typeId === 'AG-socket' &&
            !dev.mountedDetectorId &&
            Math.abs(dev.x - finalX) < MOUNT_THRESHOLD &&
            Math.abs(dev.y - finalY) < MOUNT_THRESHOLD
          );

          if (targetSocket) {
            // Mount existing detector onto socket
            // Label logic: socket label takes precedence, use head label if socket is empty
            const finalLabel = targetSocket.label || movedDevice.label;

            setPlacedDevices(prev =>
              prev.map(dev => {
                // Update socket to reference mounted detector and use final label
                if (dev.instanceId === targetSocket.instanceId) {
                  return { ...dev, mountedDetectorId: movedDevice.instanceId, label: finalLabel };
                }
                // Update detector to reference socket and match position
                if (dev.instanceId === movedDevice.instanceId) {
                  // Label logic: socket label takes precedence, use head label if socket is empty
                  return {
                    ...dev,
                    x: targetSocket.x,
                    y: targetSocket.y,
                    mountedOnSocketId: targetSocket.instanceId,
                    label: finalLabel,
                    deviceType: 'AG-detector',
                  };
                }
                return dev;
              })
            );
            // Select the socket (which now represents the AG Detector)
            setSelectedDeviceId(targetSocket.instanceId);
            setSelectedWireId(null);
            return; // handled
          }
        }
      }

      // Moving existing device (standard move)
      const instanceId = id.replace('placed-', '');

      setPlacedDevices(prev => {
        // Find the device being moved
        const movingDevice = prev.find(d => d.instanceId === instanceId);
        if (!movingDevice) return prev;

        const oldSocketId = movingDevice.mountedOnSocketId;

        return prev.map(d => {
          // If this is the OLD socket, clear its mounted detector reference
          if (oldSocketId && d.instanceId === oldSocketId) {
            return { ...d, mountedDetectorId: undefined };
          }

          // If this is the moving device
          if (d.instanceId === instanceId) {
            // Clear mount references if it was mounted, and update position/label
            // If it was mounted, clear the label and revert deviceType to AG Head
            if (oldSocketId) {
              return { ...d, x: finalX, y: finalY, mountedOnSocketId: undefined, label: '', deviceType: 'AG Head' };
            }
            return { ...d, x: finalX, y: finalY };
          }

          return d;
        });
      });
    }
  };

  // Handle device click for selection
  const handleDeviceClick = (deviceId: string) => {
    // Always select the clicked device (even if it's a socket with mounted detector)
    // The property panel will handle showing AG Detector properties if socket has mounted detector
    setSelectedDeviceId(prev => (prev === deviceId ? null : deviceId));
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
        className="h-screen flex bg-gray-100 overflow-x-hidden"
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
          activeView={activeView}
          onImportConfig={() => configInputRef.current?.click()}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        />

        {/* Hidden file input for config import */}
        <input
          ref={configInputRef}
          type="file"
          accept=".faconfig,.json"
          onChange={handleConfigFileSelect}
          className="hidden"
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <ViewTabs
                activeView={activeView}
                onViewChange={(view) => {
                  setActiveView(view);
                  // Auto-switch to panel-status tab when entering panel view while on devices tab
                  if (view === 'panel' && unifiedSidebarTab === 'devices') {
                    setUnifiedSidebarTab('panel-status');
                  }
                }}
                isPanelEnabled={isPanelEnabled}
                panelDisabledReason={panelDisabledReason}
                isSimulationEnabled={isSimulationEnabled}
                simulationDisabledReason={simulationDisabledReason}
              />
              {activeView === 'floorplan' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Floor Plan Viewer</h2>
                  <p className="text-xs text-gray-500">
                    {config.offices} offices • {config.meetingRooms} meeting rooms • {config.toilets} toilets
                    {placedDevices.length > 0 && ` • ${placedDevices.length} device${placedDevices.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
              )}
              {activeView === 'panel' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Panel Simulator</h2>
                  <p className="text-xs text-gray-500">{currentProjectName} - AutroSafe Panel</p>
                </div>
              )}
              {activeView === 'simulation' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Simulation Mode</h2>
                  <p className="text-xs text-gray-500">{currentProjectName} - Click devices to activate</p>
                </div>
              )}
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

              {/* View-specific buttons */}
              {activeView === 'floorplan' && (
                <>
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
                </>
              )}
            </div>
          </div>

          {/* Content Area - conditionally show Floor Plan or Panel */}
          {activeView === 'floorplan' ? (
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
                snapToSocketId={snapToSocketId}
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
          ) : activeView === 'simulation' ? (
            <div className="flex-1 h-full relative">
              {/* 3D Toggle Button */}
              <div className="absolute top-8 right-[82px] z-20">
                <button
                  onClick={() => setIs3DSimulation(!is3DSimulation)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all shadow-md ${is3DSimulation
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {is3DSimulation ? '3D View' : '2D View'}
                </button>
              </div>

              {is3DSimulation ? (
                <SimulationView3D
                  svgContent={svgContent}
                  placedDevices={placedDevices}
                  activatedDevices={activatedDevices}
                  activatedSounders={persistentSounders}
                  onDeviceClick={handleDeviceClick}
                />
              ) : (
                <SimulationView
                  svgContent={svgContent}
                  placedDevices={placedDevices}
                  selectedDeviceId={selectedDeviceId}
                  activatedDevices={activatedDevices}
                  activatedSounders={persistentSounders}
                  onDeviceClick={handleDeviceClick}
                  onFloorPlanClick={handleFloorPlanClick}
                />
              )}
            </div>
          ) : (
            <PanelView
              projectName={currentProjectName}
              placedDevices={placedDevices}
              connections={connections}
              loadedConfig={loadedConfig}
              importError={configImportError}
              isPoweredOn={isPanelPoweredOn}
              onPowerChange={(powered) => {
                setIsPanelPoweredOn(powered);
                // Increment discovery version to trigger re-discovery
                setDiscoveryVersion(v => v + 1);
                // Show notification
                setSaveNotification('Loop raised!');
                setTimeout(() => setSaveNotification(null), 2000);
              }}
              deviceMatch={panelDeviceMatch}
              discoveredDeviceCount={discoveredDevicesMap.size}
              hasLoopBreak={Array.from(discoveredDevicesMap.values()).some(d => d.discoveredFrom === 'in')}
              isAlarm={isSystemAlarm}
              alarmInfo={alarmTriggerInfo}
              activatedSoundersCount={persistentSounders.size}
              onReset={handleAlarmReset}
            />
          )}
        </div>

        {/* Right Sidebar - Unified Control Panel and Property Panel */}
        <div className={`${isUnifiedSidebarCollapsed ? 'w-12' : 'w-[395px]'} flex flex-col bg-gradient-to-b from-slate-800 to-slate-900 border-l border-slate-700 transition-all duration-200`}>
          <div className="flex-1 overflow-hidden">
            <UnifiedSidebar
              activeView={activeView}
              activeTab={unifiedSidebarTab}
              onTabChange={setUnifiedSidebarTab}
              isCollapsed={isUnifiedSidebarCollapsed}
              onToggleCollapse={() => setIsUnifiedSidebarCollapsed(prev => !prev)}
              modules={panelModules}
              config={loadedConfig}
              matchResult={panelDeviceMatch}
              isPoweredOn={isPanelPoweredOn}
              isConfigDevicesCollapsed={isConfigDevicesCollapsed}
              onToggleConfigDevicesCollapsed={() => setIsConfigDevicesCollapsed(prev => !prev)}
              isConfigZonesCollapsed={isConfigZonesCollapsed}
              onToggleConfigZonesCollapsed={() => setIsConfigZonesCollapsed(prev => !prev)}
              floorPlanProjectName={currentProjectName}
            />
          </div>
          {/* Docked Property Panel - only when not floating */}
          {!isUnifiedSidebarCollapsed && !isPropertyPanelFloating && (activeView === 'floorplan' || activeView === 'simulation') && (
            <div className="border-t border-slate-700">
              {/* Undock button header */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-700/50">
                <span className="text-xs font-medium text-slate-300">Properties</span>
                <button
                  onClick={() => setIsPropertyPanelFloating(true)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-600 transition-colors"
                  title="Undock to floating window"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              <DevicePropertyPanel
                selectedDevice={placedDevices.find(d => d.instanceId === selectedDeviceId) || null}
                allDevices={placedDevices}
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
                onRemoveDetector={(detectorId, socketId) => {
                  // Find the socket to get its position
                  const socket = placedDevices.find(d => d.instanceId === socketId);
                  if (!socket) return;

                  // Update devices: clear mountedDetectorId from socket, move detector next to socket
                  setPlacedDevices(prev => prev.map(dev => {
                    if (dev.instanceId === socketId) {
                      // Clear mounted detector reference from socket
                      return { ...dev, mountedDetectorId: undefined };
                    }
                    if (dev.instanceId === detectorId) {
                      // Move detector next to socket (e.g. +40px x)
                      return {
                        ...dev,
                        x: socket.x + 40,
                        y: socket.y,
                        mountedOnSocketId: undefined,
                        deviceType: 'AG Head' // Revert to AG Head
                      };
                    }
                    return dev;
                  }));

                  // Keep the detector selected
                  setSelectedDeviceId(detectorId);
                }}
                connections={connections}
                hasConfig={loadedConfig !== null}
                onRaiseLoop={() => {
                  setIsPanelPoweredOn(true);
                  setDiscoveryVersion(v => v + 1);
                  setSaveNotification('Loop raised!');
                  setTimeout(() => setSaveNotification(null), 2000);
                }}
                isSimulationMode={activeView === 'simulation'}
                isDeviceActivated={selectedDeviceId ? activatedDevices.has(selectedDeviceId) : false}
                onActivate={(deviceId) => setActivatedDevices(prev => new Set(prev).add(deviceId))}
                onDeactivate={(deviceId) => {
                  setActivatedDevices(prev => {
                    const next = new Set(prev);
                    next.delete(deviceId);
                    return next;
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Property Panel - shows when floating and in floorplan/simulation view */}
        {isPropertyPanelFloating && (activeView === 'floorplan' || activeView === 'simulation') && (
          <FloatingContainer
            position={propertyPanelPosition}
            onPositionChange={setPropertyPanelPosition}
            onDock={() => setIsPropertyPanelFloating(false)}
            title="Device Properties"
          >
            <DevicePropertyPanel
              selectedDevice={placedDevices.find(d => d.instanceId === selectedDeviceId) || null}
              allDevices={placedDevices}
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
              onRemoveDetector={(detectorId, socketId) => {
                // Find the socket to get its position
                const socket = placedDevices.find(d => d.instanceId === socketId);
                if (!socket) return;

                // Update devices: clear mountedDetectorId from socket, move detector next to socket
                setPlacedDevices(prev => prev.map(dev => {
                  if (dev.instanceId === socketId) {
                    // Clear mounted detector reference from socket
                    return { ...dev, mountedDetectorId: undefined };
                  }
                  if (dev.instanceId === detectorId) {
                    // Move detector next to socket (e.g. +40px x)
                    return {
                      ...dev,
                      x: socket.x + 40,
                      y: socket.y,
                      mountedOnSocketId: undefined,
                      deviceType: 'AG Head' // Revert to AG Head
                    };
                  }
                  return dev;
                }));

                // Keep the detector selected
                setSelectedDeviceId(detectorId);
              }}
              connections={connections}
              hasConfig={loadedConfig !== null}
              onRaiseLoop={() => {
                setIsPanelPoweredOn(true);
                setDiscoveryVersion(v => v + 1);
                setSaveNotification('Loop raised!');
                setTimeout(() => setSaveNotification(null), 2000);
              }}
              isSimulationMode={activeView === 'simulation'}
              isDeviceActivated={selectedDeviceId ? activatedDevices.has(selectedDeviceId) : false}
              onActivate={(deviceId) => setActivatedDevices(prev => new Set(prev).add(deviceId))}
              onDeactivate={(deviceId) => {
                setActivatedDevices(prev => {
                  const next = new Set(prev);
                  next.delete(deviceId);
                  return next;
                });
              }}
            />
          </FloatingContainer>
        )}

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
      <DragOverlay
        dropAnimation={null}
        modifiers={[
          // Center the drag preview under the cursor
          ({ transform }) => ({
            ...transform,
            x: transform.x,  // Keep the x position
            y: transform.y,  // Keep the y position
          }),
        ]}
        style={{
          cursor: 'grabbing',
          pointerEvents: 'none', // Don't block mouse release events
        }}
      >
        {isDragging && <DeviceDragPreview deviceTypeId={getDraggedDeviceTypeId()} />}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
