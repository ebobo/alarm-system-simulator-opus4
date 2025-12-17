# Configuration Tool Implementation Plan

## Overview
Step-by-step implementation guide for building the Fire Alarm Configuration Tool as a standalone React application.

---

## Phase 1: Project Setup

### Step 1.1: Create Vite Project
```bash
cd /Users/qixu/projects/evo
npm create vite@latest fire-alarm-config-tool -- --template react-ts
cd fire-alarm-config-tool
npm install
```

### Step 1.2: Install Dependencies
```bash
npm install xlsx
```

### Step 1.3: Configure Tailwind CSS
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  margin: 0;
  min-height: 100vh;
}
```

### Step 1.4: Verify Setup
```bash
npm run dev
# Should open at http://localhost:5173
```

---

## Phase 2: Core Layout

### Step 2.1: Create App Shell
File: `src/App.tsx`

Layout structure:
```
┌─────────────┬────────────────────────────────────────┐
│   Sidebar   │           Main Content                 │
│  (w-72)     │                                        │
│             │  ┌──────────────────────────────────┐  │
│  - Logo     │  │     File Upload Zone             │  │
│  - Files    │  └──────────────────────────────────┘  │
│  - Actions  │                                        │
│             │  ┌─────────────┐ ┌──────────────────┐  │
│             │  │ Device List │ │ C&E Matrix       │  │
│             │  │             │ │                  │  │
│             │  └─────────────┘ └──────────────────┘  │
└─────────────┴────────────────────────────────────────┘
```

### Step 2.2: Create Sidebar Component
File: `src/components/Sidebar.tsx`

Style (match Floor Simulator):
- Background: `bg-gradient-to-b from-slate-800 to-slate-900`
- Width: `w-72`
- Logo icon: Gear/wrench icon with orange gradient
- Title: "Fire Alarm" / "Configuration Tool"

Sections:
1. Header with logo
2. Loaded files list
3. Action buttons (Import, Validate, Export)

### Step 2.3: Create Main Layout
File: `src/App.tsx`

```tsx
<div className="flex h-screen bg-slate-900">
  <Sidebar />
  <main className="flex-1 p-6 overflow-auto">
    {/* Content here */}
  </main>
</div>
```

---

## Phase 3: File Upload

### Step 3.1: Create FileUpload Component
File: `src/components/FileUpload.tsx`

Features:
- Drag-and-drop zone with dashed border
- Click to browse fallback
- Accept only `.xlsx` files
- Visual feedback on drag over
- Show file name after selection

Styling:
```jsx
<div className="border-2 border-dashed border-slate-600 rounded-xl p-12 
     text-center hover:border-orange-500 transition-colors">
```

### Step 3.2: Implement File Reading
Use FileReader API to read Excel file into ArrayBuffer
Pass to xlsx library for parsing

---

## Phase 4: Excel Parsing

### Step 4.1: Create Type Definitions
File: `src/types/excel.ts`

```typescript
interface ParsedDevice {
  projectName: string;
  deviceLabel: string;
  type: 'H/M Detector' | 'MCP' | 'Loop Sounder';
  location: string;
  displayText: string;
  serialNumber: string;
}

interface CEMatrixEntry {
  output: string;      // Output device label
  input: string;       // Input device label
  value: string;       // "X" or AND group number
}

interface ParsedExcel {
  devices: ParsedDevice[];
  ceMatrix: CEMatrixEntry[];
  projectName: string;
  errors: string[];
  warnings: string[];
}
```

### Step 4.2: Create Excel Parser Utility
File: `src/utils/excelParser.ts`

Functions:
1. `parseDeviceListSheet(workbook)` - Parse Device List sheet
2. `parseCEMatrixSheet(workbook)` - Parse C&E Matrix sheet
3. `parseExcelFile(file)` - Main entry point

### Step 4.3: Create useExcelParser Hook
File: `src/hooks/useExcelParser.ts`

```typescript
function useExcelParser() {
  const [data, setData] = useState<ParsedExcel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const parseFile = async (file: File) => { ... };
  
  return { data, loading, error, parseFile };
}
```

---

## Phase 5: Device List View

### Step 5.1: Create DeviceList Component
File: `src/components/DeviceList.tsx`

Table columns:
| Column | Width | Description |
|--------|-------|-------------|
| Label | 120px | Device address (A.001.001) |
| Type | 100px | Detector/MCP/Sounder |
| Location | 150px | Room name |
| Zone | 100px | Zone assignment (editable) |
| Status | 60px | Validation icon |

Styling:
- Table header: `bg-slate-800 text-slate-400`
- Table rows: `bg-slate-700/50 hover:bg-slate-700`
- Alternate row colors for readability

### Step 5.2: Add Filtering
Filter dropdown by device type:
- All Devices
- Detectors
- MCPs  
- Sounders

---

## Phase 6: C&E Matrix View

### Step 6.1: Create CEMatrix Component
File: `src/components/CEMatrix.tsx`

Grid layout:
- Header row: Input device labels (rotated 45°)
- First column: Output device labels
- Cells: "X" marks or empty

Styling:
- Cell size: `w-10 h-10`
- X mark: `text-orange-400 font-bold`
- Hover: `bg-slate-600`

### Step 6.2: Make Cells Interactive
- Click to toggle X mark
- Shift+Click for AND groups (numbered)
- Visual feedback on modification

---

## Phase 7: Config Generation

### Step 7.1: Create Config Types
File: `src/types/config.ts`

```typescript
interface FAConfig {
  version: string;
  projectName: string;
  createdAt: string;
  devices: ConfigDevice[];
  zones: {
    detection: Zone[];
    alarm: Zone[];
  };
  causeEffect: CERule[];
}
```

### Step 7.2: Create Config Builder
File: `src/utils/configBuilder.ts`

Function: `buildConfig(parsedExcel: ParsedExcel): FAConfig`

Steps:
1. Map device types to config format
2. Generate zones from unique locations
3. Convert C&E matrix to rules

### Step 7.3: Create ConfigPreview Component
File: `src/components/ConfigPreview.tsx`

Features:
- Syntax-highlighted JSON preview
- Collapsible sections
- Copy to clipboard button

---

## Phase 8: Export Functionality

### Step 8.1: Create ExportButton Component
File: `src/components/ExportButton.tsx`

Implementation:
```typescript
function downloadConfig(config: FAConfig) {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.projectName}.faconfig`;
  a.click();
}
```

### Step 8.2: Add Validation Before Export
Check for:
- All devices have valid types
- All outputs are valid devices
- All inputs are valid devices
- No orphan devices (not in any C&E rule)

Display warnings but allow export.

---

## Phase 9: Polish

### Step 9.1: Add Loading States
- Skeleton loaders while parsing
- Spinner in buttons during operations

### Step 9.2: Add Error Handling
- Toast notifications for errors
- Inline validation messages

### Step 9.3: Add Empty States
- No file loaded message
- No devices found message

### Step 9.4: Responsive Adjustments
- Sidebar collapse on mobile (optional)
- Horizontal scroll for large matrices

---

## Verification Checklist

- [ ] Project builds without errors (`npm run build`)
- [ ] Can drag-drop Excel file from Floor Simulator export
- [ ] Device List shows all parsed devices
- [ ] C&E Matrix displays correctly
- [ ] Can export .faconfig file
- [ ] Config JSON is valid and parseable
- [ ] UI matches Floor Simulator dark theme
