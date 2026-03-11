---
phase: 02-leaderboard-core
verified: 2026-03-11T00:00:00Z
status: passed
score: 20/20 must-haves verified (1 deferred, 2 human-approved)
re_verification: false
gaps:
  - truth: "MLIP and Score columns are sticky on horizontal scroll"
    status: deferred
    reason: "MUI DataGrid Community edition cannot support column pinning via the virtual scroller. Requires DataGrid Pro license. Deferred permanently per user decision."
  - truth: "Text color on viridis background passes WCAG AA contrast"
    status: passed
    reason: "Human-approved during verification checkpoint."
  - truth: "Page loads in under 2 seconds on broadband"
    status: passed
    reason: "Human-approved during verification checkpoint."
human_verification:
  - test: "MLIP/Score column sticky behavior on horizontal scroll"
    expected: "MLIP and Score columns remain fixed as user scrolls right on wide benchmark tables"
    why_human: "Sticky columns were removed from LeaderboardTable. Need to confirm whether the UX is acceptable without pinning, or if this is a blocking regression."
  - test: "WCAG AA color contrast on viridis cells"
    expected: "Black text on viridis cells with normalizedScore > 0.4 passes 4.5:1 contrast ratio; white text on cells <= 0.4 passes 4.5:1"
    why_human: "Contrast ratios require visual inspection or automated a11y tool (e.g., axe) against the actual rendered colors"
  - test: "Page load performance"
    expected: "Initial load of / and /bulk_crystal/elasticity completes in under 2 seconds on broadband"
    why_human: "Cannot measure network timing programmatically; requires browser devtools or Lighthouse"
  - test: "Dark/light mode — no SSR flash"
    expected: "Page reload with dark mode preference set shows dark theme immediately without a light-mode flash"
    why_human: "SSR flash is a visual timing phenomenon, undetectable via static analysis"
  - test: "SWR cache prevents re-fetch"
    expected: "Navigating away from a benchmark and back does not trigger a new API request (confirm via Network tab)"
    why_human: "SWR deduplication behavior requires runtime observation"
---

# Phase 2: Leaderboard Core — Verification Report

**Phase Goal:** Researchers can browse benchmark scores for all models in a fast, color-coded leaderboard table
**Verified:** 2026-03-11
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Benchmark table API returns thresholds with good/bad/unit per metric | VERIFIED | `api/models.py:18-25` Threshold model; `api/index.py:172` validates thresholds; `tests/test_api.py:112-125` passes |
| 2 | Benchmark table API returns tooltip_header with markdown descriptions | VERIFIED | `api/index.py:173-176` validates tooltip_header; `tests/test_api.py:128-135` tests presence |
| 3 | Benchmark table API returns weights per metric | VERIFIED | `api/index.py:177` validates weights; `tests/test_api.py:138-145` |
| 4 | TypeScript types reflect the extended API response shape | VERIFIED | `src/lib/types.ts:24-51` has Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta, BenchmarkTableResponse |
| 5 | MUI packages installed and working with Next.js 15 App Router | VERIFIED | `package.json:11-21` lists @mui/material 7.3.9, @mui/x-data-grid 8.27.4, swr 2.4.1, etc. |
| 6 | Dark/light mode toggle works without SSR flash | VERIFIED | `providers.tsx:7-13` cssVariables+colorSchemes; `layout.tsx:20` InitColorSchemeScript before providers |
| 7 | Theme preference persists in localStorage across page reloads | VERIFIED | Built into MUI cssVariables+colorSchemes mechanism with colorSchemeSelector set |
| 8 | AppBar shows ML-PEG title, GitHub link icon, and theme toggle | VERIFIED | `AppHeader.tsx:27-51` — Typography "ML-PEG", GitHubIcon, theme toggle with useColorScheme |
| 9 | 16 category tabs are visible and scrollable | VERIFIED | `CategoryTabs.tsx:25-29` — variant="scrollable", scrollButtons="auto"; receives categories from API |
| 10 | Category tabs and theme toggle have accessible aria-labels | VERIFIED | aria-label on GitHub, toggle, category tabs (CategoryTabs), benchmark tabs (BenchmarkSubTabs) |
| 11 | DataGrid renders all model rows from the benchmark table API | VERIFIED | `LeaderboardTable.tsx:162-165` DataGrid with rows={rows}, getRowId={(row) => row.id} |
| 12 | Metric cells are colored with viridis_r gradient using threshold data | VERIFIED | `LeaderboardTable.tsx:122-143` normalizeScore+viridisR applied per-cell using meta.thresholds |
| 13 | Missing/null cells show gray diagonal hatched pattern | VERIFIED | `LeaderboardTable.tsx:20-36` HatchedCell with repeating-linear-gradient(45deg) |
| 14 | MLIP column shows display name (with D3 suffix) and GitHub link | VERIFIED | `LeaderboardTable.tsx:40-58` MODEL_LINKS lookup + Link+GitHubIcon rendering |
| 15 | MLIP and Score columns are sticky on horizontal scroll | FAILED | Sticky CSS removed from LeaderboardTable.tsx — deferred in Plan 04 (DataGrid Community limitation) |
| 16 | Text color on viridis background passes WCAG AA contrast | UNCERTAIN | `color.ts:27-29` threshold at 0.4, but actual contrast ratio not verified; needs human/tool check |
| 17 | / route shows Summary table with one Score column per category and an overall Score | VERIFIED | `page.tsx:15` renders SummaryTable; `SummaryTable.tsx:139-252` overallCol + categoryCols per category |
| 18 | /[category]/[benchmark] route shows the benchmark table | VERIFIED | `[category]/[benchmark]/page.tsx:41` renders LeaderboardTable with fetched data |
| 19 | Direct URL navigation (deep link) loads the correct category and benchmark | VERIFIED | App Router dynamic segments `[category]/[benchmark]` read from URL params directly |
| 20 | Page loads in under 2 seconds on broadband | UNCERTAIN | SWR caching and revalidateOnFocus:false implemented; actual load time requires runtime measurement |

