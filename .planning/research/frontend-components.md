# Frontend Components Research: MUI DataGrid + Plotly.js for ML-PEG

**Domain:** Scientific benchmarking leaderboard UI
**Researched:** 2026-03-10
**Overall confidence:** HIGH (MUI DataGrid, theming, Plotly patterns) / MEDIUM (performance edge cases)

---

## 1. MUI DataGrid: Free (Community) vs Pro — Which to Use?

### Verdict: Community (MIT, free) is sufficient for this project.

The free `@mui/x-data-grid` package covers everything ML-PEG needs:

| Feature | Community | Pro | Notes |
|---|---|---|---|
| Sorting (multi-column) | YES | YES | |
| Filtering (client-side) | YES | YES | Basic filter panel |
| Custom cell rendering (`renderCell`) | YES | YES | Needed for color coding |
| Cell click events (`onCellClick`) | YES | YES | Needed for plot drawer |
| Row virtualization | YES | YES | Limited to 100 rows in community |
| Column virtualization | YES | YES | Default buffer 150px |
| Custom CSS / getCellClassName | YES | YES | Needed for heatmap |
| Column pinning | NO | YES | Pro only |
| Row pinning | NO | YES | Pro only |
| Master-detail row panels | NO | YES | Pro only |
| Column reordering | NO | YES | Pro only |
| Data source (server-side) | YES (v8+) | YES | Moved to Community in v8 |
| Row spanning (stable) | YES (v8+) | YES | Promoted to stable in v8 |

**Decision:** Use `@mui/x-data-grid` (Community). The leaderboard has ~7 rows and ~50 columns — far under the 100-row community virtualization cap. Column pinning (Pro-only) would be nice for "Model Name" column but is not blocking. We can fake sticky first-column behavior with CSS position:sticky on the `modelName` column cells.

**Package:** `@mui/x-data-grid` (same `@mui/x` monorepo, MIT license)

