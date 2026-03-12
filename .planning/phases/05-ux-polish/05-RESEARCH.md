# Phase 5: UX Polish - Research

**Researched:** 2026-03-12
**Domain:** MUI v7 Autocomplete, Slider, DataGrid column visibility, localStorage, React state management
**Confidence:** HIGH

## Summary

Phase 5 layers filtering, weight adjustment, onboarding, and model info onto an already-working Next.js + MUI DataGrid leaderboard. Every requirement is achievable entirely client-side using existing installed packages — no new library installs are needed. MUI v7.3.9 ships Autocomplete (multi-select, restricted), Slider (vertical orientation), and all supporting components. The DataGrid is MUI X v8.27.4 Community tier with `columnVisibilityModel` for column hiding.

The most complex decision is state lifting. Model filter and benchmark quick-search must live at a level above both `AppHeader` and the benchmark pages since the model filter persists across navigation. The existing code has all state per-page; lifting to a shared React context (or a lightweight Zustand slice) is the architecture change required. Benchmark quick-search navigates via `useRouter` and therefore needs access to the router in the header — confirm which lift level works. A React context at `providers.tsx` or `app/layout.tsx` is the standard approach for this codebase.

Score recalculation is pure arithmetic. `BenchmarkMeta.weights` (per-metric weights 0–1) and `BenchmarkMeta.thresholds` (per-metric good/bad) are already in every API response. Score = weighted average of `normalizeScore(value, good, bad)` per metric. Client-side state overrides default weights/thresholds; original API values are the reset target. The existing `normalizeScore` + `viridisR` + `textColorForViridis` functions in `src/lib/color.ts` already implement the cell coloring — they just need to receive overridden thresholds.

**Primary recommendation:** Lift model filter state to a shared React context, implement weight state locally per benchmark page, use MUI Autocomplete + Slider with no new package installs, use localStorage for tutorial modal flag.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Search & Filter Architecture**
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

**Weight Controls**
- **Control type:** Mini vertical MUI Sliders (0.0–1.0 range), one below each metric column, aligned to the column
- **Visibility:** Always visible below the table (not collapsible)
- **Layout:** Weight slider row directly below the table, each slider centered under its column. Current value displayed below the slider.
- **Threshold editing:** Good/Bad number inputs stacked below each weight slider (G: and B: fields), also column-aligned
- **Reset button:** Single "Reset" button at the end of the weight/threshold row, resets all to API defaults
- **Summary page:** Same pattern — vertical sliders below each category Score column with Reset button

**Score Recalculation**
- **Display:** Score column updates inline with recalculated value (no dual-column or delta indicator)
- **Heatmap:** All cell colors re-render when thresholds change — full `(value-bad)/(good-bad)` recalculation
- **Sorting:** Auto re-sort by Score ONLY when Score is the currently active sort column. If sorted by another column, values update but sort order is preserved.
- **Computation:** Entirely client-side, no server round-trip (FR-7.2)

**Onboarding**
- **Tutorial modal:** Multi-step "Welcome to ML-PEG" modal on first visit (2-3 steps covering tooltips, cell-click for figures, weight controls)
  - Dismissed via close button or completing all steps
  - Not shown again (localStorage flag)
  - "Tutorial" button in AppBar to reopen on demand
- **FAQ section:** Accordion at the bottom of the page (below weights area), matching existing site's questions: What is ML-PEG?, How are scores calculated?, How do thresholds work?, How can I add my model?, etc.

