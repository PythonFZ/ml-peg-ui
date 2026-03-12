---
phase: 04-secondary-viewers
plan: 04
subsystem: ui
tags: [neb, trajectory-viewer, 3dmol, plotly, mui, swr, next.js, typescript]

# Dependency graph
requires:
  - phase: 04-01
    provides: FastAPI /api/v1/nebs/{benchmark}/{model}/{band}/frames endpoint returning NebFrame JSON

provides:
  - NebFrame and NebFramesResponse TypeScript interfaces
  - useNebFrames SWR hook for fetching NEB trajectory frames
  - neb-constants.ts with NEB_LI_DIFFUSION_MODELS and NEB_BANDS
  - NebStructurePlayer component with multi-frame 3Dmol.js animation and frame scrubbing
  - NebViewer component with side-by-side 3D + energy chart layout and playback controls
  - /nebs/li_diffusion page with model selector and band toggle

affects: [future NEB benchmark pages, any page needing multi-frame 3D structure animation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - framesToXyz helper converts JSON NebFrame array to multi-frame XYZ text for 3Dmol.js
    - Separate useEffect dependencies for frames (initialise viewer) and currentFrame (scrub) in 3Dmol components
    - Current frame highlighted in Plotly chart via second single-point scatter trace with red marker
    - Model list hardcoded in neb-constants.ts; dynamic endpoint flagged as future enhancement

key-files:
  created:
    - src/lib/neb-constants.ts
    - src/components/NebStructurePlayer.tsx
    - src/components/NebViewer.tsx
    - src/app/nebs/li_diffusion/page.tsx
  modified:
    - src/lib/types.ts
    - src/lib/api.ts

key-decisions:
  - "NEB model list hardcoded in neb-constants.ts (13 models from data/nebs/li_diffusion/) — backend has no model-listing endpoint; dynamic endpoint is a future enhancement"
  - "framesToXyz converts NebFrame JSON to multi-frame XYZ string — 3Dmol.js addModelsAsFrames requires XYZ text format"
  - "Two separate useEffect hooks in NebStructurePlayer: frames dependency (full viewer reinit) vs currentFrame dependency (setFrame only) — avoids rebuilding viewer on every scrub"
  - "Red current-frame marker uses a second Plotly scatter trace (single point) rather than shapes — avoids layout mutation and works with basic-dist-min"

patterns-established:
  - "NebStructurePlayer: dynamic 3dmol import inside async IIFE in useEffect, cancelled flag prevents stale async callbacks"
  - "Energy chart current-frame marker: second single-point scatter trace with mode=markers, size=12, color=red"

requirements-completed: [FR-6.4]

# Metrics
duration: 12min
completed: 2026-03-12
---

# Phase 4 Plan 04: NEB Trajectory Viewer Summary

**NEB trajectory viewer at /nebs/li_diffusion with model selector, side-by-side 3Dmol.js animation and Plotly energy profile, and play/pause/scrub controls for 13 li_diffusion models**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-12T08:00:00Z
- **Completed:** 2026-03-12T08:12:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- /nebs/li_diffusion page with MUI Select model picker and ToggleButtonGroup band selector (b/c)
- Side-by-side layout: NebStructurePlayer (3Dmol.js multi-frame, left) and Plotly energy chart (right)
- Auto-play at 500ms interval with Play/Pause toggle, MUI Slider for scrubbing, frame counter
- Energy profile chart highlights current frame with a red dot overlay trace
- Ball-and-stick rendering with unit cell when frames include lattice data
- TypeScript compiles, Next.js build succeeds with /nebs/li_diffusion route confirmed

## Task Commits

Each task was committed atomically:

1. **Task 1: NEB types, SWR hook, constants, NebStructurePlayer** - `8ba25c1` (feat)
2. **Task 2: NebViewer component and /nebs/li_diffusion page** - `9b15759` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/lib/types.ts` - Added NebFrame and NebFramesResponse interfaces
- `src/lib/api.ts` - Added useNebFrames SWR hook
- `src/lib/neb-constants.ts` - NEB_LI_DIFFUSION_MODELS (13 models) and NEB_BANDS constants
- `src/components/NebStructurePlayer.tsx` - Multi-frame 3Dmol.js viewer with framesToXyz helper
- `src/components/NebViewer.tsx` - Side-by-side layout with auto-play and energy chart
- `src/app/nebs/li_diffusion/page.tsx` - Route page with model/band selectors and loading states

## Decisions Made
- NEB model list hardcoded in neb-constants.ts — no dynamic backend endpoint; add endpoint in future
- framesToXyz function: atom count + optional Lattice comment line + "symbol x y z" lines per atom
- Two separate useEffects in NebStructurePlayer: one for viewer reinit (frames dep), one for scrub (currentFrame dep)
- Red marker uses second single-point scatter trace — cleaner than Plotly shapes, compatible with basic-dist-min

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- NEB trajectory viewer fully functional; backend Plan 04-01 must be running to fetch frames
- Future: add /api/v1/nebs/li_diffusion/models endpoint to replace hardcoded NEB_LI_DIFFUSION_MODELS
- Future: add navigation link to /nebs/li_diffusion from app header or category navigation

---
*Phase: 04-secondary-viewers*
*Completed: 2026-03-12*
