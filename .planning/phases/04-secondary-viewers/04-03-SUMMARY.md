---
phase: 04-secondary-viewers
plan: "03"
subsystem: frontend-3d-structure
tags: [3dmol, molecular-viewer, webgl, lazy-loading, structure-viewer]
dependency_graph:
  requires: [04-01]
  provides: [3d-structure-viewer, structure-modal, figure-drawer-structure-button]
  affects: [src/components/FigureDrawer.tsx]
tech_stack:
  added: [3dmol@2.5.4]
  patterns: [dynamic-import-ssr-false, use-effect-webgl, swr-conditional-fetch]
key_files:
  created:
    - src/components/Mol3DViewer.tsx
    - src/components/StructureModal.tsx
  modified:
    - src/lib/types.ts
    - src/lib/api.ts
    - src/components/FigureDrawer.tsx
decisions:
  - "3Dmol.js imported inside useEffect only — never at module level (SSR incompatible, large bundle)"
  - "Ball-and-stick style: sphere radius 0.3, stick radius 0.15 per project decision"
  - "Unit cell wireframe displayed for pbc=T T T structures using addUnitCell"
  - "View Structure button shown only when filterModel is set (specific model selected via cell click)"
  - "Structure filename defaults to {filterModel}.xyz convention — StructureModal handles 404 gracefully"
  - "StructureModal rendered outside Drawer component to avoid z-index stacking issues"
metrics:
  duration: "2 minutes"
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 2
  files_modified: 3
---

# Phase 04 Plan 03: 3D Structure Viewer Summary

**One-liner:** Lazy-loaded 3Dmol.js WebGL molecular viewer with ball-and-stick rendering, unit cell wireframe for crystal structures, and "View Structure" button in FigureDrawer.

## What Was Built

A complete 3D molecular structure viewing pipeline:

1. **Mol3DViewer.tsx** — The WebGL rendering component. Dynamically imports `3dmol` inside `useEffect` to keep it out of the initial bundle and avoid SSR failures. Creates a transparent-background viewer, renders ball-and-stick style (sphere radius 0.3 / stick radius 0.15), and adds a grey wireframe unit cell box for structures with periodic boundary conditions. Cleans up by nulling the viewer ref on unmount.

2. **StructureModal.tsx** — MUI Dialog wrapping Mol3DViewer via `next/dynamic({ ssr: false })`. Uses `useStructure` SWR hook to fetch XYZ data from `/api/v1/structures/{slug}/{model}/{filename}`. Shows a loading skeleton while fetching and a friendly "No structure data available" message on 404/error.

3. **FigureDrawer.tsx (updated)** — Added `structureOpen` state and a "View Structure" button (MUI outlined, ViewInAr icon) in the drawer header. Button appears only when `filterModel` is non-null (specific model selected via leaderboard cell click). StructureModal is rendered outside the Drawer element to avoid z-index stacking conflicts. State resets when the drawer closes or context changes.

4. **types.ts (updated)** — Added `StructureData` and `StructureResponse` interfaces.

5. **api.ts (updated)** — Added `useStructure(benchmarkSlug, model, filename)` SWR hook.

## Task Summary

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install 3Dmol.js, create Mol3DViewer and StructureModal, add types and hook | 33537b5 | Mol3DViewer.tsx, StructureModal.tsx, types.ts, api.ts |
| 2 | Add "View Structure" button to FigureDrawer | c44c47d | FigureDrawer.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- src/components/Mol3DViewer.tsx: FOUND
- src/components/StructureModal.tsx: FOUND
- src/lib/types.ts: StructureData and StructureResponse interfaces present
- src/lib/api.ts: useStructure hook present
- src/components/FigureDrawer.tsx: "View Structure" string present
- Build: succeeded (3Dmol.js not in initial bundle — loaded lazily on first viewer render)