**Model Hover Cards**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-2.1 | Multi-entry autocomplete for filtering by model name | MUI Autocomplete `multiple` prop; model list from `/api/v1/models` or derived from all benchmark rows already in memory; state lifted to shared context for cross-navigation persistence |
| FR-2.2 | Multi-entry autocomplete for filtering by benchmark name | MUI Autocomplete (restricted, no free-solo); benchmark list from `useCategories()` hook already available; on-select navigates via `useRouter` |
| FR-2.3 | Client-side filtering (data is small enough) | No server round-trip needed; row filtering via `rows.filter()` before DataGrid prop; column filtering via `columnVisibilityModel` |
| FR-7.1 | Sliders to adjust metric weights per benchmark | MUI Slider `orientation="vertical"` placed below table; `BenchmarkMeta.weights` already returned by API; override stored in local component state |
| FR-7.2 | Client-side score recalculation using weight data from API | Score = Σ(weight_i × normalizeScore(value_i, good_i, bad_i)) / Σ(weight_i); existing `normalizeScore` in `color.ts` handles the per-cell formula; computed in `useMemo` |
| FR-7.3 | Category weight adjustment on summary view | Same slider pattern in `SummaryTable.tsx`; category weights adjust overall Score weighting; recalculated in `summaryRows` useMemo |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mui/material | 7.3.9 | Autocomplete, Slider, Dialog, Accordion, Tooltip | Already installed; provides all UI primitives needed |
| @mui/x-data-grid | 8.27.4 | columnVisibilityModel for column filter | Already installed; Community tier handles this use case |
| swr | 2.4.1 | Model list fetching for Autocomplete options | Already installed; consistent with all other data fetching |
| react (useState, useCallback, useMemo, createContext) | 19.0.0 | State management for filters and weights | Built-in; no extra libs needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage (browser native) | n/a | Tutorial modal "seen" flag, theme pref already uses it | For any persistent-across-session boolean UI state |
| Next.js useRouter | 15 | Benchmark quick-search navigation | Header component needs router for navigation on autocomplete selection |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React context for model filter state | Zustand/Jotai | Context is sufficient; no new install, matches project pattern |
| Inline `rows.filter()` for model filter | DataGrid filterModel prop | DataGrid filterModel shows a "no rows" overlay and doesn't hide non-matching rows cleanly; manual filter before passing rows prop gives hide-entire-row behavior as specified |
| MUI Slider vertical | Custom CSS range input | MUI Slider has proper accessibility labels, keyboard support, thumb rendering — use it |

**Installation:** No new packages required. All needed components are in the already-installed MUI v7.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── filter-context.tsx     # React context for model filter + benchmark search state (new)
│   ├── score-calc.ts          # Score recalculation logic (new)
│   └── (existing files unchanged)
├── components/
│   ├── AppHeader.tsx          # Add Autocomplete inputs (model + benchmark)
│   ├── LeaderboardTable.tsx   # Add column filter, weight/threshold row
│   ├── SummaryTable.tsx       # Add category weight slider row
│   ├── TutorialModal.tsx      # New multi-step welcome modal
│   ├── FaqSection.tsx         # New FAQ accordion below weights
│   └── WeightControls.tsx     # New reusable slider+threshold row
└── app/
    ├── layout.tsx             # Wrap with FilterProvider (new)
    └── [category]/[benchmark]/page.tsx  # Consume model filter from context
```

### Pattern 1: Shared Filter Context

**What:** A React context that holds `selectedModels: string[]` and `setSelectedModels`, plus `benchmarkSearch` for the quick-nav Autocomplete.

**When to use:** Any state that must survive page navigation within the same Next.js layout. The model filter must persist when moving from `/molecular/diatomics` to `/bulk_crystal/phonons`.

**Example:**
```typescript
// src/lib/filter-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface FilterContextValue {
  selectedModels: string[];
  setSelectedModels: (models: string[]) => void;
}

const FilterContext = createContext<FilterContextValue>({
  selectedModels: [],
  setSelectedModels: () => {},
});

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  return (
    <FilterContext.Provider value={{ selectedModels, setSelectedModels }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilterContext = () => useContext(FilterContext);
```

Wrap in `src/app/layout.tsx` inside existing `<Providers>`:
```typescript
// app/layout.tsx — add FilterProvider around {children}
<Providers>
  <FilterProvider>
    <AppHeader />
    {children}
  </FilterProvider>
</Providers>
```

### Pattern 2: Model Filter in AppHeader — MUI Autocomplete Multiple

**What:** A multi-select MUI Autocomplete that reads model options from the existing `/api/v1/models` endpoint and writes selected values to the FilterContext.

**When to use:** FR-2.1 — "model filter" in the AppBar. `multiple` prop enables chip display.

**Key props:**
```typescript
// Source: MUI v7 docs — Autocomplete multiple
<Autocomplete
  multiple
  size="small"
  options={modelOptions}        // string[] from /api/v1/models
  value={selectedModels}
  onChange={(_e, value) => setSelectedModels(value)}
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip size="small" label={option} {...getTagProps({ index })} key={option} />
    ))
  }
  renderInput={(params) => (
    <TextField {...params} placeholder="Filter models..." size="small" />
  )}
  sx={{ minWidth: 200, maxWidth: 350 }}