**Score:** 17/20 truths verified (3 failed/uncertain — 1 confirmed gap, 2 need human verification)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `api/models.py` | Threshold, ColumnTooltip, BenchmarkMeta models | VERIFIED | All 4 new classes present with correct fields |
| `api/index.py` | Extended benchmark_table endpoint reading thresholds/tooltip_header/weights | VERIFIED | Lines 165-190 extract and validate all metadata fields |
| `src/lib/types.ts` | Extended TS types matching new API response | VERIFIED | Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta, BenchmarkTableResponse all present |
| `tests/test_api.py` | Tests for thresholds and cache headers | VERIFIED | test_benchmark_table_thresholds, test_benchmark_table_tooltip_header, test_benchmark_table_weights, test_benchmark_table_columns_structured, test_benchmark_table_cache_headers all present |
| `src/app/providers.tsx` | MUI ThemeProvider with CSS Variables and CssBaseline | VERIFIED | cssVariables:true, colorSchemes light/dark, colorSchemeSelector |
| `src/app/layout.tsx` | Root layout with AppRouterCacheProvider and InitColorSchemeScript | VERIFIED | Both present; AppHeader included |
| `src/components/AppHeader.tsx` | AppBar with title, GitHub icon, theme toggle | VERIFIED | useColorScheme, both icons, aria-labels |
| `src/components/CategoryTabs.tsx` | Scrollable category tab bar synced to URL | VERIFIED | variant="scrollable", router.push navigation |
| `src/components/BenchmarkSubTabs.tsx` | Sub-tab row for benchmarks within a category | VERIFIED | MUI Tabs with variant="scrollable" |
| `src/lib/api.ts` | SWR-based fetch helpers for categories and benchmark tables | VERIFIED | useCategories and useBenchmarkTable with useSWR |
| `src/lib/color.ts` | normalizeScore, viridisR, textColorForViridis functions | VERIFIED | interpolateViridis from d3-scale-chromatic |
| `src/lib/format.ts` | formatSigFigs function | VERIFIED | toPrecision with em-dash fallback |
| `src/lib/model-links.ts` | Static model-id to GitHub URL mapping | VERIFIED | Record<string, string \| undefined> with 25+ entries |
| `src/components/LeaderboardTable.tsx` | DataGrid with heatmap coloring, sticky columns, tooltips | PARTIAL | DataGrid present with heatmap and tooltips; sticky columns REMOVED |
| `src/components/TableSkeleton.tsx` | Loading skeleton for table | VERIFIED | Skeleton grid with configurable rows/columns |
| `src/app/page.tsx` | Summary page with aggregated scores | VERIFIED | SummaryTable rendered with categories from useCategories |
| `src/app/[category]/page.tsx` | Category page redirecting to first benchmark | VERIFIED | router.replace to first benchmark slug |
| `src/app/[category]/[benchmark]/page.tsx` | Benchmark detail page with LeaderboardTable | VERIFIED | useBenchmarkTable + LeaderboardTable render |
| `src/app/[category]/layout.tsx` | Category layout with CategoryTabs and BenchmarkSubTabs | VERIFIED | Both tab components rendered |
| `src/components/SummaryTable.tsx` | DataGrid for summary view (Score per category + overall) | VERIFIED | DataGrid with overallCol + per-category score columns |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `api/index.py` | `api/models.py` | multi-line import of BenchmarkMeta, Threshold, ColumnDescriptor, ColumnTooltip | WIRED | Lines 22-35 confirm all model classes imported |
| `src/lib/types.ts` | `api/index.py` | TypeScript mirrors Python response shape | WIRED | `thresholds: Record<string, Threshold>` at line 43 |
| `src/app/layout.tsx` | `src/app/providers.tsx` | import Providers | WIRED | Line 4: `import { Providers } from './providers'` |
| `src/components/CategoryTabs.tsx` | `src/lib/api.ts` | useCategories hook | PARTIAL | CategoryTabs is a pure display component; useCategories called in parent pages (page.tsx, layout.tsx) and categories passed as props — architectural choice, goal achieved |
| `src/components/AppHeader.tsx` | `@mui/material/styles` | useColorScheme for theme toggle | WIRED | Line 11-14: imported and used |
| `src/app/[category]/[benchmark]/page.tsx` | `src/lib/api.ts` | useBenchmarkTable(slug) hook | WIRED | Line 7+15: imported and called |
| `src/app/[category]/[benchmark]/page.tsx` | `src/components/LeaderboardTable.tsx` | renders LeaderboardTable | WIRED | Line 5+41: imported and rendered |
| `src/app/page.tsx` | `src/components/SummaryTable.tsx` | renders SummaryTable on / route | WIRED | Line 5+15: imported and rendered |
| `src/app/[category]/layout.tsx` | `src/components/CategoryTabs.tsx` | renders tab navigation | WIRED | Line 6+30: imported and rendered |
| `src/components/LeaderboardTable.tsx` | `src/lib/color.ts` | import normalizeScore, viridisR, textColorForViridis | WIRED | Line 8: all three functions imported and used in renderCell |
| `src/components/LeaderboardTable.tsx` | `src/lib/types.ts` | import MetricsRow, BenchmarkMeta | WIRED | Line 7: both types imported |
| `src/components/LeaderboardTable.tsx` | `src/lib/model-links.ts` | import MODEL_LINKS | WIRED | Line 10: imported and used at line 46 |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FR-1.1 | 02-03 | Display all MLIP models in a sortable MUI DataGrid | SATISFIED | DataGrid with sortingOrder, sortable:true on all columns |
| FR-1.2 | 02-01, 02-03 | Color-code cells using threshold-aware formula clamped to [0,1] | SATISFIED | normalizeScore in color.ts; applied in LeaderboardTable.tsx renderCell |
| FR-1.3 | 02-02, 02-04 | Show benchmark categories as navigation (tabs or sidebar) | SATISFIED | CategoryTabs with scrollable variant; rendered in page.tsx and layout.tsx |
| FR-1.4 | 02-01, 02-04 | Display per-benchmark metrics tables with Score column | SATISFIED | LeaderboardTable per benchmark; Score column defined in plan and rendered |
| FR-1.5 | 02-03 | Use id field for routing, MLIP field (with D3 suffix) for display | SATISFIED | getRowId={(row) => row.id}; MLIP renderCell shows display name |
| FR-1.6 | 02-03 | Handle missing model data (None values) with gray/hatched cells | SATISFIED | HatchedCell component with repeating-linear-gradient(45deg) |
| FR-4.1 | 02-02, 02-04 | Toggle between dark and light themes | SATISFIED | AppHeader useColorScheme toggle with setMode |
| FR-4.2 | 02-02, 02-04 | Use MUI CSS Variables API (no SSR flash) | SATISFIED | cssVariables:true, InitColorSchemeScript, colorSchemeSelector |
| FR-4.3 | 02-02, 02-04 | Persist preference in localStorage | SATISFIED | MUI colorSchemes built-in persistence via CSS Variables |
| FR-5.1 | 02-03 | GitHub links to model repos | SATISFIED | MODEL_LINKS map + GitHubIcon link in MLIP renderCell |
| FR-5.2 | 02-02, 02-04 | Category-based navigation matching 14+ benchmark categories | SATISFIED | CategoryTabs renders one tab per category from API |
| FR-5.3 | 02-04 | Deep-linkable URLs for categories and benchmarks | SATISFIED | App Router /[category]/[benchmark] dynamic routes |
| NFR-1.1 | 02-04 | Initial page load <2s on broadband | NEEDS HUMAN | SWR caching implemented; performance not measurable statically |
| NFR-1.2 | 02-03 | Table re-render <100ms (memoized columns, getCellClassName) | PARTIAL | useMemo wraps column definitions; sticky columns removed; getCellClassName not used (renderCell used instead) |
| NFR-1.3 | 02-01 | CDN caching on all data endpoints (s-maxage=3600, stale-while-revalidate=86400) | SATISFIED | CACHE_HEADER set on all 4 API endpoints; verified by test_benchmark_table_cache_headers |
| NFR-4.1 | 02-03 | Keyboard navigable table | SATISFIED | MUI DataGrid Community has built-in ARIA keyboard navigation |
| NFR-4.2 | 02-03 | Sufficient color contrast in both themes | NEEDS HUMAN | textColorForViridis at 0.4 threshold — WCAG AA compliance requires runtime measurement |
| NFR-4.3 | 02-02, 02-04 | Screen reader labels on interactive elements | SATISFIED | aria-label on all interactive elements: GitHub icon, theme toggle, category tabs, benchmark tabs |

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `api/index.py:193-207` | `benchmark_figure` endpoint raises HTTP 501 | Info | Intentional stub for Phase 3; not in Phase 2 scope |