Sources:
- [MUI X DataGrid features](https://mui.com/x/react-data-grid/features/)
- [Introducing MUI X v8](https://mui.com/blog/mui-x-v8/)

---

## 2. Cell-Level Color Coding (Viridis Heatmap) in MUI DataGrid

### Approach: `getCellClassName` + pre-computed CSS classes (fastest) or `renderCell` with inline style.

There are two viable patterns. Use `getCellClassName` for performance.

### Pattern A: getCellClassName + CSS classes (RECOMMENDED)

Compute a discrete viridis bucket at column-definition time, assign a CSS class:

```typescript
// utils/viridisScale.ts
// 256-stop viridis hex array from scale-color-perceptual or hardcoded
const VIRIDIS_HEX = [/* 256 hex strings */];

export function valueToViridisClass(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const bucket = Math.floor(t * 15); // 16 CSS classes
  return `viridis-${bucket}`;
}
```

```tsx
// In DataGrid column definition:
{
  field: 'benchmark_foo',
  headerName: 'Foo',
  getCellClassName: (params: GridCellParams<number>) => {
    if (params.value == null) return '';
    return valueToViridisClass(params.value, colMin, colMax);
  },
}
```

```css
/* Generate these 16 classes from viridis palette */
.viridis-0  { background-color: #440154; color: #fff; }
.viridis-1  { background-color: #48186a; color: #fff; }
/* ... */
.viridis-15 { background-color: #fde725; color: #000; }
```

This avoids re-rendering per cell — CSS class application is handled by the grid's virtualization layer without touching the React render cycle.

### Pattern B: renderCell with inline background-color (simpler, slightly slower)

```tsx
{
  field: 'benchmark_foo',
  renderCell: (params: GridCellParams<number>) => {
    const bg = valueToViridisHex(params.value, colMin, colMax);
    return (
      <Box sx={{ width: '100%', height: '100%', bgcolor: bg, display: 'flex',
                 alignItems: 'center', justifyContent: 'center' }}>
        {params.value?.toFixed(3)}
      </Box>
    );
  },
}
```

**Warning:** `renderCell` creates a React component per cell. For 7 × 50 = 350 cells with virtualization this is acceptable, but `getCellClassName` is the documented performance-preferred approach.

### viridis color library options:

- `scale-color-perceptual` (npm) — 256 hex stops, `scale.viridis(t)` where `t ∈ [0,1]`. Tiny package.
- `d3-scale-chromatic` — `d3.interpolateViridis(t)` returns an rgb string. Heavier but standard in scientific contexts.
- Hardcode 16–32 stops inline — zero dependency, sufficient for discrete heatmap buckets.

**Recommendation:** Hardcode ~20 viridis hex stops. No extra dependency, complete control.

### Important: per-column normalization

Each benchmark column needs its own min/max for color normalization — don't normalize across all benchmarks. Pre-compute min/max per column from the data at load time.

Sources:
- [MUI DataGrid Cells](https://mui.com/x/react-data-grid/cells/)
- [MUI DataGrid Styling](https://mui.com/x/react-data-grid/style/)
- [scale-color-perceptual npm](https://www.npmjs.com/package/scale-color-perceptual)
- [MUI DataGrid Performance](https://v6.mui.com/x/react-data-grid/performance/)

---

## 3. react-plotly.js: Best Practices for Bundle Size and SSR

### The core problem

Full `plotly.js` is ~3.5 MB minified (~2 MB gzipped). For a Next.js app this is unusable as a synchronous import.

### Approach 1: Dynamic import + SSR disable (RECOMMENDED for this project)

```tsx
// components/PlotlyChart.tsx  — client wrapper
'use client';

import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => <CircularProgress />,
});

export default Plot;
```

Use `PlotlyChart` everywhere in the app. The chart bundle is split into its own chunk and only loaded when a user first opens a plot drawer. For ML-PEG this is ideal — most users browse the table without ever opening every chart.

### Approach 2: Partial bundle (plotly.js-basic-dist-min) + createPlotlyComponent factory

```tsx
import Plotly from 'plotly.js-basic-dist-min'; // ~999 KB minified vs ~3.5 MB
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);
```

**Basic bundle contains:** scatter, bar, pie only. ML-PEG figures include parity plots (scatter), violin plots, and density scatter — all covered by the basic bundle. Phonon figures may use more exotic trace types; verify against actual figure JSON before committing to the basic bundle.

**Recommendation:** Use both strategies together:

```tsx
// Lazy load the partial-bundle Plot component
const Plot = dynamic(
  () => import('plotly.js-basic-dist-min').then((Plotly) =>
    import('react-plotly.js/factory').then((factory) => ({
      default: factory.default(Plotly.default),
    }))
  ),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={400} /> }
);
```

This gives ~1 MB partial bundle loaded only on interaction — roughly 70% smaller than the default full bundle.

### TypeScript note

`react-plotly.js` has no bundled types. Install separately:

```bash
bun add react-plotly.js plotly.js-basic-dist-min
bun add -D @types/react-plotly.js
```

If using `plotly.js/dist/plotly.js` path instead of the main entry, TypeScript will fail to resolve types — always import from the package root or use a dist-min package.

### SSR consideration

`react-plotly.js` uses class components assuming a browser DOM. The `ssr: false` dynamic import is mandatory for Next.js App Router. Even with `'use client'` directive, the library will fail without SSR disabled.

Sources:
- [react-plotly.js GitHub](https://github.com/plotly/react-plotly.js)
- [How to integrate plotly.js on Next.js 14 with App Router](https://dev.to/composite/how-to-integrate-plotlyjs-on-nextjs-14-with-app-router-1loj)
- [plotly.js bundle size discussion](https://community.plotly.com/t/how-can-i-reduce-bundle-size-of-plotly-js-in-react-app/89910)
- [plotly.js dist README](https://github.com/plotly/plotly.js/blob/master/dist/README.md)

---

## 4. MUI Autocomplete with Multi-Select for Model/Benchmark Search

### Recommended pattern

```tsx
'use client';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

interface SearchOption {
  label: string;
  type: 'model' | 'benchmark' | 'category';
  id: string;
}

function LeaderboardSearch({
  options,
  value,
  onChange,
}: {
  options: SearchOption[];
  value: SearchOption[];
  onChange: (v: SearchOption[]) => void;
}) {
  return (
    <Autocomplete<SearchOption, true, false, false>
      multiple
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      groupBy={(option) => option.type}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            key={option.id}
            label={option.label}
            size="small"
            color={option.type === 'model' ? 'primary' : 'default'}
            {...getTagProps({ index })}
          />
        ))
      }
      renderInput={(params) => (
        <TextField {...params} label="Filter models and benchmarks" size="small" />
      )}
    />
  );
}
```

### Performance notes

- `options` array should be `useMemo`-derived and stable across renders — Autocomplete re-renders on any options array identity change.
- `isOptionEqualToValue` must be provided for object options; without it MUI falls back to reference equality which breaks controlled mode.
- `groupBy` groups models vs benchmarks vs categories in the dropdown without extra rendering logic.
- For the ~57 option space (7 models + 50 benchmarks) client-side filtering is fast — no need for `filterOptions` override or debounced server fetch.

### createFilterOptions customization (optional)

If users need fuzzy search:
```tsx
import { createFilterOptions } from '@mui/material/Autocomplete';
const filter = createFilterOptions<SearchOption>();
// then override filterOptions prop
```

For ML-PEG the default substring filter is adequate.

Sources:
- [MUI Autocomplete docs](https://mui.com/material-ui/react-autocomplete/)
- [MUI Autocomplete TypeScript guide](https://www.xjavascript.com/blog/mui-autocomplete-typescript/)

---

## 5. Dark/Light Mode with MUI ThemeProvider

### Recommended approach: MUI v6+ CSS Variables API

MUI v6 introduced a CSS variables mode that completely solves the SSR hydration flash problem without needing `next-themes`. This is the correct approach for Next.js App Router.

```tsx
// app/theme.ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,         // emit CSS custom properties
  colorSchemes: {
    light: {
      palette: { /* light overrides */ },
    },
    dark: {
      palette: {
        background: { default: '#0f1117', paper: '#1a1d2e' },
      },
    },
  },
});
```

```tsx
// app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript defaultMode="system" />
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

```tsx
// components/ThemeToggle.tsx
'use client';
import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  return (
    <IconButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
      {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  );
}
```

### Why this over next-themes

- `next-themes` requires wrapping MUI `ThemeProvider` inside it and syncing state — two sources of truth.
- MUI CSS Variables API is self-contained, respects `prefers-color-scheme`, persists in localStorage, and has zero flash with `InitColorSchemeScript`.
- `suppressHydrationWarning` is needed on `<html>` because the color scheme class is set client-side before React hydration.

### Viridis heatmap in dark mode

The standard viridis palette (dark purple → yellow) reads well on both dark and dark-background cells. No palette adjustment needed. Ensure text inside colored cells switches between black and white at ~50% viridis intensity threshold.

Sources:
- [MUI Dark Mode docs](https://mui.com/material-ui/customization/dark-mode/)
- [MUI CSS theme variables](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- [Flickerless dark mode in Next.js + MUI](https://medium.com/@luca_79189/how-to-get-a-flickerless-persistent-dark-mode-in-your-next-js-app-example-with-mui-9581ea898314)

---

## 6. Cell Click → Detail Drawer with Plots

### Pattern: `onCellClick` + MUI Drawer + state

```tsx
'use client';
import { DataGrid, GridCellParams } from '@mui/x-data-grid';
import Drawer from '@mui/material/Drawer';
import { useState, useCallback } from 'react';

interface CellSelection {
  modelId: string;
  benchmarkId: string;
  value: number;
}

export function LeaderboardTable({ rows, columns }) {
  const [selection, setSelection] = useState<CellSelection | null>(null);

  const handleCellClick = useCallback((params: GridCellParams) => {
    // Skip non-benchmark columns (e.g., model name column)
    if (params.field === 'model' || params.value == null) return;
    setSelection({
      modelId: params.row.id,
      benchmarkId: params.field,
      value: params.value as number,
    });
  }, []);

  return (
    <>
      <DataGrid
        rows={rows}
        columns={columns}
        onCellClick={handleCellClick}
        sx={{ cursor: 'pointer' }}
      />
      <Drawer
        anchor="right"
        open={selection !== null}
        onClose={() => setSelection(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}
      >
        {selection && (
          <BenchmarkDetailPanel
            modelId={selection.modelId}
            benchmarkId={selection.benchmarkId}
          />
        )}
      </Drawer>
    </>
  );
}
```

### Fetching figures for the drawer

Pre-serialized Plotly figure JSONs live in S3. Fetch on drawer open:

```tsx
function BenchmarkDetailPanel({ modelId, benchmarkId }) {
  const [figure, setFigure] = useState(null);

  useEffect(() => {
    fetch(`/api/figures/${modelId}/${benchmarkId}`)
      .then(r => r.json())
      .then(setFigure);
  }, [modelId, benchmarkId]);

  if (!figure) return <Skeleton variant="rectangular" height={400} />;
  return <Plot data={figure.data} layout={figure.layout} />;
}
```

### Master-Detail (inline expand) — Pro only

The `getDetailPanelContent` prop for inline row expansion is Pro-only. The Drawer pattern (above) achieves similar UX and works with Community.

### Event propagation note

`onCellClick` fires before `onRowClick`. If you have both, use `event.defaultMuiPrevented = true` in `onCellClick` to suppress row selection.

Sources:
- [MUI DataGrid Events](https://mui.com/x/react-data-grid/events/)
- [MUI DataGrid Cells](https://mui.com/x/react-data-grid/cells/)
- [MUI DataGrid Master-Detail (Pro)](https://mui.com/x/react-data-grid/master-detail/)

---

## 7. Performance: ~7 Rows × ~50 Columns with Color-Coded Cells

### Why this is NOT a performance problem

At 7 × 50 = 350 cells, this is far below any threshold where DataGrid performance becomes a concern. The DataGrid's virtualization engine is designed for thousands of rows. For this table size:

- Virtualization helps primarily with wide tables scrolling horizontally (column buffer: default 150px).
- All 350 cells will likely be in the DOM simultaneously given viewport width.
- `getCellClassName` is called once per cell on initial render and re-render — 350 calls is negligible.

### What CAN cause performance issues

1. **Unstable column definitions** — define `columns` outside component or with `useMemo`. Each render with a new `columns` array reference triggers a full DataGrid re-render.

2. **renderCell creating closure objects** — avoid creating new functions inside `renderCell` per render. Extract to stable references.

3. **Plotly chart in the same render tree** — lazy-load plots so they don't block the table's initial paint. This is the most important performance consideration for this project.

4. **Dynamic row heights** — avoid `getRowHeight` returning variable heights if you have many columns; it disables column virtualization.

### Concrete recommendation

```tsx
// columns defined OUTSIDE the component or memoized
const columns = useMemo<GridColDef[]>(() =>
  benchmarks.map(b => ({
    field: b.id,
    headerName: b.label,
    width: 90,
    type: 'number',
    getCellClassName: (params) => valueToViridisClass(params.value, b.min, b.max),
    valueFormatter: (value) => value?.toFixed(3) ?? '—',
  })),
  [benchmarks]  // benchmarks is stable (loaded once from API)
);
```

Pre-compute `b.min` and `b.max` server-side or at data load time — don't compute them inside `getCellClassName`.

### Column header overflow

With 50 columns at 90px each = 4500px total width. The DataGrid handles horizontal scrolling natively. Consider abbreviating benchmark names in headers with a Tooltip for the full name.

Sources:
- [MUI DataGrid Virtualization](https://mui.com/x/react-data-grid/virtualization/)
- [MUI DataGrid Performance (v6 docs)](https://v6.mui.com/x/react-data-grid/performance/)
- [MUI DataGrid Column Definition](https://mui.com/x/react-data-grid/column-definition/)

---

## Summary Recommendations

| Decision | Choice | Rationale |
|---|---|---|
| DataGrid tier | Community (free) | 7 rows, no column pinning needed, all required features included |
| Heatmap approach | `getCellClassName` + CSS classes | Best performance, no React component per cell |
| viridis implementation | Hardcode ~20 hex stops | Zero dep, sufficient resolution for discrete buckets |
| Color normalization | Per-column min/max | Benchmarks have incomparable scales |
| Plotly loading | `dynamic(import, {ssr:false})` + partial bundle | ~70% bundle reduction, loaded on interaction only |
| Plotly bundle | `plotly.js-basic-dist-min` | Covers scatter/violin/bar trace types used in ML-PEG |
| SSR | `ssr: false` on Plot component | react-plotly.js is class component, requires browser |
| Theme | MUI CSS Variables API (`cssVariables: true`) | No SSR flash, no next-themes dependency needed |
| Cell click | `onCellClick` + `useState` + MUI `Drawer` | Pro-free, clean separation of table and detail view |
| Search | MUI Autocomplete multi-select + `groupBy` | Native MUI, no extra deps, sufficient for ~57 options |

## Pitfalls to Watch

1. **react-plotly.js maintenance** — The library has not had major updates in ~2 years. It still works but may need a custom wrapper (Plotly.js directly + `useEffect` for DOM mounting) if issues arise with React 19 class component compatibility.

2. **Partial bundle trace coverage** — Verify all 239 figure JSONs use only trace types in the basic bundle (scatter, bar, pie). Phonon figures in particular may use `heatmap` or `surface` traces not in the basic bundle. If so, use `plotly.js-cartesian-dist-min` which adds more 2D trace types.

3. **Column header pinning workaround** — Without Pro column pinning, use CSS `position: sticky; left: 0` on the model name column via `getCellClassName` or `sx` override to simulate pinned first column.

4. **Dark mode + viridis text contrast** — Viridis cells with mid-range values (green region) need careful text color. The ~50% brightness crossover point for viridis is around index 128/256. Below that use white text, above use black text.

5. **MUI v6 peer deps** — Ensure `@mui/material`, `@mui/x-data-grid`, and `@emotion/react` versions are aligned. MUI X v8 requires MUI v6.

---

*Confidence: HIGH for all MUI patterns (official docs verified). MEDIUM for react-plotly.js maintenance status (last GitHub activity ~2 years ago but still functional). MEDIUM for partial bundle trace coverage (needs verification against actual figure data).*