/>
```

### Pattern 3: Benchmark Quick-Search — Restricted Autocomplete + useRouter

**What:** A non-free-solo Autocomplete that lists all benchmarks from all categories. On selection it navigates to the benchmark's URL, then clears itself.

**When to use:** FR-2.2 — benchmark quick-nav in AppBar.

```typescript
const allBenchmarks = categories.flatMap(cat =>
  cat.benchmarks.map(b => ({ label: b.name, href: `/${cat.slug}/${b.slug}` }))
);

<Autocomplete
  size="small"
  options={allBenchmarks}
  value={null}                          // Always controlled empty (ephemeral)
  onChange={(_e, option) => {
    if (option) router.push(option.href);
  }}
  renderInput={(params) => (
    <TextField {...params} placeholder="Go to benchmark..." size="small" />
  )}
  blurOnSelect
/>
```

The header already uses `useColorScheme` (a client hook) so it is already `'use client'`. Adding `useRouter()` is safe.

### Pattern 4: Column Filter — columnVisibilityModel

**What:** A `TextField` above the DataGrid; onChange updates a `columnVisibilityModel` derived by comparing column ids/names to the search string. MLIP and Score are always `true`.

**When to use:** FR-2.3 — per-table column filter toolbar.

```typescript
// In BenchmarkPage (or passed as prop to LeaderboardTable)
const [colFilter, setColFilter] = useState('');

