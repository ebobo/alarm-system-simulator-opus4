# Fire Alarm Configuration Tool

## Overview
A web-based configuration tool for parsing fire alarm system Excel exports and generating configuration files (`.faconfig`) that can be imported into the Fire Alarm Simulator. Built with the same tech stack and visual design as the Floor Plan Simulator.

## Tech Stack
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (matching Floor Simulator dark theme)
- **Excel Parsing**: xlsx library
- **File Handling**: File API with drag-and-drop

## Project Setup
```bash
# Create new Vite project
npm create vite@latest fire-alarm-config-tool -- --template react-ts

# Install dependencies
npm install
npm install xlsx

# Development server
npm run dev

# Build for production
npm run build
```

## Design Theme (Match Floor Simulator)
```css
/* Colors */
--bg-primary: slate-900
--bg-secondary: slate-800
--bg-card: slate-700
--accent-primary: orange-500 / red-500 (gradient)
--accent-secondary: emerald-500
--text-primary: white
--text-secondary: slate-400
--border: slate-700

/* Typography */
font-family: Inter, system-ui
```

## Project Structure
```
src/
├── App.tsx                 # Main application
├── main.tsx                # Entry point
├── index.css               # Global styles (Tailwind)
├── components/
│   ├── Sidebar.tsx         # Left sidebar with file list
│   ├── FileUpload.tsx      # Drag-and-drop Excel import
│   ├── DeviceList.tsx      # Parsed device table
│   ├── CEMatrix.tsx        # Cause & Effect matrix viewer
│   ├── ConfigPreview.tsx   # Generated config preview
│   └── ExportButton.tsx    # Export .faconfig button
├── types/
│   ├── devices.ts          # Device type definitions
│   ├── config.ts           # .faconfig format types
│   └── excel.ts            # Excel parsing types
├── utils/
│   ├── excelParser.ts      # Parse Device List sheet
│   ├── ceParser.ts         # Parse C&E Matrix sheet
│   └── configBuilder.ts    # Build .faconfig from parsed data
└── hooks/
    └── useExcelParser.ts   # React hook for parsing

```

## Key Features

### 1. Excel Import
- Drag-and-drop file upload zone
- Parse "Device List" and "C&E Matrix" sheets
- Show validation errors/warnings
- Support the export format from Floor Simulator

### 2. Device List View
- Table with columns: Label, Type, Location, Zone
- Filter by device type
- Edit zone assignments
- Validation indicators (✓/✗)

### 3. C&E Matrix View
- Visual matrix grid (inputs vs outputs)
- Click to toggle X marks
- Support OR logic (X) and AND groups (numbers)
- Highlight conflicts

### 4. Config Export
- Preview generated .faconfig JSON
- Download button
- Copy to clipboard option

## Expected Excel Format

### Device List Sheet
| Project Name | Device Label | Type | Location | Display Text | Serial Number |
|--------------|-------------|------|----------|--------------|---------------|
| Building A | A.001.001 | H/M Detector | Office 1 | ... | |

### C&E Matrix Sheet
| Output \ Input | A.001.001 | A.001.002 | A.001.003 |
|----------------|-----------|-----------|-----------|
| A.001.004 | X | X | X |

## .faconfig Output Format
```json
{
  "version": "1.0",
  "projectName": "Building A",
  "createdAt": "2025-12-17T18:00:00Z",
  "devices": [
    {
      "address": "A.001.001",
      "type": "detector",
      "subType": "heat-multi",
      "location": "Office 1",
      "zone": "DZ-01",
      "label": "Office 1 Detector"
    }
  ],
  "zones": {
    "detection": [{ "id": "DZ-01", "name": "Zone 1" }],
    "alarm": [{ "id": "AZ-01", "name": "Alarm Zone 1" }]
  },
  "causeEffect": [
    {
      "id": "rule-001",
      "condition": { "type": "OR", "inputs": ["A.001.001"] },
      "outputs": ["A.001.004"],
      "delay": 0
    }
  ]
}
```

## Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```
