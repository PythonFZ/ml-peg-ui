---
phase: 03-figure-drawer
plan: 02
subsystem: frontend
tags: [plotly, figure-drawer, mui-drawer, swr, lazy-loading, dark-mode, dual-click-patterns]
dependency_graph:
  requires: [03-01]
  provides: [figure-drawer-ui, plotly-chart, figure-skeleton]
  affects: [benchmark-page, leaderboard-table]
tech_stack:
  added:
    - plotly.js-basic-dist-min@3.4.0
    - react-plotly.js@2.6.0
    - "@types/react-plotly.js@2.6.4"
  patterns:
    - next/dynamic with ssr:false for Plotly lazy loading
    - createPlotlyComponent factory pattern for custom Plotly dist
    - useColorScheme for dark/light Plotly theming
    - SWR conditional fetch (null key when drawer closed)
    - Persistent MUI Drawer for swap-in-place figure switching
    - filterModel pattern (null = all traces, string = single model)
key_files:
  created:
    - src/components/PlotlyChart.tsx
    - src/components/FigureDrawer.tsx
    - src/components/FigureSkeleton.tsx
    - src/plotly.d.ts
  modified:
    - src/lib/types.ts
    - src/lib/api.ts
    - src/components/LeaderboardTable.tsx
    - src/app/[category]/[benchmark]/page.tsx
    - src/app/providers.tsx
decisions:
  - Use extendTheme instead of createTheme for MUI v7 CSS variables API (colorSchemeSelector support)
  - PlotlyChart imported ONLY via next/dynamic — never directly — to keep it out of initial bundle
  - FigurePanel as internal sub-component to useFigureData per-figure with its own loading state
  - Deep merge Plotly layout theme overrides preserving xaxis/yaxis sub-properties
  - Persistent drawer variant enables swap-in-place without close/reopen animation
  - filterModel null = all models (column header click), string = single model (cell click)
  - scattergl downgraded to scatter — plotly-basic-dist-min has no WebGL scatter support
  - Force visible=true on filtered model trace — density plots default non-first traces to hidden
metrics:
  duration: 10min
  completed: "2026-03-11"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 3 Plan 02: Figure Drawer Frontend Summary

**One-liner:** Lazy-loaded Plotly drawer (persistent MUI, 50vw) with dual click patterns (cell = single model, header = all models), SWR fetching, dark/light theming, and scattergl-to-scatter downgrade for plotly-basic-dist compatibility.

## What Was Built

Complete figure drawer frontend feature:

- **PlotlyChart.tsx** — Lazy-loaded wrapper using `createPlotlyComponent(Plotly)` factory pattern with `plotly.js-basic-dist-min`. Only importable via `next/dynamic` — never directly. Config: `displayModeBar: 'hover'`, full-width 400px height.

- **FigureSkeleton.tsx** — MUI Skeleton loading placeholder (400px height, 100% width) shown while figure data loads.

- **FigureDrawer.tsx** — MUI Drawer (`anchor="right"`, `variant="persistent"`, 50vw on desktop, 100% on mobile). Contains:
  - `FigurePanel` internal component: calls `useFigureData` per figure, shows skeleton while loading, merges dark/light theme overrides before rendering PlotlyChart
  - `getPlotlyThemeOverrides(mode)` maps MUI color mode to Plotly layout properties
  - `filterModel` prop (null = all traces, string = single model + reference lines)
  - Escape key handler (persistent drawers skip automatic escape)
  - `onClick stopPropagation` on drawer Paper to prevent page-level close handler
  - Annotation swap from `layout.meta.annotations` keyed by model name
  - `scattergl` traces downgraded to `scatter` for plotly-basic-dist compatibility
  - Header shows benchmark name + "All models" or specific model name

- **LeaderboardTable.tsx** — Added `onCellClick`, `onColumnHeaderClick`, `activeBenchmarkSlug`, `slugsWithFigures` props. Pointer cursor and hover brightness when benchmark has figures. `event.stopPropagation()` on cell and header clicks to prevent page-level handler.

- **BenchmarkPage** — Persistent drawer state with `filterModel: string | null`, `handleCellClick` (single model), `handleColumnHeaderClick` (all models), `handlePageClick` (close on outside click), `useBenchmarkFigures` for figure detection, `slugsWithFigures` memo.

## Deviations from Plan

### Auto-fixed Issues (Tasks 1-2)

**1. [Rule 1 - Bug] Fixed pre-existing providers.tsx build failure**
- **Found during:** Task 1 build verification
- **Issue:** `colorSchemeSelector` in `createTheme()` options caused TypeScript error — MUI v7 moved CSS variables config to `extendTheme()` / `CssVarsThemeOptions`
- **Fix:** Changed `createTheme` to `extendTheme` in `src/app/providers.tsx`
- **Files modified:** src/app/providers.tsx
- **Commit:** 9143e9d

**2. [Rule 3 - Blocking] Added plotly.d.ts type declaration file**
- **Found during:** Task 1 build verification
- **Issue:** `plotly.js-basic-dist-min` has no bundled TypeScript types — build failed with "Could not find a declaration file"
- **Fix:** Created `src/plotly.d.ts` declaring both `plotly.js-basic-dist-min` and `react-plotly.js/factory` modules
- **Files modified:** src/plotly.d.ts (created)
- **Commit:** 9143e9d

### Human-Verified Fixes (Task 3 — applied during browser verification)

**3. Persistent drawer for swap-in-place**
- Changed `variant="temporary"` to `variant="persistent"` — figures swap without close/reopen animation
- Added Escape key handler via `useEffect` + `document.addEventListener`
- Added `onClick stopPropagation` on drawer Paper; page-level `onClick` on root Box closes drawer on outside click

**4. Dual click patterns (parity with ml-peg)**
- Column header click → `filterModel: null` → all model traces shown (Pattern 1)
- Cell click → `filterModel: modelName` → single model trace + unnamed reference lines (Pattern 2)
- Added `onColumnHeaderClick` prop to LeaderboardTable
- Header subtitle shows "All models" vs specific model name

**5. Density plot rendering fixes**
- `scattergl` traces downgraded to `scatter` — `plotly.js-basic-dist-min` excludes WebGL scatter
- Force `visible: true` on filtered model trace — density plots default all non-first traces to `visible: false`
- Swap `layout.annotations` from `layout.meta.annotations` by model name match

All Task 3 fixes committed as: 9c3ddf6

### Out-of-Scope Discoveries (Deferred)

- Pre-existing backend test failure: `test_benchmark_table_response_accepts_data_meta` — `BenchmarkTableResponse` expects `BenchmarkMeta` but test passes `Meta`. Not caused by this plan.

## Verification Results

- `bun run build` — PASSED. Plotly not in initial JS bundle (benchmark page: 7.54 kB, shared chunks: 102 kB).
- `uv run pytest -x -q` — 34 passed, 1 pre-existing failure (test_models.py, unrelated).
- Manual verification: APPROVED by human. All 10 verification steps passed (with fixes applied during verification).

## Self-Check: PASSED

Created files verified:
- src/components/PlotlyChart.tsx — exists
- src/components/FigureDrawer.tsx — exists
- src/components/FigureSkeleton.tsx — exists
- src/plotly.d.ts — exists

Commits verified:
- 9143e9d — Task 1: Install Plotly deps, add TS types, SWR hooks, PlotlyChart, FigureSkeleton
- ce391f9 — Task 2: Create FigureDrawer, wire onCellClick in LeaderboardTable, integrate in BenchmarkPage
- 9c3ddf6 — Task 3 fixes: persistent drawer, dual click patterns, density plot rendering
