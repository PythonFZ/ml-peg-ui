---
phase: 05-ux-polish
verified: 2026-03-12T10:40:30Z
status: gaps_found
score: 12/14 must-haves verified
re_verification: null
gaps:
  - truth: "Typing in the benchmark filter autocomplete narrows the visible columns; multiple benchmarks can be selected simultaneously"
    status: failed
    reason: "The ROADMAP success criterion #2 requires a multi-entry benchmark column filter. The implementation provides a single-select navigation autocomplete that routes to a benchmark page — it does not narrow visible columns and does not allow multiple benchmark selections simultaneously. FR-2.2 (Multi-entry autocomplete for filtering by benchmark name) is not satisfied by a navigation control."
    artifacts:
      - path: "src/components/AppHeader.tsx"
        issue: "Benchmark Autocomplete is single-select with value=null (ephemeral navigation), not a multi-select filter that narrows DataGrid columns"
      - path: "src/app/[category]/[benchmark]/page.tsx"
        issue: "No benchmark multi-select state or column filtering by selected benchmarks exists"
    missing:
      - "Multi-entry Autocomplete (multiple prop) in AppHeader for selecting benchmark names as chips"
      - "State in benchmark page (or FilterContext) to hold selectedBenchmarks: string[]"
      - "columnVisibilityModel logic that hides columns not in selectedBenchmarks when filter is active"
human_verification:
  - test: "Open the leaderboard. Type in the model filter in the AppBar and select two models."
    expected: "Leaderboard rows narrow to only the selected models; chips appear in the autocomplete; selection persists when navigating to another benchmark tab."
    why_human: "DataGrid row filtering interaction and cross-navigation persistence cannot be verified programmatically."
  - test: "Type in the column filter text input on a benchmark page."
    expected: "Metric columns not matching the filter text are hidden; MLIP and Score columns remain visible; clearing the input restores all columns."
    why_human: "MUI DataGrid columnVisibilityModel rendering requires live browser interaction."
  - test: "Move a metric weight slider below the table."
    expected: "Score column values update immediately without a network request (verified in DevTools Network tab)."
    why_human: "Client-side vs server-side computation can only be confirmed in a running browser with DevTools."
  - test: "Move a category weight slider on the summary (home) page."
    expected: "The Overall Score column values update and the sort order changes accordingly."
    why_human: "Summary table category weight interaction requires live browser."
  - test: "Visit the app for the first time (clear localStorage first)."
    expected: "Tutorial modal appears automatically with 3 steps. Next/Back/Done navigation works. After Done, modal does not reappear on refresh."
    why_human: "localStorage gating and modal multi-step navigation requires live browser."
  - test: "Click the Tutorial button in the AppBar after dismissing the modal."
    expected: "Tutorial modal reopens."
    why_human: "Requires live browser interaction."
  - test: "Hover over a model name in the MLIP column."
    expected: "A tooltip appears after ~300ms showing architecture, parameters, and training data (where available)."
    why_human: "MUI Tooltip hover behavior requires live browser."
---

# Phase 5: UX Polish Verification Report

