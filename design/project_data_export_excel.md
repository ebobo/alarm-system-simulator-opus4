# Project Data Excel Export

This document describes the Excel export functionality for the fire alarm system simulator.

## Overview

The export feature generates an Excel workbook (`.xlsx`) containing two sheets that represent the fire alarm system configuration based on the current floor plan.

## Exported Sheets

### Sheet 1: Device List

Contains all fire alarm devices in the system with the following columns:

| Column | Description |
|--------|-------------|
| Project Name | The name of the current project |
| Device Label | Unique identifier (format: `A.001.XXX`) |
| Type | Device type: `H/M Detector`, `MCP`, or `Loop Sounder` |
| Location | Room name where device is located |
| Display Text | Combined label and location for display |
| Serial Number | Empty (for field entry) |

**Device Assignment Logic:**
- Each room gets one **H/M Detector** (Heat/Multi Detector)
- Public Area gets one **MCP** (Manual Call Point)
- Public Area gets one **Loop Sounder**

### Sheet 2: C&E Matrix

Cause & Effect matrix showing which inputs trigger which outputs.

| Structure | Description |
|-----------|-------------|
| Rows | Output devices (Loop Sounders) |
| Columns | Input devices (Detectors, MCPs) |
| Cells | `X` = input triggers this output |

**Current Logic:** All inputs trigger all outputs using OR logic (marked with `X`).

## Export Process

```
┌───────────────────┐
│   Floor Plan SVG  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Extract rooms via │
│ data-unique-label │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Generate devices  │
│ (1 detector/room) │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Add MCP + Sounder │
│ in Public Area    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Build C&E Matrix  │
│ (all OR logic)    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Create Excel file │
│ with XLSX library │
└───────────────────┘
```

## File Naming

Exported files use the format: `{ProjectName}_{YYYY-MM-DD}.xlsx`

Special characters in project name are replaced with underscores.

## Implementation

**Source:** [excelExport.ts](file:///Users/qixu/projects/evo/all-sim-opus4/src/utils/excelExport.ts)

**Key Functions:**
- `exportToExcel(projectName, svgContent)` - Main export function
- `extractRoomsFromSVG(svgContent)` - Parses room data from SVG attributes
- `generateDeviceList(projectName, svgContent)` - Creates device entries
- `generateCEMatrix(devices)` - Builds the cause & effect matrix

## Room Type Mapping

| Room Type | Gets Detector | Gets MCP | Gets Sounder |
|-----------|--------------|----------|--------------|
| Office | ✓ | | |
| Meeting Room | ✓ | | |
| Toilet | ✓ | | |
| Entrance | ✓ | | |
| Public Area | ✓ | ✓ | ✓ |
| Server Room | ✓ | | |
| Storage | ✓ | | |