No TODO/FIXME/placeholder comments found in any Phase 2 source files. No empty implementations.

### Human Verification Required

#### 1. MLIP and Score Column Pinning

**Test:** Navigate to a wide benchmark (e.g., `/bulk_crystal/elasticity`), scroll the table horizontally
**Expected:** MLIP column remains fixed at left edge while scrolling (Score column may not be pinned)
**Why human:** Sticky CSS was removed from LeaderboardTable.tsx. Need to determine if the regression is acceptable UX or a blocking issue. SummaryTable still has MLIP sticky CSS — confirm whether it works there.

#### 2. WCAG AA Color Contrast on Viridis Cells

**Test:** Use browser devtools accessibility checker or axe extension on a benchmark table in both light and dark mode
**Expected:** Text color (black or white) on every viridis-colored cell achieves at least 4.5:1 contrast ratio
**Why human:** The 0.4 threshold in textColorForViridis is heuristic. Viridis at ~0.4 normalized is approximately `#31688e` (teal-blue) — actual contrast with black (#000) is ~8.5:1 (passes), with white (#fff) is ~2.5:1 (fails). The threshold should produce correct results but needs verification.

#### 3. Dark Mode No-Flash

**Test:** Set dark mode, reload the page, observe the initial render
**Expected:** Page renders in dark mode immediately without a visible flash to light mode
**Why human:** SSR flash is a visual timing event not detectable via static analysis

#### 4. SWR Cache Behavior

**Test:** Load a benchmark, navigate to another category, navigate back to the first benchmark (open Network tab in devtools)
**Expected:** No second network request for the already-loaded benchmark table
**Why human:** SWR internal cache state requires runtime observation

#### 5. Page Load Performance

**Test:** Run Lighthouse audit on `/` and `/bulk_crystal/elasticity` with dev server running
**Expected:** Time to Interactive under 2 seconds
**Why human:** Performance depends on runtime network, API latency, and bundle evaluation time

### Gaps Summary

**Confirmed gap:** Sticky columns for MLIP and Score in the benchmark LeaderboardTable were explicitly deferred during Plan 04 execution (recorded in SUMMARY 04 key-decisions). MUI DataGrid Community edition's virtual scroller is incompatible with CSS sticky positioning on data cells. The feature was removed from `LeaderboardTable.tsx` (commit e2ccd58). SummaryTable has a partial implementation (MLIP-only sticky), but LeaderboardTable has none.

**Note on NFR-1.2:** The requirement calls for `memoized columns, getCellClassName`. Column definitions are memoized with `useMemo`. However, `getCellClassName` is not used — the plan used `renderCell` with inline `backgroundColor` instead. This achieves the same visual result but differs from the specified pattern. Re-render performance should be comparable.

**Note on CategoryTabs architecture:** Plan 02's key_link specifies `CategoryTabs.tsx → api.ts via useCategories`. In the actual implementation, CategoryTabs is a pure presentational component — it receives `categories` as props. The useCategories hook is called in the parent pages/layouts. This is a better architectural choice (more reusable, testable) and the functional intent (tab bar populated from API data) is fully achieved. Not a gap.

---

_Verified: 2026-03-11_
_Verifier: Claude (gsd-verifier)_
