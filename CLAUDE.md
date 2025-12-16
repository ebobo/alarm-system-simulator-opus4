# Fire Alarm System Simulator

## Overview
A web-based fire alarm system simulation built with React, TypeScript, and Vite. This application allows users to generate floor plans, place fire alarm devices, and create wired connections between them.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with utility classes
- **Drag & Drop**: @dnd-kit/core
- **Storage**: LocalStorage for project persistence

## Project Structure
```
src/
├── App.tsx                 # Main application component
├── main.tsx                # Entry point
├── index.css               # Global styles
├── components/
│   ├── ConfigModal.tsx     # Floor plan configuration modal
│   ├── DeviceOverlay.tsx   # Device rendering on floor plan
│   ├── DevicePalette.tsx   # Draggable device types palette
│   ├── DevicePropertyPanel.tsx  # Device property editor
│   ├── FloorPlanViewer.tsx # SVG floor plan viewer with pan/zoom
│   ├── SaveNameDialog.tsx  # Project save naming dialog
│   ├── Sidebar.tsx         # Left sidebar with project list
│   └── devices/
│       └── AutroGuardDevice.tsx  # Detector device component
├── hooks/
│   └── useCoordinates.ts   # Coordinate conversion utilities
├── types/
│   ├── devices.ts          # Device type definitions
│   └── storage.ts          # Storage type definitions
├── utils/
│   ├── floorPlanGenerator.ts  # Procedural floor plan generator
│   └── storage.ts          # LocalStorage project persistence
└── design/
    └── save_project_design_opus.md  # Save feature design doc
```

## Key Features

### Floor Plan Generation
- Procedurally generated floor plans with configurable rooms
- Room types: Offices, Toilets, Meeting Rooms, Public Areas, Storage, Data Rooms
- SVG-based rendering with pan and zoom support

### Device Placement
- Drag and drop devices from palette to floor plan
- Device types: AutroGuard Base (detector), Loop Driver
- Snap-to-grid and alignment guides
- Device property editing (ID, serial number, etc.)

### Wire Connections
- Click-to-connect terminals between devices
- Bezier curve wire rendering
- Connections persist with device movement

### Project Management
- Save projects with custom names
- Multi-project storage in LocalStorage
- Project list in sidebar for quick switching
- New project generation preserves saved projects

## Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Storage Keys
- `alarm-simulator:projects` - Array of saved project metadata
- `alarm-simulator:project:{id}` - Individual project data

## Device Types
| Type ID | Name | Description |
|---------|------|-------------|
| `autroguard-base` | AutroGuard Base | Smoke/heat detector with 4 terminals |
| `loop-driver` | Loop Driver | BSD-1000 controller with 2 terminals |
