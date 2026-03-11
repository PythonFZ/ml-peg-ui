---
phase: 02-leaderboard-core
plan: "02"
subsystem: ui
tags: [mui, nextjs, dark-mode, swr, react, typescript, tabs, appbar]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: Next.js app scaffold, TypeScript config, Category/MetricsRow types
provides:
  - MUI ThemeProvider with CSS Variables dark/light mode, zero SSR flash
  - AppHeader component with title, GitHub link, theme toggle
  - CategoryTabs component: scrollable tabs synced to URL
  - BenchmarkSubTabs component: scrollable sub-tabs per category
  - SWR fetch hooks: useCategories and useBenchmarkTable
affects:
  - 02-03-leaderboard-page
  - 02-04-benchmark-table
  - 03-data-visualization

# Tech tracking
tech-stack:
  added:
    - "@mui/material@7.3.9 — component library with CSS Variables theming"
    - "@mui/x-data-grid@8.27.4 — data grid for leaderboard table"
    - "@mui/icons-material@7.3.9 — GitHub, Brightness icons"
    - "@mui/material-nextjs@7.3.9 — AppRouterCacheProvider for Next.js 15"
    - "@emotion/react + @emotion/styled — MUI styling engine"
    - "swr@2.4.1 — stale-while-revalidate data fetching"
    - "d3-scale-chromatic@3.1.0 — color scales for heatmap"
  patterns:
    - "MUI CSS Variables API: createTheme({ cssVariables: true, colorSchemes: { light: {}, dark: {} } })"
    - "Zero SSR flash pattern: getInitColorSchemeScript() in layout body before providers"
    - "AppRouterCacheProvider wraps all MUI consumers for Next.js 15 App Router"
    - "useColorScheme() for theme toggle in client components"
    - "useSWR conditional fetch: null key skips request (useBenchmarkTable)"

key-files:
  created:
    - src/app/providers.tsx
    - src/components/AppHeader.tsx
    - src/components/CategoryTabs.tsx
    - src/components/BenchmarkSubTabs.tsx
    - src/lib/api.ts
  modified:
    - src/app/layout.tsx
    - package.json
    - bun.lock

key-decisions:
  - "MUI cssVariables: true eliminates SSR flash without next-themes — built-in MUI mechanism"
  - "getInitColorSchemeScript() renders before providers to block hydration mismatch"
  - "useColorScheme() hook for theme toggle — only works inside ThemeProvider with colorSchemes"
  - "SWR revalidateOnFocus: false — prevents unnecessary refetch when switching tabs"

patterns-established:
  - "Theme pattern: cssVariables in createTheme, colorSchemes for dark/light, getInitColorSchemeScript in layout"
  - "Navigation pattern: useRouter.push for URL-synced tabs"
  - "SWR pattern: conditional fetch with null key, deduplicated across components"
  - "Component pattern: 'use client' for all interactive/hooks components, layout.tsx stays server component"

requirements-completed: [FR-4.1, FR-4.2, FR-4.3, FR-1.3, FR-5.2, NFR-4.3]

# Metrics
duration: 2min
completed: "2026-03-11"
---

# Phase 2 Plan 02: App Shell and MUI Theme Setup Summary

**MUI CSS Variables dark/light mode with zero SSR flash, sticky AppBar with GitHub link and theme toggle, scrollable URL-synced category/benchmark tabs, and SWR data fetching hooks**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-11T06:47:55Z
- **Completed:** 2026-03-11T06:49:20Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- MUI 7 installed with CSS Variables API and full dark/light mode support (no SSR flash)
- AppHeader renders sticky AppBar with ML-PEG title, GitHub icon link, and dark/light theme toggle
- CategoryTabs renders scrollable tabs with a Summary tab + one per category, URL-synced via router.push
- BenchmarkSubTabs renders smaller scrollable sub-tabs for benchmarks within a category
- SWR hooks (useCategories, useBenchmarkTable) ready for data fetching with deduplication

## Task Commits

Each task was committed atomically:

1. **Task 1: Install MUI packages and wire theme providers** - `c1aff8f` (feat)
2. **Task 2: Create AppHeader, CategoryTabs, BenchmarkSubTabs, and SWR fetch hooks** - `cdc4d36` (feat)

## Files Created/Modified
- `src/app/providers.tsx` - MUI ThemeProvider with cssVariables and colorSchemes (light/dark)
- `src/app/layout.tsx` - Updated with AppRouterCacheProvider, getInitColorSchemeScript, suppressHydrationWarning
- `src/components/AppHeader.tsx` - Sticky AppBar with title, GitHub icon, useColorScheme theme toggle
- `src/components/CategoryTabs.tsx` - Scrollable MUI Tabs with Summary + category tabs, URL-synced
- `src/components/BenchmarkSubTabs.tsx` - Compact scrollable sub-tabs for benchmarks per category
- `src/lib/api.ts` - SWR fetcher, useCategories, useBenchmarkTable hooks
- `package.json` - Added 8 new dependencies (MUI, Emotion, SWR, d3-scale-chromatic)
- `bun.lock` - Updated lockfile

## Decisions Made
- Used MUI's built-in `cssVariables: true` + `colorSchemes` for dark/light mode — eliminates SSR flash natively without next-themes wrapper
- Set `revalidateOnFocus: false` on SWR hooks — prevents unnecessary API calls when users switch browser tabs
- `useBenchmarkTable` uses null key pattern (slug ? url : null) for conditional fetching without code branching
- All interactive elements given explicit aria-labels for accessibility compliance (NFR-4.3)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- App shell complete: theme, header, and navigation tabs ready for page content
- useCategories and useBenchmarkTable hooks ready to be consumed by leaderboard page
- BenchmarkSubTabs ready to render when a category is selected
- Next plan (02-03) can build leaderboard page using these components and hooks

---
*Phase: 02-leaderboard-core*
*Completed: 2026-03-11*

## Self-Check: PASSED

- src/app/providers.tsx: FOUND
- src/app/layout.tsx: FOUND
- src/components/AppHeader.tsx: FOUND
- src/components/CategoryTabs.tsx: FOUND
- src/components/BenchmarkSubTabs.tsx: FOUND
- src/lib/api.ts: FOUND
- Commit c1aff8f: FOUND
- Commit cdc4d36: FOUND
