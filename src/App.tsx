import { useState, useEffect } from 'react';
import FloorPlanViewer from './components/FloorPlanViewer';
import Sidebar from './components/Sidebar';
import ConfigModal from './components/ConfigModal';
import { generateFloorPlan, defaultConfig } from './utils/floorPlanGenerator';
import type { RoomConfig } from './utils/floorPlanGenerator';

function App() {
  const [svgContent, setSvgContent] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [config, setConfig] = useState<RoomConfig>(defaultConfig);

  // Generate floor plan on initial load
  useEffect(() => {
    const initialPlan = generateFloorPlan(defaultConfig);
    setSvgContent(initialPlan);
  }, []);

  const handleGenerate = () => {
    const newPlan = generateFloorPlan(config);
    setSvgContent(newPlan);
  };

  const handleConfigApply = (newConfig: RoomConfig) => {
    setConfig(newConfig);
    const newPlan = generateFloorPlan(newConfig);
    setSvgContent(newPlan);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
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
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Stage 1</span>
          </div>
        </div>

        {/* Viewer */}
        <div className="flex-1 p-4">
          <FloorPlanViewer svgContent={svgContent} />
        </div>
      </div>

      {/* Config Modal */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onApply={handleConfigApply}
        initialConfig={config}
      />
    </div>
  );
}

export default App;
