---
phase: 02-leaderboard-core
plan: 04
subsystem: ui
tags: [nextjs, app-router, navigation, summary-table, deep-links]

requires:
  - phase: 02-01
    provides: Extended BenchmarkTableResponse with meta fields
  - phase: 02-02
    provides: MUI app shell, CategoryTabs, BenchmarkSubTabs, SWR hooks
  - phase: 02-03
    provides: LeaderboardTable, TableSkeleton, color/format utilities
provides:
  - App Router pages for summary, category, and benchmark routes
  - SummaryTable component with aggregated category scores
  - Deep-linkable URLs for all views
  - Complete navigation flow with tabs
affects: [future-phases, filtering, search]

tech-stack:
  added: []
  patterns: [app-router-dynamic-routes, swr-parallel-fetch, client-redirect]

key-files:
  created:
    - src/app/page.tsx
    - src/app/[category]/page.tsx
    - src/app/[category]/[benchmark]/page.tsx
    - src/app/[category]/layout.tsx
    - src/components/SummaryTable.tsx
  modified:
    - src/app/layout.tsx
    - src/app/providers.tsx
    - src/components/AppHeader.tsx
    - src/components/CategoryTabs.tsx
    - src/components/BenchmarkSubTabs.tsx
    - src/components/LeaderboardTable.tsx
    - src/lib/api.ts

key-decisions:
  - "Used InitColorSchemeScript component (not function) for Next.js App Router SSR compatibility"
  - "Set colorSchemeSelector: 'data-color-scheme' to enable manual dark/light toggle"
  - "Tabs use value={false} when active value not in children (loading/redirect states)"
  - "Deferred sticky columns — requires DataGrid Pro, CSS sticky incompatible with virtual scroller"
  - "Category page auto-redirects to first benchmark via router.replace()"

patterns-established:
  - "Dynamic routes: /[category]/[benchmark] pattern for deep-linkable benchmarks"
  - "SummaryTable: parallel SWR fetches aggregated into category score columns"

requirements-completed: [FR-1.3, FR-1.4, FR-4.1, FR-4.2, FR-4.3, FR-5.2, FR-5.3, NFR-1.1, NFR-1.3, NFR-4.3]

duration: 15min
completed: 2026-03-11
---

# Plan 02-04: Page Wiring & Navigation Summary

**App Router pages with summary/category/benchmark routes, SummaryTable, and complete navigation flow with deep-linkable URLs**

## Performance

- **Duration:** 15 min (including verification checkpoint fixes)
- **Completed:** 2026-03-11
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files created:** 5, modified: 7

## Accomplishments
- Summary page with aggregated category scores via parallel SWR fetches
- Category layout with tabs and auto-redirect to first benchmark
- Benchmark pages rendering LeaderboardTable with full heatmap coloring
- Deep-linkable URLs working for all routes
- Dark mode toggle working with manual color scheme selector
- All MUI Tabs warnings resolved

## Task Commits

1. **Task 1: SummaryTable and summary page** - `e1415e3` (feat)
2. **Task 2: Category and benchmark route pages** - `c0e7d2b` (feat)
3. **Task 3: Verification fixes** - `e2ccd58` (fix)

## Files Created/Modified
- `src/app/page.tsx` - Summary page with CategoryTabs + SummaryTable
- `src/app/[category]/layout.tsx` - Category layout with tabs
- `src/app/[category]/page.tsx` - Auto-redirect to first benchmark
- `src/app/[category]/[benchmark]/page.tsx` - Benchmark LeaderboardTable page
- `src/components/SummaryTable.tsx` - Aggregated category score table
- `src/app/layout.tsx` - Added AppHeader, fixed InitColorSchemeScript
- `src/app/providers.tsx` - Added colorSchemeSelector for manual toggle
- `src/components/AppHeader.tsx` - Hydration-safe theme toggle
- `src/components/CategoryTabs.tsx` - Fixed value mismatch during loading
- `src/components/BenchmarkSubTabs.tsx` - Fixed value mismatch during redirect
- `src/components/LeaderboardTable.tsx` - Removed broken sticky CSS
- `src/lib/api.ts` - Fixed useBenchmarkTable return type

## Decisions Made
- Deferred sticky columns (MLIP/Score pinning) — requires DataGrid Pro license
- Used `data-color-scheme` attribute selector for manual dark/light mode toggle
- Tabs use `value={false}` to suppress MUI warnings during async loading states

## Deviations from Plan

### Auto-fixed Issues

**1. InitColorSchemeScript SSR error**
- **Found during:** Task 3 (Verification)
- **Issue:** `getInitColorSchemeScript()` is a client function, cannot be called from server component
- **Fix:** Replaced with `<InitColorSchemeScript />` component import
- **Committed in:** e2ccd58

**2. AppHeader not rendered**
- **Found during:** Task 3 (Verification)
- **Issue:** layout.tsx didn't include AppHeader — dark mode toggle invisible
- **Fix:** Added `<AppHeader />` to root layout
- **Committed in:** e2ccd58

**3. colorSchemeSelector misconfigured**
- **Found during:** Task 3 (Verification)
- **Issue:** Default `media` selector prevents manual `setMode()` calls
- **Fix:** Set `colorSchemeSelector: 'data-color-scheme'` in theme config
- **Committed in:** e2ccd58

---

**Total deviations:** 3 auto-fixed (all blocking issues found during human verification)
**Impact on plan:** All fixes necessary for correct functionality. No scope creep.

## Issues Encountered
- Agent lost Bash access during initial execution; orchestrator completed verification fixes manually
- Sticky columns not achievable with DataGrid Community — deferred to future upgrade

## User Setup Required
None.

## Next Phase Readiness
- Full leaderboard navigation working end-to-end
- All components connected and rendering correctly
- Dark/light mode functional
- Sticky columns deferred (needs DataGrid Pro or alternative grid library)

---
*Phase: 02-leaderboard-core*
*Completed: 2026-03-11*
