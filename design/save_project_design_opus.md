# Save Project Design Document

## Overview

This document describes the design for the project save/load functionality in the Fire Alarm System Simulation application.

## Core Concepts

### Project Naming
- **Generated Plan**: The default name for any new/unsaved floor plan
- **Named Project**: A project that has been saved with a user-defined name
- When saving a project with the "Generated Plan" name, a dialog prompts the user to enter a project name

### Storage Architecture

#### Multi-Project Storage
Projects are stored in LocalStorage using a key-value structure:
- `alarm-simulator:projects` - Array of saved project metadata (id, name, savedAt)
- `alarm-simulator:project:{id}` - Individual project data

```typescript
// Project list entry
interface ProjectListEntry {
  id: string;           // Unique identifier (UUID)
  name: string;         // User-defined name
  savedAt: string;      // ISO timestamp of last save
}

// Full project data (stored separately)
interface SavedProject {
  version: 1;
  id: string;           // Matches ProjectListEntry.id
  name: string;         // Project name
  savedAt: string;      // ISO timestamp
  config: RoomConfig;   // Room configuration
  svgContent: string;   // Floor plan SVG
  placedDevices: PlacedDevice[];
  connections: Connection[];
}
```

### UI Components

#### Project List (Sidebar)
Located in the left sidebar under "Floor Plans" section:
- Shows all saved projects as clickable items
- Current project is highlighted with an indicator
- Each item shows: project name, last saved time
- "Generated Plan" appears when working on an unsaved project

#### Save Name Dialog
A modal that appears when:
1. User clicks "Save" on a project named "Generated Plan"

The dialog contains:
- Input field for project name (pre-focused)
- "Save" button to confirm
- "Cancel" button to dismiss
- Validation: name cannot be empty

### User Flows

#### Creating a New Project
1. User clicks "New" or generates a new floor plan
2. Project is named "Generated Plan" (unsaved state)
3. The "Generated Plan" item appears in the sidebar

#### Saving a Project (First Time)
1. User clicks "Save" button
2. If current name is "Generated Plan", save name dialog appears
3. User enters project name
4. Project is saved with the new name
5. Sidebar updates to show the named project
6. "Generated Plan" is replaced with the saved project name

#### Saving a Project (Subsequent)
1. User clicks "Save" button
2. Project updates in storage with same name
3. "Last saved" timestamp updates
4. Notification confirms save

#### Loading a Project
1. User clicks a project in the sidebar
2. If current project has unsaved changes, show confirmation
3. Project data loads into the editor
4. Selected project is highlighted in sidebar

#### Deleting a Project
1. User clicks "Delete" button
2. Confirmation dialog appears
3. Project is removed from storage
4. If deleted project was active, create new "Generated Plan"

### State Management

#### App Component State
```typescript
// Current project info
const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
const [currentProjectName, setCurrentProjectName] = useState('Generated Plan');

// Project list
const [projectList, setProjectList] = useState<ProjectListEntry[]>([]);

// Save dialog
const [showSaveDialog, setShowSaveDialog] = useState(false);
```

### File Structure

```
src/
├── types/
│   └── storage.ts          # Updated with new types
├── utils/
│   └── storage.ts          # Updated storage functions
├── components/
│   ├── Sidebar.tsx         # Updated with project list
│   └── SaveNameDialog.tsx  # New component
└── App.tsx                 # Updated save/load logic
```

## Implementation Details

### Storage Functions

```typescript
// Get all saved projects (metadata only)
function getProjectList(): ProjectListEntry[]

// Save project (creates or updates)
function saveProject(project: SavedProject): void

// Load specific project by ID
function loadProject(id: string): SavedProject | null

// Delete project by ID
function deleteProject(id: string): void

// Generate unique project ID
function generateProjectId(): string
```

### Sidebar Updates
- Receives `projectList` and `currentProjectId` as props
- Shows list of saved projects with selection state
- Handles project selection via callback
- Shows "Generated Plan" for unsaved current project

### Save Flow
1. `handleSave()` checks if `currentProjectName === 'Generated Plan'`
2. If true, show save dialog
3. On dialog confirm, call `handleSaveWithName(name)`
4. Generate new project ID, save project, update list
5. Update `currentProjectId` and `currentProjectName`

## Design Decisions

1. **Separate Storage Keys**: Each project stored separately to avoid loading all project data when only list is needed

2. **Project ID**: UUID-based to avoid name collisions and allow renaming

3. **Generated Plan**: Not persisted until explicitly saved - prevents auto-saving incomplete work

4. **Sidebar Integration**: Projects in sidebar for quick access without additional menu navigation
