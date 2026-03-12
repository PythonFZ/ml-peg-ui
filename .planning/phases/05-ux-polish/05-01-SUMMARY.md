---
phase: 05-ux-polish
plan: 01
subsystem: ui
tags: [react, mui, autocomplete, filter, context, swr, next.js, typescript]

# Dependency graph
requires:
  - phase: 02-leaderboard-core
    provides: LeaderboardTable DataGrid, SWR hooks, MUI setup
  - phase: 03-figure-drawer
    provides: AppHeader, benchmark page structure
provides:
  - FilterProvider React context for persistent model selection across navigation
  - Model filter multi-select Autocomplete in AppBar with chip rendering
  - Benchmark quick-search Autocomplete in AppBar with router navigation
  - Column filter TextField per benchmark page resetting on benchmark change
  - Row filtering in benchmark pages and summary page driven by context
  - columnVisibilityModel support in LeaderboardTable
affects: [05-02-weights, 05-03-onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "React context (FilterProvider) for cross-page state shared between AppHeader and page components"
    - "columnVisibilityModel + onColumnVisibilityModelChange={() => {}} pattern for controlled DataGrid column visibility"
    - "useEffect([benchmark]) to reset per-benchmark state when benchmark changes"

key-files:
  created:
    - src/lib/filter-context.tsx
  modified:
    - src/app/layout.tsx
    - src/components/AppHeader.tsx
    - src/lib/api.ts
    - src/app/[category]/[benchmark]/page.tsx
    - src/components/LeaderboardTable.tsx
    - src/app/page.tsx
    - src/components/SummaryTable.tsx

key-decisions:
  - "FilterProvider wraps both AppHeader and children in layout.tsx so both share the same context instance"
  - "useModels() SWR hook added to api.ts for /api/v1/models; falls back to empty array if endpoint unavailable"
  - "Benchmark quick-search value always null (ephemeral) — navigates then clears; blurOnSelect dismisses dropdown"
  - "columnVisibilityModel controlled by colFilter state; onColumnVisibilityModelChange is no-op to prevent DataGrid from overwriting controlled state"
  - "MLIP and Score columns always visible (excluded from columnVisibilityModel entries)"
  - "Column filter resets via useEffect([benchmark]) when benchmark route param changes"
  - "SummaryTable accepts selectedModels prop and filters summaryRows before passing to DataGrid"

patterns-established:
  - "Cross-page persistent state: React context in layout.tsx wrapping AppHeader + children"
  - "Per-benchmark ephemeral state: useEffect([benchmark]) reset pattern"
  - "Controlled DataGrid column visibility: columnVisibilityModel + no-op onChange handler"

requirements-completed: [FR-2.1, FR-2.2, FR-2.3]

# Metrics
duration: 5min
completed: 2026-03-12
---

# Phase 5 Plan 01: Search and Filter Summary

**MUI multi-select model filter with persistent context, benchmark quick-search navigation, and column visibility filter with per-benchmark reset across leaderboard and summary pages**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-12T09:17:46Z
- **Completed:** 2026-03-12T09:22:13Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- FilterProvider context created and wired into layout.tsx, wrapping both AppHeader and page content
- Model filter Autocomplete with multi-select and chip rendering added to AppBar; persists across navigation via shared context
- Benchmark quick-search Autocomplete added to AppBar; navigates to selected benchmark and clears after selection
- Column filter TextField added per benchmark page; hides non-matching columns while keeping MLIP and Score always visible; resets when benchmark changes
- Row filtering applied in both benchmark pages and summary page driven by selected models from context
- useModels() SWR hook added to api.ts for model list fetching
- LeaderboardTable extended with controlled columnVisibilityModel prop

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FilterProvider context and wire into layout** - `b8f5ed5` (feat)
2. **Task 2: Add model filter + benchmark search + column filter + row filtering** - `56943cd` (feat)

**Plan metadata:** (final docs commit — hash TBD)

## Files Created/Modified
- `src/lib/filter-context.tsx` - FilterProvider component and useFilterContext hook (created)
- `src/app/layout.tsx` - FilterProvider wraps AppHeader + children (modified)
- `src/components/AppHeader.tsx` - Model Autocomplete + Benchmark Autocomplete added (modified)
- `src/lib/api.ts` - useModels() SWR hook added (modified)
- `src/app/[category]/[benchmark]/page.tsx` - colFilter state, filteredRows, columnVisibilityModel (modified)
- `src/components/LeaderboardTable.tsx` - columnVisibilityModel prop added to DataGrid (modified)
- `src/app/page.tsx` - selectedModels from context passed to SummaryTable (modified)
- `src/components/SummaryTable.tsx` - selectedModels prop filters summaryRows (modified)

## Decisions Made
- FilterProvider placed in layout.tsx wrapping both AppHeader and {children} — both need access to the same selectedModels state; context in AppHeader alone would not be visible to page components
- Benchmark quick-search value is always `null` (controlled) with `blurOnSelect` — selection triggers navigation and the input clears automatically
- `onColumnVisibilityModelChange={() => {}}` no-op prevents MUI DataGrid from overwriting the controlled columnVisibilityModel when user tries to manually toggle columns
- MLIP, Score, and id columns excluded from columnVisibilityModel entries so they are always visible regardless of filter text
- useModels() hook returns empty array when /api/v1/models returns nothing — Autocomplete still renders (empty options list)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Filter context is available to all pages via layout.tsx — Plan 02 (weight controls) can also use this pattern for sharing weight state
- LeaderboardTable's columnVisibilityModel support is ready for Plan 02 if needed for weight column hiding
- AppHeader has room for one more control (Tutorial button for Plan 03)

## Self-Check: PASSED

- FOUND: src/lib/filter-context.tsx
- FOUND: src/components/AppHeader.tsx
- FOUND: src/app/layout.tsx
- FOUND: .planning/phases/05-ux-polish/05-01-SUMMARY.md
- FOUND commit b8f5ed5: Task 1 (FilterProvider context)
- FOUND commit 56943cd: Task 2 (model filter, benchmark search, column filter)

---
*Phase: 05-ux-polish*
*Completed: 2026-03-12*
