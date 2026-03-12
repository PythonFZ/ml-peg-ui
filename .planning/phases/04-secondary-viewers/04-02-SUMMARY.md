---
phase: 04-secondary-viewers
plan: "02"
subsystem: ui
tags: [react, nextjs, mui, plotly, swr, typescript, periodic-table, diatomics]

dependency_graph:
  requires:
    - phase: 04-secondary-viewers
      plan: "01"
      provides: "GET /api/v1/diatomics/index, GET /api/v1/diatomics/curves/{pair}"
  provides:
    - /diatomics page with full interactive periodic table element selector
    - DiatomicChart multi-model Plotly overlay component
    - PeriodicTable component with 118 elements, CSS Grid, pair filtering
    - useDiatomicIndex and useDiatomicCurves SWR hooks
    - DiatomicCurve, DiatomicIndexResponse, DiatomicCurvesResponse TS types
  affects:
    - src/lib/types.ts
    - src/lib/api.ts

tech-stack:
  added: []
  patterns:
    - PeriodicTable using CSS Grid with gridColumn/gridRow for exact element placement
    - Dynamic import of PlotlyChart (ssr:false) from new component — same pattern as FigureDrawer
    - getPlotlyThemeOverrides inlined in DiatomicChart (same implementation as FigureDrawer)
    - Pair key alphabetical sort (e.g., [H,Ac].sort().join('-') = 'Ac-H') to match backend storage
    - Selection state machine: null→e1→e1+e2, click e1=reset, click when full=new e1

key-files:
  created:
    - src/components/PeriodicTable.tsx
    - src/components/DiatomicChart.tsx
    - src/app/diatomics/page.tsx
  modified:
    - src/lib/types.ts (DiatomicCurve, DiatomicIndexResponse, DiatomicCurvesResponse types added)
    - src/lib/api.ts (useDiatomicIndex, useDiatomicCurves hooks added)

key-decisions:
  - "getPlotlyThemeOverrides inlined in DiatomicChart rather than shared util — avoids cross-component coupling for two simple consumers"
  - "Pair alphabetical sort in frontend matches backend key format (Ac-H not H-Ac) — no server-side normalization needed"
  - "Element selection resets fully when clicking element1 — simplest UX that avoids confusing partial-reset states"

patterns-established:
  - "Periodic table element grid: ELEMENTS array of [symbol, col, row] tuples, rendered with gridColumn/gridRow inline sx props"
  - "Pair validation: allAvailableElements from splitting all pair keys; validPartners by filtering keys containing element1"

requirements-completed: [FR-6.1]

duration: 4min
completed: "2026-03-12"
---

# Phase 4 Plan 2: Diatomic Curve Viewer Frontend Summary

**CSS Grid 118-element periodic table with pair-filtering selection state, wired to Plotly multi-model overlay chart via SWR hooks at /diatomics**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-12T07:42:51Z
- **Completed:** 2026-03-12T07:46:21Z
- **Tasks:** 2
- **Files modified/created:** 5

## Accomplishments

- Full 118-element periodic table in standard CSS Grid layout (including lanthanides row 9, actinides row 10)
- Three visual states: disabled (no data), enabled (valid partner), selected (highlighted)
- Pair filtering: after selecting element1, only valid pair partners remain enabled
- DiatomicChart with Plotly scatter traces (one per model), distance/energy axes, dark/light theme support
- /diatomics page wiring all pieces with clean selection state machine and MUI Chip indicators

## Task Commits

Each task was committed atomically:

1. **Task 1: Add diatomic TS types, SWR hooks, and PeriodicTable component** - `1c0969c` (feat)
2. **Task 2: Build DiatomicChart and /diatomics page** - `9ddc704` (feat)

## Files Created/Modified

- `src/lib/types.ts` - Added DiatomicCurve, DiatomicIndexResponse, DiatomicCurvesResponse interfaces
- `src/lib/api.ts` - Added useDiatomicIndex() and useDiatomicCurves(pair) SWR hooks
- `src/components/PeriodicTable.tsx` - 118-element CSS Grid component with pair filtering logic
- `src/components/DiatomicChart.tsx` - Plotly multi-model overlay chart, dynamic import, theme-aware
- `src/app/diatomics/page.tsx` - /diatomics page with element selection state, loading skeletons, MUI layout

## Decisions Made

1. **getPlotlyThemeOverrides inlined** — copied pattern from FigureDrawer rather than extracting to shared util. Two consumers don't justify a shared module; avoids indirection for this small utility.

2. **Pair alphabetical sort in frontend** — `[e1, e2].sort().join('-')` mirrors how the backend indexes pairs. No server-side normalization needed; client is responsible for forming the canonical key.

3. **Selection reset on element1 click** — simplest semantics: clicking the first selected element clears everything. Clicking any element when both are selected resets to that element as the new element1.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- /diatomics page is complete and builds successfully
- Phase 4 Plan 3 (NEB viewer or structure viewer) can proceed
- The diatomic_index.json must be present in MinIO storage at the expected path for the page to show data in production

---
*Phase: 04-secondary-viewers*
*Completed: 2026-03-12*

## Self-Check: PASSED

- FOUND: src/components/PeriodicTable.tsx
- FOUND: src/components/DiatomicChart.tsx
- FOUND: src/app/diatomics/page.tsx
- FOUND: .planning/phases/04-secondary-viewers/04-02-SUMMARY.md
- FOUND: commit 1c0969c (Task 1)
- FOUND: commit 9ddc704 (Task 2)
