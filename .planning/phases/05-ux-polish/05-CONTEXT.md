# Phase 5: UX Polish - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Researchers can filter the leaderboard by model and benchmark, adjust metric weights and normalization thresholds, and access contextual help. Delivers: model filter autocomplete, benchmark quick-search, per-table column filter, per-column weight sliders with threshold editing, score recalculation, tutorial modal, FAQ accordion, and model hover cards. New viewers, new data types, and phonon support are separate phases.

Requirements: FR-2.1, FR-2.2, FR-2.3, FR-7.1, FR-7.2, FR-7.3

</domain>

<decisions>
## Implementation Decisions

### Search & Filter Architecture
Three distinct filter mechanisms, each with different scope and persistence:

1. **Model filter (AppBar, left side)** — MUI multi-select Autocomplete for filtering model rows
   - Persistent across benchmark/category navigation
   - Hides non-matching rows entirely (not dimmed)
   - Shows selected models as chips in the Autocomplete

2. **Benchmark quick-search (AppBar, right side)** — Restricted Autocomplete (no free-solo)
   - Navigates to the selected benchmark's tab on Enter/selection
   - Clears after navigation (ephemeral quick-nav)
   - Dropdown lists all benchmarks across all categories

3. **Column filter (per-table toolbar)** — Free-text substring search above the DataGrid
   - Hides columns whose names don't match the typed substring
   - Resets when switching to a different benchmark
   - Always-visible text input between the benchmark sub-tabs and the table header
   - MLIP and Score columns are never hidden by the filter

### Weight Controls
- **Control type:** Mini vertical MUI Sliders (0.0–1.0 range), one below each metric column, aligned to the column
- **Visibility:** Always visible below the table (not collapsible)
- **Layout:** Weight slider row directly below the table, each slider centered under its column. Current value displayed below the slider.
- **Threshold editing:** Good/Bad number inputs stacked below each weight slider (G: and B: fields), also column-aligned
- **Reset button:** Single "Reset" button at the end of the weight/threshold row, resets all to API defaults
- **Summary page:** Same pattern — vertical sliders below each category Score column with Reset button

### Score Recalculation
- **Display:** Score column updates inline with recalculated value (no dual-column or delta indicator)
- **Heatmap:** All cell colors re-render when thresholds change — full `(value-bad)/(good-bad)` recalculation
- **Sorting:** Auto re-sort by Score ONLY when Score is the currently active sort column. If sorted by another column, values update but sort order is preserved.
- **Computation:** Entirely client-side, no server round-trip (FR-7.2)

### Onboarding
- **Tutorial modal:** Multi-step "Welcome to ML-PEG" modal on first visit (2-3 steps covering tooltips, cell-click for figures, weight controls)
  - Dismissed via close button or completing all steps
  - Not shown again (localStorage flag)
  - "Tutorial" button in AppBar to reopen on demand
- **FAQ section:** Accordion at the bottom of the page (below weights area), matching existing site's questions: What is ML-PEG?, How are scores calculated?, How do thresholds work?, How can I add my model?, etc.

### Model Hover Cards
- Hovering over a model name in the MLIP column shows a tooltip/card with model metadata: GitHub repo link, parameter count, training data info (where available from API/model-links data)

### Claude's Discretion
- Tutorial modal step content, imagery, and styling
- FAQ question wording and answers
- Model hover card layout and which metadata to show
- Vertical slider height and styling within column width constraints
- Column filter placeholder text and clear behavior
- Mobile responsive behavior for all new controls
- Threshold input validation and bounds
- Animation/transition when scores recalculate

</decisions>

<specifics>
## Specific Ideas

- Weight controls must be column-aligned — the visual connection between a metric column and its weight/threshold controls below it is the key UX improvement over the existing site's disconnected spinbutton row
- Existing ML-PEG site uses binary 0/1 weights; the new site improves this to continuous 0.0–1.0 range via sliders
- Benchmark quick-search is restricted autocomplete (no free-solo) — prevents invalid entries and provides discoverable benchmark list
- Model filter persists across navigation so researchers can compare specific models across all benchmarks without re-selecting
- Auto re-sort only when Score is already the sort column — prevents disorienting table rearrangement when researchers are exploring a specific column order
- Match the existing site's FAQ content for continuity with existing users arriving from publications

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/AppHeader.tsx`: MUI AppBar — add model Autocomplete and benchmark quick-search inputs
- `src/components/LeaderboardTable.tsx`: MUI DataGrid — add column visibility control, weight row, onCellClick already wired
- `src/components/SummaryTable.tsx`: Summary DataGrid — add category weight sliders below
- `src/lib/types.ts`: `BenchmarkMeta.weights` and `BenchmarkMeta.thresholds` already returned by API — ready for client-side recalculation
- `src/lib/color.ts`: `normalizeScore()`, `viridisR()`, `textColorForViridis()` — reuse for re-coloring on threshold change
- `src/lib/model-links.ts`: `MODEL_LINKS` — data source for model hover cards (GitHub URLs)
- `src/lib/api.ts`: SWR hooks — extend for model list fetching (Autocomplete options)

### Established Patterns
- SWR with `revalidateOnFocus: false` for data fetching
- MUI CSS Variables API for dark/light mode
- `next/dynamic` with `ssr: false` for heavy client-side libraries
- DataGrid `getCellClassName` for heatmap styling — needs to support dynamic threshold overrides
- API proxy in `next.config.ts`

### Integration Points
- `AppHeader.tsx`: Add two Autocomplete inputs (model filter + benchmark search)
- `LeaderboardTable.tsx`: Add toolbar row with column filter input, add weight/threshold row below table
- `SummaryTable.tsx`: Add weight slider row below summary table
- `/api/v1/models` endpoint returns model list — use for model Autocomplete options
- `/api/v1/categories` endpoint returns all categories with benchmarks — use for benchmark quick-search options
- `BenchmarkMeta.weights` (per-metric weights) and `BenchmarkMeta.thresholds` (per-metric good/bad) already in API responses

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-ux-polish*
*Context gathered: 2026-03-12*