**Phase Goal:** Researchers can filter the leaderboard by model and benchmark, adjust metric weights, and access contextual help
**Verified:** 2026-03-12T10:40:30Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Typing in model filter autocomplete narrows leaderboard rows to matching models | ? HUMAN | `filteredRows` logic present in benchmark/page.tsx:59-65; `selectedModels` from context used; requires browser to confirm |
| 2 | Multiple models can be selected simultaneously as chips | ? HUMAN | `AppHeader.tsx` has `multiple` Autocomplete with `renderTags` chips; requires browser to confirm |
| 3 | Model filter persists across benchmark/category navigation | ? HUMAN | FilterProvider wraps both AppHeader + children in layout.tsx; context holds selectedModels array; requires browser navigation to confirm |
| 4 | Benchmark quick-search navigates to the selected benchmark tab | ? HUMAN | `router.push(option.href)` on onChange in AppHeader.tsx:97-100; requires browser to confirm |
| 5 | Column filter text input hides non-matching columns; MLIP and Score always visible | ? HUMAN | `columnVisibilityModel` useMemo computed from colFilter in page.tsx:137-144; MLIP/Score/id excluded from map; requires browser to confirm |
| 6 | Column filter resets when switching to a different benchmark | ✓ VERIFIED | `useEffect(() => { setColFilter(''); ... }, [benchmark])` at page.tsx:51-56 |
| 7 | Typing in benchmark filter autocomplete narrows visible columns; multiple benchmarks selectable | ✗ FAILED | Implementation is single-select navigation only; no multi-select column-filter for benchmarks exists |
| 8 | Moving a weight slider recalculates Score column in real time without server round-trip | ? HUMAN | `enrichedRows` useMemo with computeScore at page.tsx:68-74; no API call in chain; requires browser + DevTools to confirm "no network request" |
| 9 | Changing threshold Good/Bad inputs re-renders all cell heatmap colors | ? HUMAN | `thresholdOverrides` passed to LeaderboardTable; renderCell uses `thresholdOverrides?.[col.id] ?? meta.thresholds[col.id]`; requires browser to confirm |
| 10 | Reset button restores all weights and thresholds to API defaults | ✓ VERIFIED | `handleReset` sets both `setWeightOverrides({})` and `setThresholdOverrides({})` at page.tsx:131-134 |
| 11 | Auto re-sort by Score only when Score is the active sort column | ✓ VERIFIED | `handleWeightChange` checks `prev[0].field === 'Score'` before replacing sortModel identity at page.tsx:108-113 |
| 12 | Category weight sliders on summary page adjust the Overall Score | ✓ VERIFIED | `categoryWeights` state drives `weightedOverallSum / totalOverallWeight` in SummaryTable.tsx:99-122 |
| 13 | First-time visitor sees a multi-step tutorial modal | ? HUMAN | `useTutorialModal` reads localStorage in useEffect; open initialized false; TutorialModal rendered in AppHeader; requires browser to confirm |
| 14 | FAQ accordion below the table answers common questions | ✓ VERIFIED | `FaqSection` rendered in benchmark/page.tsx:241 and home page.tsx:21; 5 items in FAQ_ITEMS array |