const columnVisibilityModel = useMemo(() => {
  if (!colFilter.trim()) return {};  // empty = all visible
  const lower = colFilter.toLowerCase();
  return Object.fromEntries(
    meta.columns
      .filter(col => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id')
      .map(col => [col.id, col.name.toLowerCase().includes(lower)])
  );
}, [colFilter, meta]);

// Pass to DataGrid:
<DataGrid
  ...
  columnVisibilityModel={columnVisibilityModel}
/>
```

Reset on benchmark navigation: `useEffect(() => setColFilter(''), [benchmark])` in BenchmarkPage.

### Pattern 5: Weight State + Score Recalculation

**What:** Local state per benchmark page for `weightOverrides: Record<string, number>` and `thresholdOverrides: Record<string, Threshold>`. Score is recalculated on every render (memoized) from overridden weights and thresholds.

**Score formula:**
```typescript
// src/lib/score-calc.ts
import { normalizeScore } from './color';
import type { MetricsRow, BenchmarkMeta, Threshold } from './types';

export function computeScore(
  row: MetricsRow,
  meta: BenchmarkMeta,
  weightOverrides: Record<string, number>,
  thresholdOverrides: Record<string, Threshold>
): number | null {
  const metricCols = meta.columns.filter(
    (col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id'
  );

  let weightedSum = 0;
  let totalWeight = 0;

  for (const col of metricCols) {
    const value = row[col.id];
    if (value == null || typeof value !== 'number') continue;

    const weight = weightOverrides[col.id] ?? meta.weights[col.id] ?? 1;
    const threshold = thresholdOverrides[col.id] ?? meta.thresholds[col.id];
    if (!threshold) continue;

    const norm = normalizeScore(value, threshold.good, threshold.bad);
    weightedSum += weight * norm;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : null;
}
```

**In LeaderboardTable** — rows passed in are enriched with computed Score:
```typescript
const enrichedRows = useMemo(() =>
  rows.map(row => ({
    ...row,
    Score: computeScore(row, meta, weightOverrides, thresholdOverrides) ?? row.Score,
  })),
  [rows, meta, weightOverrides, thresholdOverrides]
);
```

Sort behavior: DataGrid `sortModel` is controlled state. When Score is the active sort field, sorting applies automatically as row values change. No special logic needed.

### Pattern 6: Vertical MUI Slider Row (Column-Aligned)

**What:** A row of vertical sliders below the DataGrid table body, each slider positioned under its corresponding metric column. Uses absolute positioning or a matching flex layout that mirrors the column widths.

**Challenge:** DataGrid column widths and positions are not trivially accessible from outside. The solution is to render a separate row using matching fixed widths, not by querying DOM positions.

```typescript
// WeightControls component — flex row matching column layout
// MLIP col (180px), Score col (100px), then metric cols (110px each)
<Box sx={{ display: 'flex', mt: 1 }}>
  <Box sx={{ width: 180 }} />        {/* MLIP spacer */}
  <Box sx={{ width: 100 }} />        {/* Score spacer */}
  {metricCols.map(col => (
    <Box key={col.id} sx={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Slider
        orientation="vertical"
        value={weightOverrides[col.id] ?? meta.weights[col.id] ?? 1}
        onChange={(_e, val) => setWeightOverrides(prev => ({ ...prev, [col.id]: val as number }))}
        min={0} max={1} step={0.01}
        sx={{ height: 60 }}
        size="small"
        aria-label={`${col.name} weight`}
      />
      <Typography variant="caption">{(weightOverrides[col.id] ?? meta.weights[col.id] ?? 1).toFixed(2)}</Typography>
      {/* Threshold inputs */}
      <TextField size="small" label="G" type="number" ... sx={{ width: 65 }} />
      <TextField size="small" label="B" type="number" ... sx={{ width: 65 }} />
    </Box>
  ))}
  <Button size="small" onClick={resetAll}>Reset</Button>
</Box>
```

Column widths MLIP_WIDTH=180, SCORE_WIDTH=100, metric=110 are already constants in `LeaderboardTable.tsx` — export and reuse.

### Pattern 7: Tutorial Modal — localStorage Gate

**What:** A multi-step MUI Dialog shown on first visit. Uses `localStorage.getItem('mlpeg_tutorial_seen')` gate. "Tutorial" button in AppBar reopens it.

```typescript
// TutorialModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Button, MobileStepper } from '@mui/material';

const TUTORIAL_KEY = 'mlpeg_tutorial_seen';

export function TutorialModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only run on client — SSR guard
    if (!localStorage.getItem(TUTORIAL_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(TUTORIAL_KEY, '1');
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogContent>
        {/* Step content array [step] */}
      </DialogContent>
      <DialogActions>
        <MobileStepper
          steps={3} activeStep={step}
          nextButton={step < 2 ? <Button onClick={() => setStep(s => s + 1)}>Next</Button> : <Button onClick={handleClose}>Done</Button>}
          backButton={<Button disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>}
        />
      </DialogActions>
    </Dialog>
  );
}
```

The `useEffect` empty-dep pattern is correct for localStorage (only runs on client, avoids SSR hydration mismatch).

### Pattern 8: Model Hover Card — MUI Tooltip with Rich Content

**What:** Replace the plain model name in MLIP column with a MUI Tooltip containing a mini-card. Data source is `MODEL_LINKS` (already imported in LeaderboardTable) — add parameter count / training data to a `MODEL_METADATA` constant in `model-links.ts` if available.

```typescript
// In renderCell for MLIP column
const metadata = MODEL_METADATA[params.row.id];
const tooltipContent = metadata ? (
  <Box>
    <Typography variant="body2" fontWeight={600}>{params.value}</Typography>
    {metadata.params && <Typography variant="caption">Params: {metadata.params}</Typography>}
    {metadata.training && <Typography variant="caption">Training: {metadata.training}</Typography>}
  </Box>
) : params.value;

return (
  <Tooltip title={tooltipContent} arrow placement="right">
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
      {url ? <Link href={url} ...>{params.value}</Link> : params.value}
      {url && <GitHubIcon sx={{ fontSize: 14, opacity: 0.6 }} />}
    </Box>
  </Tooltip>
);
```

### Anti-Patterns to Avoid

- **Filtering via DataGrid filterModel prop for row hiding:** filterModel shows "No rows" overlay and displays filter chips in the toolbar — use `rows.filter()` before passing the prop for hide-not-dim behavior.
- **Querying DOM to align sliders to columns:** Never use `getBoundingClientRect` or ResizeObserver to align. Use fixed matching widths — the same constants defined in LeaderboardTable.
- **Running localStorage in SSR context:** Always guard with `useEffect` (runs client-only). The existing theme code demonstrates this pattern.
- **Overwriting API weights on slider move without keeping original:** Always keep `meta.weights` and `meta.thresholds` as the reset target; overrides are stored separately.
- **Putting weight state in context (global):** Weights are per-benchmark and reset on navigation. Keep as local state in BenchmarkPage, not in FilterContext.
- **Re-fetching data on slider move:** Score recalculation is pure client-side math. No SWR mutation or network request.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-select with chips | Custom multi-select component | MUI Autocomplete `multiple` | Built-in chip rendering, keyboard nav, accessible, theme-aware |
| Vertical range input | CSS `<input type=range>` vertical hack | MUI Slider `orientation="vertical"` | Proper accessibility labels, consistent styling with MUI theme |
| Accordion FAQ | Custom expand/collapse | MUI Accordion | Handles animation, keyboard nav, aria-expanded |
| Step-by-step modal | Custom stepper UI | MUI Dialog + MobileStepper | MobileStepper provides dots, back/next, matches mobile and desktop |
| Column visibility | Custom show/hide logic | DataGrid `columnVisibilityModel` controlled prop | DataGrid handles header hiding, scroll layout recalculation |
| localStorage flag | sessionStorage or cookies | localStorage with `useEffect` gate | Persists across sessions, simple pattern, already used for theme |

**Key insight:** MUI v7.3.9 ships all primitives needed for this phase. No new installs. The risk is misuse of DataGrid's controlled vs. uncontrolled column visibility — always use the controlled `columnVisibilityModel` prop.

## Common Pitfalls

### Pitfall 1: FilterContext Not Wrapping AppHeader

**What goes wrong:** `AppHeader` calls `useFilterContext()` but the provider wraps only `{children}` (page content). The header receives default empty values and never updates the shared filter.

**Why it happens:** `AppHeader` is rendered in `app/layout.tsx` alongside `{children}`, not inside `{children}`. Both must be inside `<FilterProvider>`.

**How to avoid:** In `app/layout.tsx`, wrap BOTH `<AppHeader />` and `{children}` inside `<FilterProvider>`.

**Warning signs:** Model filter chips appear in AppBar but leaderboard rows never change.

### Pitfall 2: DataGrid columnVisibilityModel vs. initialState

**What goes wrong:** Setting `columnVisibilityModel` in `initialState` makes it uncontrolled; subsequent state updates are ignored. Controlled column visibility requires the top-level `columnVisibilityModel` prop AND `onColumnVisibilityModelChange`.

**Why it happens:** DataGrid has both controlled and uncontrolled patterns; `initialState.columns.columnVisibilityModel` only works for initial setup.

**How to avoid:**
```typescript
<DataGrid
  columnVisibilityModel={columnVisibilityModel}  // controlled prop
  onColumnVisibilityModelChange={() => {}}         // accept model (prevent DataGrid overwriting it)
  ...
/>
```

**Warning signs:** Column filter text field updates but columns remain visible.

### Pitfall 3: Score Column Sorted Before Enriched Rows Trigger Re-Sort

**What goes wrong:** Weight sliders update, `enrichedRows` re-computes Score values, but DataGrid's sort order doesn't refresh because DataGrid sorts on initial render and doesn't re-sort automatically on row value changes.

**Why it happens:** DataGrid caches sorted row order. New rows prop with same row IDs but changed Score values won't force a re-sort unless the sort model changes.

**How to avoid:** Use controlled `sortModel` state. When `weightOverrides` change AND active sort is `Score`, trigger a re-sort by toggling sort model:
```typescript
// On weight change, if sortModel[0].field === 'Score', force refresh:
setSortModel([{ field: 'Score', sort: sortModel[0]?.sort ?? 'desc' }]);
```
Or more simply: pass a `key` to DataGrid derived from weight state hash to force remount (acceptable since the grid is fast).

**Warning signs:** Slider moves but row ordering doesn't change despite Score values updating.

### Pitfall 4: Tutorial Modal SSR Hydration Mismatch

**What goes wrong:** `localStorage.getItem()` is called during SSR render, throws `ReferenceError: localStorage is not defined`. Even if guarded with `typeof window !== 'undefined'`, SSR renders `open=false` but client renders `open=true`, causing hydration mismatch.

**Why it happens:** Next.js renders components on the server. localStorage doesn't exist there.

**How to avoid:** Always read localStorage only inside `useEffect` (never in initial state or render body). Initialize `open` to `false` always; set to `true` inside `useEffect` if key missing.

**Warning signs:** `ReferenceError: localStorage is not defined` in build logs, or React hydration warning in console.

### Pitfall 5: Vertical Slider Overlap With Table Scrollbar

**What goes wrong:** When the DataGrid has horizontal overflow, the weight/threshold row scrolls independently of the table columns. Sliders appear misaligned with their columns.

**Why it happens:** The DataGrid is in one scrollable container; the weight row below is in the outer page layout with different scroll position.

**How to avoid:** Wrap both DataGrid and weight row in the same horizontal scroll container:
```typescript
<Box sx={{ width: '100%', overflowX: 'auto' }}>
  <Box sx={{ minWidth: totalColumnsWidth }}>
    <DataGrid ... />
    <WeightControls ... />
  </Box>
</Box>
```
Calculate `totalColumnsWidth = 180 + 100 + (metricCols.length * 110)`.

**Warning signs:** Sliders appear misaligned when the table is wider than viewport.

### Pitfall 6: Model Filter Using IDs vs. Display Names

**What goes wrong:** Autocomplete options are populated from `model.id` but users search by display name (e.g., "MACE-MP-0a" vs "mace-mp-0a"). Filter comparison fails on case.

**Why it happens:** API returns `id` (lowercase slug) and `MLIP` (display name with D3 suffix) as separate fields.

**How to avoid:** Use `MLIP` display name as both option label AND filter key. Filter rows by `row.MLIP` (or `row.id` normalized) against selected values. Autocomplete `getOptionLabel` should return the display name.

## Code Examples

### Score Recalculation (verified pattern from existing color.ts)
```typescript
// src/lib/score-calc.ts
// Uses existing normalizeScore from color.ts
import { normalizeScore } from './color';
import type { MetricsRow, BenchmarkMeta, Threshold } from './types';

export type WeightOverrides = Record<string, number>;
export type ThresholdOverrides = Record<string, Threshold>;

export function computeScore(
  row: MetricsRow,
  meta: BenchmarkMeta,
  weightOverrides: WeightOverrides = {},
  thresholdOverrides: ThresholdOverrides = {}
): number | null {
  const metricCols = meta.columns.filter(
    (col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id'
  );

  let weightedSum = 0;
  let totalWeight = 0;

  for (const col of metricCols) {
    const value = row[col.id];
    if (value == null || typeof value !== 'number') continue;
    const weight = weightOverrides[col.id] ?? meta.weights[col.id] ?? 1;
    const threshold = thresholdOverrides[col.id] ?? meta.thresholds[col.id];
    if (!threshold || weight === 0) continue;
    const norm = normalizeScore(value, threshold.good, threshold.bad);
    weightedSum += weight * norm;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : null;
}
```

### Controlled columnVisibilityModel for Column Filter
```typescript
// In BenchmarkPage — column filter state
const [colFilter, setColFilter] = useState('');

const columnVisibilityModel = useMemo(() => {
  if (!colFilter.trim()) return {};
  const lower = colFilter.toLowerCase();
  return Object.fromEntries(
    (meta?.columns ?? [])
      .filter((col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id')
      .map((col) => [col.id, col.name.toLowerCase().includes(lower)])
  );
}, [colFilter, meta]);

// Reset on benchmark change
useEffect(() => { setColFilter(''); }, [benchmark]);
```

### MUI Slider Vertical — Correct Orientation API
```typescript
// MUI v7 Slider with vertical orientation
import Slider from '@mui/material/Slider';

<Slider
  orientation="vertical"
  value={weight}
  onChange={(_event, value) => onChange(value as number)}
  min={0}
  max={1}
  step={0.05}
  sx={{ height: 56 }}
  size="small"
  aria-label={`${columnName} weight`}
/>
```

### localStorage Tutorial Gate (SSR-safe)
```typescript
'use client';
import { useState, useEffect } from 'react';

const SEEN_KEY = 'mlpeg_tutorial_seen';

export function useTutorialModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setOpen(false);
  };

  const reopen = () => setOpen(true);

  return { open, dismiss, reopen };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DataGrid `initialState.columns` for column visibility | Controlled `columnVisibilityModel` prop | MUI X v6+ | Old way is uncontrolled; new way allows external state to drive visibility |
| `createTheme` | `extendTheme` for MUI CSS Variables API | MUI v6 | Already applied in Phase 3 — `extendTheme` is the project standard |
| `getInitColorSchemeScript` before providers | Already in layout.tsx | Phase 2 | No change needed |

**Deprecated/outdated:**
- `DataGrid filterModel` for row hiding: This approach shows a visible filter UI chrome and "no rows" overlay. For the "hide rows entirely" requirement, filter before the rows prop.
- `next-themes` for dark/light: Project already uses MUI CSS Variables API; don't introduce next-themes.

## Open Questions

1. **`/api/v1/models` endpoint existence**
   - What we know: `src/lib/types.ts` defines `Model { id: string; display_name: string }` but `src/lib/api.ts` has no `useModels()` hook
   - What's unclear: Whether the FastAPI backend implements `GET /api/v1/models` or if model list must be derived from the categories + benchmark table data already in memory
   - Recommendation: Add `useModels()` SWR hook and verify endpoint exists in `api/index.py`. Fallback: derive unique model IDs from all benchmark rows already fetched by SummaryTable.

2. **Scroll container for weight row alignment**
   - What we know: DataGrid has internal horizontal scroll; weight row must scroll in sync
   - What's unclear: Whether the existing page layout's `overflow: hidden` on the DataGrid container will conflict with a shared outer scroll container
   - Recommendation: Test with a wider table (>10 columns) early in implementation. May need to place WeightControls inside DataGrid as a custom component using the `slots` API, but prefer the simpler shared-scroll-container approach first.

3. **Model metadata for hover cards**
   - What we know: `MODEL_LINKS` has GitHub/HuggingFace URLs; no parameter count or training data available in any existing structure
   - What's unclear: Whether any model metadata JSON exists in the API or data directory
   - Recommendation: Add a `MODEL_METADATA` constant to `model-links.ts` with whatever data is available (parameters, architecture). Hover card shows URL + any available metadata; if no metadata, shows just the GitHub link as an enhancement over plain text.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no test config files found |
| Config file | None — Wave 0 must install or configure if tests required |
| Quick run command | `bun run test` (not configured) |
| Full suite command | `bun run test` (not configured) |

No test infrastructure exists in this project. Given the UI-heavy nature of Phase 5 (filter interactions, slider state, score recalculation), the most practical validation is:
1. `score-calc.ts` — pure function, testable with unit tests if framework added
2. Integration: manual smoke testing via `bun run dev`
3. All Phase 5 success criteria are UI-behavioral and best verified by manual execution against the running app

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-2.1 | Model filter narrows rows | manual-only | — | ❌ no test infra |
| FR-2.2 | Benchmark search navigates | manual-only | — | ❌ no test infra |
| FR-2.3 | Filtering is client-side | unit (score-calc) | not configured | ❌ no test infra |
| FR-7.1 | Sliders adjust weights | manual-only | — | ❌ no test infra |
| FR-7.2 | Score recalculates client-side | unit (score-calc) | not configured | ❌ no test infra |
| FR-7.3 | Category weights adjust summary | manual-only | — | ❌ no test infra |

### Sampling Rate
- **Per task commit:** `bun run build` (TypeScript compilation catches type errors)
- **Per wave merge:** `bun run build` + manual browser smoke test
- **Phase gate:** All 6 success criteria verified in running app before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No test infrastructure — if unit tests for `score-calc.ts` are desired, add vitest: `bun add -D vitest @vitest/ui`
- [ ] Otherwise "None — manual testing sufficient for UI-behavioral requirements"

*(Manual-only justification: All FR-2.x and FR-7.x requirements are user-interaction behaviors in a DataGrid UI. The pure-function score calculation can be unit tested but represents a small fraction of the work. Installing a test framework is optional.)*

## Sources

### Primary (HIGH confidence)
- Existing codebase — `src/components/`, `src/lib/`, `package.json`: Direct code inspection
- `src/lib/types.ts` — `BenchmarkMeta.weights` and `BenchmarkMeta.thresholds` confirmed present
- `src/lib/color.ts` — `normalizeScore()` signature and formula confirmed
- `package.json` — MUI @7.3.9, @mui/x-data-grid @8.27.4, React 19, Next.js 15 confirmed

### Secondary (MEDIUM confidence)
- MUI v7 Autocomplete `multiple` prop and `columnVisibilityModel` DataGrid prop — patterns from official MUI documentation applied to confirmed installed version
- localStorage `useEffect` SSR-safe pattern — established Next.js/React pattern, consistent with project's existing theme mode hydration approach

### Tertiary (LOW confidence)
- DataGrid scroll sync with external controls — based on known DataGrid overflow behavior; requires runtime verification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed, versions pinned
- Architecture: HIGH — existing code patterns directly inform all integration points
- Pitfalls: HIGH — derived from direct code inspection (column widths, SSR patterns, DataGrid controlled props)
- Score recalculation formula: HIGH — `BenchmarkMeta.weights` and `normalizeScore` confirmed in types.ts and color.ts

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (MUI v7 stable; no fast-moving dependencies)
