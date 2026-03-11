---
phase: 03-figure-drawer
plan: 02
subsystem: frontend
tags: [plotly, figure-drawer, mui-drawer, swr, lazy-loading, dark-mode]
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
metrics:
  duration: 4min
  completed: "2026-03-11"
  tasks_completed: 2
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 3 Plan 02: Figure Drawer Frontend Summary

**One-liner:** Lazy-loaded Plotly drawer with MUI right-side panel, SWR figure fetching, dark/light theming, and cell-click wiring in the leaderboard table.

## What Was Built

Complete figure drawer frontend feature:

- **PlotlyChart.tsx** — Lazy-loaded wrapper using `createPlotlyComponent(Plotly)` factory pattern with `plotly.js-basic-dist-min`. Only importable via `next/dynamic` — never directly. Config: `displayModeBar: 'hover'`, full-width 400px height.

- **FigureSkeleton.tsx** — MUI Skeleton loading placeholder (400px height, 100% width) shown while figure data loads.

- **FigureDrawer.tsx** — MUI Drawer (`anchor="right"`, 50vw on desktop, 100% on mobile). Contains:
  - `FigurePanel` internal component: calls `useFigureData` per figure, shows skeleton while loading, merges dark/light theme overrides before rendering PlotlyChart
  - `getPlotlyThemeOverrides(mode)` maps MUI color mode to Plotly layout properties
  - Header shows benchmark name + model name with close IconButton
  - Fetch only when drawer is open (`open ? benchmarkSlug : null`)
  - Empty state and error state handled

- **LeaderboardTable.tsx** — Added `onCellClick`, `activeBenchmarkSlug`, `slugsWithFigures` props. Pointer cursor and hover brightness when benchmark has figures. Skips MLIP/id columns on click.

- **BenchmarkPage** — Added drawer state, `handleCellClick` callback, `useBenchmarkFigures` to detect figure availability, `slugsWithFigures` memo, FigureDrawer rendering.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing providers.tsx build failure**
- **Found during:** Task 1 build verification
- **Issue:** `colorSchemeSelector` in `createTheme()` options caused TypeScript error "Object literal may only specify known properties" — MUI v7 moved CSS variables config to `extendTheme()` / `CssVarsThemeOptions`
- **Fix:** Changed `createTheme` to `extendTheme` in `src/app/providers.tsx`
- **Files modified:** src/app/providers.tsx
- **Commit:** 9143e9d

**2. [Rule 3 - Blocking] Added plotly.d.ts type declaration file**
- **Found during:** Task 1 build verification
- **Issue:** `plotly.js-basic-dist-min` has no bundled TypeScript types — build failed with "Could not find a declaration file"
- **Fix:** Created `src/plotly.d.ts` declaring both `plotly.js-basic-dist-min` and `react-plotly.js/factory` modules
- **Files modified:** src/plotly.d.ts (created)
- **Commit:** 9143e9d

### Out-of-Scope Discoveries (Deferred)

- Pre-existing backend test failure: `test_benchmark_table_response_accepts_data_meta` — `BenchmarkTableResponse` expects `BenchmarkMeta` but test passes `Meta`. Not caused by this plan. Logged for deferred fix.

## Verification Results

- `bun run build` — PASSED. Plotly not in initial JS bundle (benchmark page: 7.15 kB, shared chunks: 102 kB, no plotly.js visible in chunk output).
- `uv run pytest -x -q` — 34 passed, 1 pre-existing failure (test_models.py, unrelated to this plan).
- Manual verification: PENDING — Task 3 is a human-verify checkpoint.

## Self-Check: PASSED

Created files verified:
- src/components/PlotlyChart.tsx — exists
- src/components/FigureDrawer.tsx — exists
- src/components/FigureSkeleton.tsx — exists
- src/plotly.d.ts — exists

Commits verified:
- 9143e9d — Task 1: Install Plotly deps, add TS types, SWR hooks, PlotlyChart, FigureSkeleton
- ce391f9 — Task 2: Create FigureDrawer, wire onCellClick in LeaderboardTable, integrate in BenchmarkPage