**Score:** 5/14 verified programmatically, 7/14 require human verification, 2/14 failed or need regression

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/filter-context.tsx` | Shared React context for model filter state | ✓ VERIFIED | Exports `FilterProvider` and `useFilterContext`; 27 lines; substantive |
| `src/components/AppHeader.tsx` | Model Autocomplete + Benchmark quick-search in AppBar | ✓ WIRED | 151 lines; imports useFilterContext, useModels, useCategories, useTutorialModal, TutorialModal; both Autocompletes present |
| `src/components/LeaderboardTable.tsx` | columnVisibilityModel + thresholdOverrides + hover cards | ✓ WIRED | Props accepted and passed to DataGrid; MODEL_METADATA used in MLIP renderCell |
| `src/lib/score-calc.ts` | computeScore function | ✓ VERIFIED | Exports computeScore, WeightOverrides, ThresholdOverrides; imports normalizeScore from color.ts |
| `src/lib/score-calc.test.ts` | Unit tests for computeScore | ✓ VERIFIED | 5 tests, all passing |
| `src/components/WeightControls.tsx` | Column-aligned vertical sliders with threshold inputs | ✓ VERIFIED | 161 lines; vertical Sliders, G/B TextFields, Reset button |
| `src/components/SummaryTable.tsx` | Category weight sliders for summary score adjustment | ✓ WIRED | categoryWeights state drives weighted overall; inline slider row rendered |
| `src/components/TutorialModal.tsx` | Multi-step welcome dialog with localStorage gate | ✓ VERIFIED | 139 lines; useTutorialModal hook with useEffect localStorage guard; 3-step MobileStepper |
| `src/components/FaqSection.tsx` | MUI Accordion FAQ section | ✓ VERIFIED | 60 lines; 5 FAQ items in MUI Accordion |
| `src/lib/model-links.ts` | MODEL_METADATA constant for hover card data | ✓ VERIFIED | MODEL_METADATA exported; ModelMetadata interface; 15+ models with architecture/params/training |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/filter-context.tsx` | `src/app/layout.tsx` | `<FilterProvider>` wraps AppHeader + children | ✓ WIRED | layout.tsx:24-27 — FilterProvider wraps both AppHeader and {children} |
| `src/components/AppHeader.tsx` | `src/lib/filter-context.tsx` | `useFilterContext` for selectedModels | ✓ WIRED | AppHeader.tsx:19,33 — imports and calls useFilterContext |
| `src/app/[category]/[benchmark]/page.tsx` | `src/lib/filter-context.tsx` | `selectedModels.*filter` | ✓ WIRED | page.tsx:11,42,62 — imports useFilterContext, destructures selectedModels, used in filteredRows |
| `src/lib/score-calc.ts` | `src/lib/color.ts` | `import.*normalizeScore.*from.*color` | ✓ WIRED | score-calc.ts:1 — `import { normalizeScore } from './color'` |
| `src/app/[category]/[benchmark]/page.tsx` | `src/lib/score-calc.ts` | `computeScore` | ✓ WIRED | page.tsx:12,72 — imports and calls computeScore in enrichedRows useMemo |
| `src/components/WeightControls.tsx` | `src/app/[category]/[benchmark]/page.tsx` | `onWeightChange\|onThresholdChange` callbacks | ✓ WIRED | page.tsx:232-238 — WeightControls receives handleWeightChange, handleThresholdChange, handleReset |
| `src/components/TutorialModal.tsx` | `localStorage` | `mlpeg_tutorial_seen` flag read in useEffect | ✓ WIRED | TutorialModal.tsx:124-129 — useEffect reads localStorage.getItem('mlpeg_tutorial_seen') |
| `src/components/AppHeader.tsx` | `src/components/TutorialModal.tsx` | Tutorial button opens modal via `useTutorialModal` | ✓ WIRED | AppHeader.tsx:20,30,117,148 — imports useTutorialModal and TutorialModal; Tutorial button calls reopenTutorial |
| `src/components/LeaderboardTable.tsx` | `src/lib/model-links.ts` | `MODEL_METADATA` lookup for hover card | ✓ WIRED | LeaderboardTable.tsx:11,71 — imports MODEL_METADATA, used in mlipCol renderCell |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| FR-2.1 | 05-01, 05-03 | Multi-entry autocomplete for filtering by model name | ✓ SATISFIED | AppHeader has `multiple` Autocomplete with chip rendering; useFilterContext drives row filtering in all pages |
| FR-2.2 | 05-01 | Multi-entry autocomplete for filtering by benchmark name | ✗ BLOCKED | Implementation provides single-select navigation autocomplete (Go to benchmark), NOT a multi-entry column-narrowing filter. ROADMAP criterion "narrows visible columns; multiple benchmarks selectable simultaneously" is not implemented. |
| FR-2.3 | 05-01 | Client-side filtering (data is small enough) | ✓ SATISFIED | All filtering (filteredRows, columnVisibilityModel) computed via useMemo with no API calls; computeScore is a pure client-side function |
| FR-7.1 | 05-02, 05-03 | Sliders to adjust metric weights per benchmark | ✓ SATISFIED | WeightControls renders vertical Sliders per metric column; SummaryTable has inline category sliders |
| FR-7.2 | 05-02 | Client-side score recalculation using weight data from API | ✓ SATISFIED | computeScore in score-calc.ts recalculates from weightOverrides + thresholdOverrides; enrichedRows useMemo in page.tsx; 5 unit tests pass |
| FR-7.3 | 05-02 | Category weight adjustment on summary view | ✓ SATISFIED | SummaryTable.tsx categoryWeights state drives weighted overall formula at lines 99-122; slider row present |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| No blockers found | — | — | — | — |

