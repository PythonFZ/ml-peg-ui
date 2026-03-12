---
phase: 05-ux-polish
plan: 02
subsystem: ui
tags: [react, mui, sliders, weight-controls, score-calc, vitest, typescript, data-grid]

# Dependency graph
requires:
  - phase: 05-01
    provides: FilterProvider context, columnVisibilityModel support, benchmark page structure
  - phase: 02-leaderboard-core
    provides: LeaderboardTable DataGrid, SWR hooks, MUI setup
provides:
  - computeScore function for client-side weighted score recalculation
  - WeightControls component: column-aligned vertical sliders, G/B threshold inputs, Reset
  - Per-metric weight sliders (0-1) below benchmark leaderboard table
  - Threshold Good/Bad inputs per metric with live heatmap re-coloring
  - Category weight sliders on summary page adjusting Overall Score
  - Controlled sort state enabling auto-re-sort when Score is active sort column
affects: [05-03-onboarding]

# Tech tracking
tech-stack:
  added:
    - vitest@4.0.18 (unit testing)
  patterns:
    - "computeScore with WeightOverrides + ThresholdOverrides for client-side recalculation"
    - "Shared horizontal scroll container (overflowX auto + minWidth) for DataGrid + WeightControls"
    - "Controlled GridSortModel state + prev.map identity replacement to trigger re-sort"
    - "Threshold inputs fire onChange on blur (not keystroke) to avoid excessive re-renders"
    - "categoryWeights state in SummaryTable drives weighted overall score via useMemo"

key-files:
  created:
    - src/lib/score-calc.ts
    - src/lib/score-calc.test.ts
    - src/components/WeightControls.tsx
  modified:
    - src/components/LeaderboardTable.tsx
    - src/components/SummaryTable.tsx
    - src/app/[category]/[benchmark]/page.tsx

key-decisions:
  - "computeScore excludes metrics with weight===0 or missing threshold — not just weight===0"
  - "Threshold inputs fire onThresholdChange on blur only — avoids partial-value re-renders while typing"
  - "WeightControls placed inside same overflowX container as DataGrid — per Pitfall 5 from research"
  - "Controlled sortModel uses prev.map(s => ({...s})) identity replacement to force DataGrid re-sort"
  - "SummaryTable manages its own categoryWeights state — no prop drilling through app/page.tsx"
  - "GridSortModel (readonly) imported from @mui/x-data-grid for strict type safety"

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 5 Plan 02: Weight Controls and Client-Side Score Recalculation Summary

**Per-metric weight sliders (0-1) and threshold editors below both benchmark and summary tables, with client-side score recalculation using a pure computeScore utility and vitest-verified unit tests**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T09:25:37Z
- **Completed:** 2026-03-12T09:30:37Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- `computeScore()` pure function created in `src/lib/score-calc.ts` with `WeightOverrides` and `ThresholdOverrides` types
- 5 vitest unit tests covering equal weights, zero-weight exclusion, threshold overrides, all-null, and mixed null/number
- `WeightControls` component: column-aligned flex row with MLIP/Score spacers, vertical MUI Sliders (0-1, step 0.05), Good/Bad threshold TextField inputs (blur-fired), and Reset button
- Benchmark page: `weightOverrides`, `thresholdOverrides` state with `useEffect([benchmark])` reset; `enrichedRows` useMemo recalculates Score client-side
- Benchmark page: `currentWeights` and `currentThresholds` memos merge API defaults with overrides for WeightControls display
- Benchmark page: Controlled `GridSortModel` triggers auto-re-sort only when Score is active sort column
- `LeaderboardTable` extended with `thresholdOverrides` prop — heatmap `normalizeScore` uses overridden thresholds for live re-coloring
- `LeaderboardTable` extended with `sortModel` / `onSortModelChange` controlled sort
- DataGrid + WeightControls wrapped in shared `overflowX: auto` container with `minWidth` inner wrapper
- `SummaryTable`: `categoryWeights` state drives weighted overall score calculation in `summaryRows` useMemo
- `SummaryTable`: category weight sliders row (MUI Slider per category, Reset button) inside shared scroll container

## Task Commits

1. **Task 1: Create score-calc.ts and WeightControls component** - `cc2d407` (feat)
2. **Task 2: Integrate weight controls into LeaderboardTable and SummaryTable** - `bb5937b` (feat)

## Files Created/Modified

- `src/lib/score-calc.ts` - computeScore function, WeightOverrides, ThresholdOverrides types (created)
- `src/lib/score-calc.test.ts` - 5 vitest unit tests (created)
- `src/components/WeightControls.tsx` - Column-aligned weight/threshold row component (created)
- `src/components/LeaderboardTable.tsx` - thresholdOverrides + controlled sort props added (modified)
- `src/components/SummaryTable.tsx` - categoryWeights state, weighted overall, slider row (modified)
- `src/app/[category]/[benchmark]/page.tsx` - weight/threshold state, enrichedRows, WeightControls (modified)

## Decisions Made

- `computeScore` excludes metrics where `weight === 0` OR threshold is missing — both conditions needed for correct computation
- Threshold TextField inputs fire `onThresholdChange` on `onBlur` not `onChange` — prevents partial-value recalculations while typing (e.g., typing "0." would parse as 0)
- WeightControls placed inside the same `overflowX: auto` scroll container as DataGrid to align column widths correctly (per research Pitfall 5)
- Controlled `GridSortModel` state uses `prev.map(s => ({ ...s }))` to create a new array reference that triggers DataGrid sort re-evaluation when rows change
- `SummaryTable` manages its own `categoryWeights` state internally — no changes needed in `app/page.tsx`
- `GridSortModel` is `readonly GridSortItem[]` — cast explicitly when constructing new sort model to satisfy TypeScript

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Minor: `GridSortModel` is a readonly type in MUI v8. Fixed by using `prev.map(s => ({ ...s })) as GridSortModel` instead of `[...prev]` spread.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 (onboarding) can use AppHeader `Tutorial` button slot identified in Plan 01 summary
- Weight controls are fully operational; onboarding overlays can highlight the slider row

## Self-Check: PASSED

- FOUND: src/lib/score-calc.ts
- FOUND: src/lib/score-calc.test.ts
- FOUND: src/components/WeightControls.tsx
- FOUND: src/components/LeaderboardTable.tsx (modified)
- FOUND: src/components/SummaryTable.tsx (modified)
- FOUND commit cc2d407: Task 1 (score-calc + WeightControls)
- FOUND commit bb5937b: Task 2 (integration)
- BUILD: passed (bun run build - no errors)
- TESTS: 5/5 passed (npx vitest run score-calc.test.ts)

---
*Phase: 05-ux-polish*
*Completed: 2026-03-12*
