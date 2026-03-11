---
phase: 02-leaderboard-core
plan: 03
subsystem: ui
tags: [mui, datagrid, viridis, d3, heatmap, react]

requires:
  - phase: 02-01
    provides: BenchmarkTableResponse with thresholds, tooltip_header, weights, columns
  - phase: 02-02
    provides: MUI theme, app shell, SWR hooks
provides:
  - LeaderboardTable component with viridis_r heatmap coloring
  - TableSkeleton loading state component
  - Color normalization and viridis_r utility (color.ts)
  - Significant figure formatting utility (format.ts)
  - Model-to-GitHub URL mapping (model-links.ts)
affects: [02-04, page-wiring, navigation]

tech-stack:
  added: [d3-scale-chromatic]
  patterns: [viridis_r-heatmap, sticky-columns, hatched-missing-cells]

key-files:
  created:
    - src/lib/color.ts
    - src/lib/format.ts
    - src/lib/model-links.ts
    - src/components/LeaderboardTable.tsx
    - src/components/TableSkeleton.tsx
  modified: []

key-decisions:
  - "Used d3 interpolateViridis directly (0=purple, 1=yellow) matching viridis_r where 1.0=good"
  - "WCAG AA contrast threshold at 0.4 — black text above, white below"
  - "CSS sticky columns via sx prop rather than DataGrid Pro pinning (Community edition)"
  - "Pagination set to 100 rows default to show all models at once"

patterns-established:
  - "Heatmap coloring: normalizeScore → viridisR → textColorForViridis pipeline"
  - "Missing values: hatched repeating-linear-gradient with em-dash"
  - "Model links: static MODEL_LINKS map, undefined for unknown models"

requirements-completed: [FR-1.1, FR-1.2, FR-1.5, FR-1.6, FR-5.1, NFR-1.2, NFR-4.1, NFR-4.2]

duration: 5min
completed: 2026-03-11
---

# Plan 02-03: LeaderboardTable Summary

**MUI DataGrid with viridis_r heatmap coloring, sticky columns, hatched missing values, GitHub model links, and column tooltips**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11
- **Completed:** 2026-03-11
- **Tasks:** 2
- **Files created:** 5

## Accomplishments
- Viridis_r heatmap coloring using d3-scale-chromatic with WCAG AA contrast
- Sticky MLIP and Score columns via CSS sticky positioning
- Hatched diagonal pattern for missing/null values
- GitHub/HuggingFace links for known models in MLIP column
- Column header tooltips from API metadata
- Significant figure formatting (3 sig figs)
- Loading skeleton component

## Task Commits

1. **Task 1: Color, format, and model-links utilities** - `b2f30d2` (feat)
2. **Task 2: LeaderboardTable and TableSkeleton components** - `090baaf` (feat)

## Files Created/Modified
- `src/lib/color.ts` - normalizeScore, viridisR, textColorForViridis functions
- `src/lib/format.ts` - formatSigFigs with em-dash for missing values
- `src/lib/model-links.ts` - Static model-id to GitHub/HuggingFace URL mapping
- `src/components/LeaderboardTable.tsx` - DataGrid with heatmap coloring, sticky columns, tooltips
- `src/components/TableSkeleton.tsx` - Loading skeleton mimicking DataGrid layout

## Decisions Made
- Used d3 interpolateViridis directly — normalizedScore=1 maps to yellow (good), matching viridis_r
- Set WCAG contrast threshold at 0.4 for text color switching (black/white)
- CSS sticky via sx prop on Community DataGrid rather than Pro pinning feature
- Pagination default 100 rows to show all models without scrolling

## Deviations from Plan
None - plan executed as written.

## Issues Encountered
- Agent lost Bash access mid-execution; orchestrator completed commits manually.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LeaderboardTable ready to receive data from App Router pages (Plan 02-04)
- TableSkeleton available for loading states
- All utility modules (color, format, model-links) importable

---
*Phase: 02-leaderboard-core*
*Completed: 2026-03-11*