No TODO/FIXME/placeholder comments found. No empty return stubs. No console.log-only handlers. All handlers call real state setters or router navigation.

### Human Verification Required

#### 1. Model Filter Row Narrowing

**Test:** Open the running app. Type a model name (e.g., "mace") in the "Filter models..." autocomplete in the AppBar.
**Expected:** Leaderboard rows narrow to only models with "mace" in their display name. Chips appear for each selected model.
**Why human:** DataGrid row filtering result requires visual inspection of rendered rows.

#### 2. Model Filter Cross-Navigation Persistence

**Test:** Select a model in the filter, then navigate to a different benchmark tab via the category sidebar.
**Expected:** The selected model chip remains in the AppBar filter; the new benchmark page shows only the filtered rows.
**Why human:** Cross-route state persistence requires browser navigation to verify.

#### 3. Column Filter Behavior

**Test:** On a benchmark page, type a metric abbreviation in the "Filter columns..." text input.
**Expected:** Metric columns not matching the text are hidden; MLIP and Score columns remain visible at all times.
**Why human:** MUI DataGrid columnVisibilityModel rendering requires browser.

#### 4. Weight Slider Real-Time Score Update (No Network Request)

**Test:** Open DevTools Network tab. Move a metric weight slider below the table.
**Expected:** Score column values update immediately; no XHR/fetch request appears in DevTools.
**Why human:** "No server round-trip" can only be confirmed in browser DevTools.

#### 5. Tutorial Modal First-Visit Flow

**Test:** Clear localStorage (`localStorage.removeItem('mlpeg_tutorial_seen')`), then reload the page.
**Expected:** Tutorial modal appears automatically. Next/Back navigation between 3 steps works. Clicking Done closes modal and sets the flag. Reloading does not show modal again.
**Why human:** localStorage gating and multi-step modal navigation require live browser.

#### 6. Tutorial Reopen from AppBar

**Test:** Click the Tutorial button (help icon) in the AppBar after dismissing the modal.
**Expected:** Tutorial modal reopens at step 1.
**Why human:** Button click interaction requires browser.

#### 7. Model Hover Card

**Test:** Hover over a model name in the MLIP column (e.g., "mace-mp-0a") for ~300ms.
**Expected:** Tooltip appears showing Architecture: MACE, Parameters: ~5M, Training: MPtrj, and the GitHub URL.
**Why human:** MUI Tooltip hover requires browser interaction; 300ms delay cannot be verified statically.

### Gaps Summary

**1 automated gap (FR-2.2 — Benchmark Multi-Filter):**

The ROADMAP Phase 5 success criterion #2 specifies: "Typing in the benchmark filter autocomplete narrows the visible columns; multiple benchmarks can be selected simultaneously." FR-2.2 in REQUIREMENTS.md defines: "Multi-entry autocomplete for filtering by benchmark name."

The implementation provides a *single-select navigation autocomplete* labeled "Go to benchmark..." that calls `router.push(option.href)` when a benchmark is selected and then clears. This is useful for navigation but does not satisfy the requirement for multi-entry column filtering by benchmark.

The column-filter that *does* exist (`colFilter` TextField in the benchmark page) filters by column name substring — it is not an autocomplete and does not allow selecting specific benchmarks by name with chips.

To close this gap, a multi-select Autocomplete with benchmark names as options should be added to the AppBar (or benchmark page header), and the `columnVisibilityModel` logic should be driven by the set of selected benchmark names in addition to (or instead of) the current text-field approach.

**Note on plan vs ROADMAP divergence:**

The 05-01-PLAN.md truth #4 ("Benchmark quick-search navigates to the selected benchmark tab") is satisfied. However, the ROADMAP success criterion and FR-2.2 both call for a column-narrowing multi-filter. The plan redefined scope without addressing the original requirement. This discrepancy should be resolved — either the requirement should be updated to match the implemented navigation UX, or the multi-filter should be added in a follow-up plan.

---

_Verified: 2026-03-12T10:40:30Z_
_Verifier: Claude (gsd-verifier)_
