# Phase 2: Leaderboard Core - Research

**Researched:** 2026-03-11
**Domain:** Next.js 15 + MUI v6 + MUI DataGrid Community — leaderboard table with heatmap coloring, category/benchmark navigation, dark/light mode
**Confidence:** HIGH (stack verified via official docs and live codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Category navigation**
- Top scrollable tab bar (MUI Tabs with `variant="scrollable"`) for the 16 categories
- First tab is "Summary" showing an aggregated score table (one Score column per category + overall Score), matching the existing Dash site pattern
- Selecting a category reveals a second row of sub-tabs for individual benchmarks within that category
- Each benchmark sub-tab shows its own focused metrics table from the per-benchmark API endpoint

**URL routing**
- Clean path-based URLs using Next.js App Router: `/` (summary), `/bulk_crystal` (category → first benchmark), `/bulk_crystal/elasticity` (specific benchmark)
- Deep-linkable and shareable — URL fully determines which category and benchmark are displayed
- Browser back/forward navigation works naturally with file-system routing

**Color scale**
- viridis_r colormap (yellow=good → teal → purple=bad) — matches the existing ML-PEG Dash site
- Continuous gradient (not discrete steps) — each cell gets a unique color from its exact normalized score
- Formula: `(value - bad) / (good - bad)` clamped to [0,1], using threshold metadata from the API
- Missing/None values: gray background with diagonal hatched stripe pattern, matching existing site

**Table layout**
- Horizontal scroll for wide tables (up to 47 metric columns in GSCDB138 benchmarks)
- Pin MLIP and Score columns on the left so they're always visible while scrolling
- Column header tooltips on hover showing metric description, units, and good/bad thresholds (using tooltip_header metadata from the API)
- Number formatting: significant figures (matching the existing Dash site's scientific formatting)
- Data range: 3-47 columns, 7-19 rows per benchmark table

**Page layout**
- MUI AppBar header: "ML-PEG" title on left, GitHub repo link icon + dark/light toggle icon on right
- Table fills remaining viewport height below header + tabs (sticky column headers, table body scrolls vertically)
- No page-level vertical scroll — header, tabs, and table all visible at once
- On mobile/narrow screens: horizontal scroll for table, category tabs become scrollable chips

**Dark/Light mode**
- MUI CSS Variables API (no SSR flash, no next-themes) — decided in Phase 1 research
- Theme preference persists in localStorage
- Toggle icon in the AppBar

### Claude's Discretion
- Color scale adaptation between dark and light mode (text contrast, opacity adjustments)
- GitHub link placement in table (MLIP column links vs separate icon column)
- Exact MUI theme customization (palette, typography, spacing)
- Loading states and skeleton screens
- Error state handling (API failures, empty categories)
- Summary table score aggregation logic (weighted average matching existing site)
- MUI DataGrid column width strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-1.1 | Display all MLIP models in a sortable MUI DataGrid | DataGrid Community tier, `sortModel` prop, `useMemo` for column defs |
| FR-1.2 | Color-code cells using `(value - bad) / (good - bad)` formula | `getCellClassName` + CSS custom props per row, viridis via `d3-scale-chromatic` |
| FR-1.3 | Show benchmark categories as navigation (tabs or sidebar) | MUI Tabs `variant="scrollable"`, Next.js `usePathname` for active state |
| FR-1.4 | Display per-benchmark metrics tables with Score column | Per-benchmark API endpoint already exists; thresholds need API extension |
| FR-1.5 | Use `id` field for routing, `MLIP` field (with D3 suffix) for display | Already in `MetricsRow` type; `id` used for URL, `MLIP` for cell render |
| FR-1.6 | Handle missing model data (None values) with gray/hatched cells | `getCellClassName` checks `params.value == null`; CSS `repeating-linear-gradient` |
| FR-4.1 | Toggle between dark and light themes | MUI `useColorScheme` hook, toggle button in AppBar |
| FR-4.2 | Use MUI CSS Variables API (no SSR flash) | `createTheme({ cssVariables: true })` + `getInitColorSchemeScript` in layout |
| FR-4.3 | Persist preference in localStorage | Automatic with MUI CSS Variables API — no manual storage needed |
| FR-5.1 | GitHub links to model repos and benchmark sources | Hardcoded static map `model-id -> github-url`; renderCell in MLIP column |
| FR-5.2 | Category-based navigation structure matching 14+ benchmark categories | 17 categories in data (minus 1 empty = 16 active); MUI Tabs nested |
| FR-5.3 | Deep-linkable URLs for categories and benchmarks | Next.js App Router `app/[category]/[benchmark]/page.tsx` |
| NFR-1.1 | Initial page load <2s on broadband | CDN cache headers already on API; SWR deduplication; static navigation data |
| NFR-1.2 | Table re-render <100ms | `useMemo` column defs; `getCellClassName` not `renderCell` for heatmap |
| NFR-1.3 | CDN caching on data endpoints | `s-maxage=3600, stale-while-revalidate=86400` already in API; must also pass `thresholds` |
| NFR-4.1 | Keyboard navigable table | MUI DataGrid Community has full keyboard navigation built-in |
| NFR-4.2 | Sufficient color contrast in both themes | Viridis dark cells need white text, light cells need dark text; WCAG threshold at ~0.5 |
| NFR-4.3 | Screen reader labels on interactive elements | `aria-label` on toggle button, DataGrid aria-colindex/aria-rowindex built-in |
</phase_requirements>

---

## Summary

Phase 2 builds the core leaderboard UI on top of the complete Phase 1 API. The frontend starts from a blank `src/app/page.tsx` and `src/app/layout.tsx` — no MUI packages are installed yet. The primary deliverables are: (1) install and wire MUI with CSS Variables for SSR-safe dark/light mode, (2) implement two-level tab navigation (16 categories + benchmark sub-tabs) synced to Next.js App Router paths, (3) render MUI DataGrid Community with viridis_r heatmap coloring via `getCellClassName`, and (4) extend the backend API to expose `thresholds` and `tooltip_header` that the frontend needs for color-coding and column tooltips.

One critical finding: **MUI DataGrid column pinning is a Pro/Premium feature — not available in the Community (MIT-licensed) edition.** The locked decision to "pin MLIP and Score columns on the left" must be implemented via a CSS `position: sticky` override applied through the DataGrid `sx` prop targeting `.MuiDataGrid-cell[data-field="MLIP"]` and `.MuiDataGrid-columnHeader[data-field="MLIP"]`. This approach works in v7 but requires explicit background-color and z-index management to prevent visual bleed-through during horizontal scroll. The planner should treat this as a known implementation risk requiring careful CSS work.

The viridis_r colormap will be implemented with `d3-scale-chromatic`'s `interpolateViridis(1 - t)` (reversing the scale so high normalized values → yellow/good, low → purple/bad). GitHub links for models are not present in the data files and must be maintained as a hardcoded static mapping in a `src/lib/model-links.ts` file.

**Primary recommendation:** Install MUI packages first, wire dark/light mode in `layout.tsx`, build navigation shell with hardcoded route structure, then add tables one at a time (summary first, then per-benchmark).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/material` | ^6.x (latest: ~6.4) | MUI components — AppBar, Tabs, Tooltip, IconButton | Required by project decision |
| `@mui/x-data-grid` | ^7.x (latest: ~7.26) | Community DataGrid (MIT) | Project decision; Community tier sufficient for ≤19 rows |
| `@emotion/react` | ^11.x | Emotion CSS-in-JS — MUI peer dep | Required by MUI |
| `@emotion/styled` | ^11.x | Emotion styled — MUI peer dep | Required by MUI |
| `@mui/material-nextjs` | ^6.x (latest: ~6.4) | `AppRouterCacheProvider` + `getInitColorSchemeScript` for Next.js 15 | Prevents Emotion style flash in Next.js App Router |
| `d3-scale-chromatic` | ^3.x | `interpolateViridis(t)` — viridis colormap | Canonical D3 library; 8 KB treeshakeable; exact match to matplotlib viridis |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@mui/icons-material` | ^6.x | GitHub icon, Brightness4/7 toggle icons | Standard MUI icon set; avoid custom SVGs |
| `swr` | ^2.x | Client-side data fetching with deduplication | Fetching benchmark table on tab change; avoids re-fetch on back-navigation |
| `@types/d3-scale-chromatic` | ^3.x | TypeScript types for d3-scale-chromatic | Dev dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `d3-scale-chromatic` | Custom viridis lookup table (256 RGB values) | Custom LUT saves one dependency but must be manually maintained; d3 is more trustworthy |
| `swr` | `useEffect` + `fetch` | Bare fetch loses deduplication and stale-while-revalidate; SWR respects HTTP cache headers |
| `@mui/x-data-grid` Community | `@mui/x-data-grid-pro` | Pro has native column pinning but costs $180+/dev/yr; CSS sticky workaround is acceptable for ≤19 rows |

**Installation:**
```bash
bun add @mui/material @mui/x-data-grid @emotion/react @emotion/styled @mui/material-nextjs @mui/icons-material d3-scale-chromatic swr
bun add -d @types/d3-scale-chromatic
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── layout.tsx              # MUI ThemeProvider + AppRouterCacheProvider + getInitColorSchemeScript
│   ├── page.tsx                # Summary table (/ route)
│   ├── [category]/
│   │   ├── page.tsx            # Category → first benchmark (redirect or default tab)
│   │   └── [benchmark]/
│   │       └── page.tsx        # Benchmark table (/bulk_crystal/elasticity)
│   └── providers.tsx           # 'use client' ThemeProvider wrapper
├── components/
│   ├── AppHeader.tsx           # AppBar with title + GitHub icon + theme toggle
│   ├── CategoryTabs.tsx        # Top scrollable tab row (16 categories + Summary)
│   ├── BenchmarkSubTabs.tsx    # Second row of benchmark sub-tabs for selected category
│   ├── LeaderboardTable.tsx    # DataGrid with heatmap getCellClassName
│   ├── SummaryTable.tsx        # DataGrid for summary view (one Score col per category)
│   └── TableSkeleton.tsx       # MUI Skeleton loading state
└── lib/
    ├── types.ts                # Existing ApiEnvelope, Category, MetricsRow, Model
    ├── api.ts                  # Fetch helpers (categories, benchmark table, models)
    ├── color.ts                # viridisR(t): normalizeScore(value, good, bad): colorFromScore()
    ├── model-links.ts          # Static map: model-id → GitHub URL
    └── format.ts               # formatSigFigs(value, sigFigs): string
```

### Pattern 1: MUI CSS Variables Dark/Light Mode (No SSR Flash)

**What:** `createTheme({ cssVariables: true, colorSchemes: { light, dark } })` generates CSS custom properties for both schemes. `getInitColorSchemeScript` injects a tiny inline script that reads localStorage before hydration, setting `data-mui-color-scheme` on `<html>` before React renders.

**When to use:** Any Next.js App Router project using MUI — mandatory to avoid theme flash on first load.

```tsx
// src/app/providers.tsx  — 'use client' required for useColorScheme
'use client';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: { palette: { mode: 'light' } },
    dark:  { palette: { mode: 'dark' } },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

```tsx
// src/app/layout.tsx  — Server Component
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getInitColorSchemeScript } from '@mui/material/styles';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript()}          {/* prevents flash */}
        <AppRouterCacheProvider>             {/* Emotion cache for App Router */}
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

### Pattern 2: viridis_r Color Scale for Heatmap Cells

**What:** Compute a per-cell background color from `(value - bad) / (good - bad)`, reversed to match viridis_r (yellow=good, purple=bad), applied via `getCellClassName` + `sx` CSS variables.

**When to use:** Every metric column in the leaderboard table.

```ts
// src/lib/color.ts
import { interpolateViridis } from 'd3-scale-chromatic';

/** Normalize a raw metric value to [0, 1] where 1.0 = good. */
export function normalizeScore(value: number, good: number, bad: number): number {
  const t = (value - bad) / (good - bad);
  return Math.max(0, Math.min(1, t));
}

/**
 * Return a CSS rgb() color from the viridis_r colormap.
 * viridis_r: t=1 (good) → yellow (#fde725), t=0 (bad) → purple (#440154)
 */
export function viridisR(normalizedScore: number): string {
  // interpolateViridis(0) = purple, (1) = yellow
  // viridis_r: reverse so good=yellow → pass (1 - t) when t=normalizedScore
  return interpolateViridis(normalizedScore); // high normalized score → yellow ✓
}

/** Determine text color for WCAG AA contrast on viridis background. */
export function textColorForViridis(normalizedScore: number): 'black' | 'white' {
  // Viridis midpoint ~0.5 is teal (#21908c) — dark text works above ~0.4
  return normalizedScore > 0.4 ? 'black' : 'white';
}
```

```tsx
// In LeaderboardTable.tsx — applying color inline via renderCell
// NOTE: getCellClassName cannot pass inline styles; use renderCell for background-color
// This is acceptable because table is ≤19 rows × ≤47 cols = ≤893 cells
const columns: GridColDef[] = useMemo(() =>
  metricColumns.map((col) => ({
    field: col.field,
    headerName: col.headerName,
    width: 110,
    renderCell: (params: GridRenderCellParams) => {
      if (params.value == null) {
        return <span style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, #888 0px, #888 2px, transparent 2px, transparent 8px)' }} />;
      }
      const threshold = thresholds[col.field];
      if (!threshold) return String(params.value);
      const t = normalizeScore(params.value as number, threshold.good, threshold.bad);
      const bg = viridisR(t);
      const color = textColorForViridis(t);
      return (
        <span style={{ background: bg, color, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px' }}>
          {formatSigFigs(params.value as number, 3)}
        </span>
      );
    },
  })),
[metricColumns, thresholds]);
```

**Important:** `getCellClassName` is preferred for performance, but it only attaches CSS classes — it cannot apply dynamic inline colors. For a continuous viridis gradient (not discrete classes), `renderCell` is necessary. At ≤893 cells, this is safe performance-wise.

### Pattern 3: Next.js App Router Path-Synced Tabs

**What:** MUI Tabs `value` is driven by `usePathname()` from `next/navigation`. Tab clicks use Next.js `<Link>` or `router.push()` for navigation.

**When to use:** Category tabs and benchmark sub-tabs need URL-sync.

```tsx
// src/components/CategoryTabs.tsx
'use client';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export function CategoryTabs({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const router = useRouter();

  // Derive active tab from URL — first segment is category slug
  const currentCategory = pathname.split('/')[1] || '';
  const tabValue = currentCategory || 'summary';

  return (
    <Tabs
      value={tabValue}
      variant="scrollable"
      scrollButtons="auto"
      onChange={(_, value) => router.push(value === 'summary' ? '/' : `/${value}`)}
    >
      <Tab label="Summary" value="summary" />
      {categories.map((cat) => (
        <Tab key={cat.slug} label={cat.name} value={cat.slug} />
      ))}
    </Tabs>
  );
}
```

### Pattern 4: CSS Sticky Column Workaround for Community DataGrid

**What:** Since column pinning is Pro-only, apply `position: sticky; left: 0` directly to the MLIP and Score columns via DataGrid `sx` prop targeting MUI's internal cell classes with `data-field` attribute selectors.

**When to use:** All benchmark tables (except Summary which has narrow columns).

```tsx
// In LeaderboardTable.tsx
<DataGrid
  sx={{
    // Sticky MLIP column header
    '& .MuiDataGrid-columnHeader[data-field="MLIP"]': {
      position: 'sticky',
      left: 0,
      zIndex: 4,
      backgroundColor: 'background.paper',
    },
    // Sticky MLIP cell
    '& .MuiDataGrid-cell[data-field="MLIP"]': {
      position: 'sticky',
      left: 0,
      zIndex: 3,
      backgroundColor: 'background.paper',
    },
    // Sticky Score column — offset by MLIP column width
    '& .MuiDataGrid-columnHeader[data-field="Score"]': {
      position: 'sticky',
      left: 180,  // approximate MLIP column width
      zIndex: 4,
      backgroundColor: 'background.paper',
    },
    '& .MuiDataGrid-cell[data-field="Score"]': {
      position: 'sticky',
      left: 180,
      zIndex: 3,
      backgroundColor: 'background.paper',
    },
  }}
/>
```

**Risk:** MUI v7 uses CSS sticky internally for its own pinning system; the above may conflict with the virtual scroller's overflow handling. Test on the GSCDB138 benchmark (47 columns) as the critical case. If conflicts occur, the fallback is to place MLIP and Score as the first two columns (already the natural data order) and accept no sticky behavior on Community tier.

### Pattern 5: API Extension — Thresholds in BenchmarkTableResponse

**What:** The benchmark table endpoint currently returns only `data` (rows) and `meta` (count, columns). The frontend needs `thresholds` (per-metric good/bad values) and `tooltip_header` (per-column markdown descriptions) for color-coding and column tooltips.

**Approach:** Extend `BenchmarkTableResponse` and `Meta` models to include these fields, read them from the raw JSON in the endpoint handler.

```python
# api/models.py additions
class Threshold(BaseModel):
    good: float
    bad: float
    unit: str | None = None

class ColumnTooltip(BaseModel):
    value: str
    type: str = "markdown"

class BenchmarkMeta(Meta):
    thresholds: dict[str, Threshold] = {}
    tooltip_header: dict[str, ColumnTooltip | str] = {}
```

### Anti-Patterns to Avoid

- **Using `renderCell` for the MLIP column instead of a simple string render:** The MLIP column with GitHub link is the only column that truly needs `renderCell`. All other text columns should use `valueFormatter`.
- **Fetching categories on every page render:** Categories are static; fetch once at app startup and cache with SWR `{ revalidateOnFocus: false, revalidateOnReconnect: false }`.
- **Importing all of d3:** Import only `import { interpolateViridis } from 'd3-scale-chromatic'` — the full d3 bundle is 500 KB+.
- **Using `next-themes` for dark mode:** The locked decision is MUI CSS Variables API. `next-themes` and MUI CSS Variables are incompatible and create conflicts.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Viridis colormap | 256-entry lookup table | `d3-scale-chromatic interpolateViridis` | Exact matplotlib parity, perceptually uniform, 8 KB |
| Dark mode without flash | Reading localStorage manually in JS | MUI `getInitColorSchemeScript` + CSS Variables | Race condition between hydration and localStorage read causes flash |
| Client data caching | `useState` + `useEffect` + manual cache map | SWR with `{ dedupingInterval: 3600000 }` | Request deduplication, stale-while-revalidate, error retry |
| Significant figure formatting | Custom formatter | Native `Number.toPrecision(3)` with fallback | Standard JavaScript; `toPrecision(3)` gives 3 sig figs with scientific notation for very small/large values |
| Accessible DataGrid | Custom ARIA table | MUI DataGrid built-in | DataGrid Community ships with `aria-colindex`, `aria-rowindex`, `role="grid"`, full keyboard nav |

**Key insight:** The viridis colormap and the SSR-safe theme system both have deceptively many edge cases (clamping, contrast, hydration timing). Using the established libraries avoids rediscovering known failure modes.

---

## Common Pitfalls

### Pitfall 1: SSR Hydration Mismatch from useColorScheme

**What goes wrong:** `useColorScheme().mode` returns `undefined` on the server. Any component that renders differently based on `mode` before hydration causes a React hydration mismatch.

**Why it happens:** Server has no access to localStorage; the actual mode is only known after the client hydrates.

**How to avoid:** Handle `undefined` mode by rendering a neutral fallback: `const isDark = mode === 'dark';` — this is `false` on server (fine). The `getInitColorSchemeScript` then updates the CSS variables immediately on client before React renders, so the visual result is correct even if React's initial state is `undefined`.

**Warning signs:** React console error "Prop `className` did not match" or visible theme flash on first load.

### Pitfall 2: Column Definitions Recreated on Every Render

**What goes wrong:** Passing an inline `columns` array to DataGrid triggers full re-render every time (breaks `<100ms` target).

**Why it happens:** React sees a new array reference even if content is identical.

**How to avoid:** `const columns = useMemo(() => buildColumns(thresholds, tooltips), [thresholds, tooltips])` — columns only recompute when thresholds data changes (once per benchmark load).

**Warning signs:** Table flickers after sort; DevTools profiler shows DataGrid re-rendering 200ms+ per sort click.

### Pitfall 3: Thresholds Not Available on First Render (Missing API Data)

**What goes wrong:** The benchmark table API currently does NOT return `thresholds` or `tooltip_header`. Without them, all cells render as uncolored numbers.

**Why it happens:** The API was built in Phase 1 without the frontend color-coding requirement being implemented.

**How to avoid:** Phase 2 must extend the API first (Wave 1 task), before building the color table component. The `BenchmarkTableResponse` needs `thresholds` dict added to `meta`.

**Warning signs:** All table cells show white/default background with no color gradient.

### Pitfall 4: Column Pinning CSS Override Breaking MUI v7 Layout

**What goes wrong:** The CSS sticky workaround for MLIP/Score columns may conflict with MUI DataGrid v7's own sticky header implementation (column headers are already sticky to the top).

**Why it happens:** MUI v7 uses `position: sticky` and complex z-index layers internally. Adding more sticky elements interferes with the overflow context.

**How to avoid:** Apply sticky to cells first, test on GSCDB138 (47 cols), observe z-index conflicts. Set `overflowX: 'auto'` on the DataGrid wrapper explicitly. If broken, accept natural column ordering (MLIP first, Score second) without CSS sticky as fallback.

**Warning signs:** Horizontal scroll causes MLIP column to overlay wrong content, or column headers stop sticking to the top.

### Pitfall 5: Significant Figures with Very Small Numbers

**What goes wrong:** `(0.000123).toPrecision(3)` returns `"0.000123"` — not scientific notation in all browsers (behavior differs for borderline exponents).

**Why it happens:** `toPrecision` uses scientific notation only when exponent < -6 or >= precision.

**How to avoid:** Use a formatter that always gives 3 sig figs: `(n).toPrecision(3)` already handles this correctly per MDN spec. The real pitfall is calling `toPrecision` on `null`/`undefined` — always guard: `value != null ? value.toPrecision(3) : '—'`.

### Pitfall 6: GitHub Links Hardcoded Without a Single Source of Truth

**What goes wrong:** GitHub URLs maintained in two places (frontend static map + any future backend model registry) diverge.

**Why it happens:** The raw data JSON files do not contain GitHub URLs (confirmed by inspection). There is no model registry endpoint.

**How to avoid:** Create `src/lib/model-links.ts` as the single source — a `Record<string, string>` keyed by model `id` (e.g., `'mace-mp-0a': 'https://github.com/ACEsuit/mace-mp'`). Document in a comment that this must be updated when new models are added to the benchmark suite.

---

## Code Examples

### viridis_r Color Computation (Verified pattern)

```typescript
// Source: d3-scale-chromatic official docs + numpy viridis definition
import { interpolateViridis } from 'd3-scale-chromatic';

// viridis_r = reversed viridis: score=1.0 (good) → yellow (#fde725), score=0.0 (bad) → purple (#440154)
// d3 interpolateViridis: 0→purple, 1→yellow — matches viridis_r when score=normalizedGoodness
export function viridisR(normalizedGoodness: number): string {
  const clamped = Math.max(0, Math.min(1, normalizedGoodness));
  return interpolateViridis(clamped); // 0→purple (bad), 1→yellow (good) = viridis_r ✓
}

export function normalizeScore(value: number, good: number, bad: number): number {
  if (good === bad) return 0.5; // degenerate threshold — avoid division by zero
  return (value - bad) / (good - bad);
}
```

### MUI Layout with CSS Variables and No SSR Flash

```tsx
// Source: https://mui.com/material-ui/customization/dark-mode/
// src/app/layout.tsx (Server Component)
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getInitColorSchemeScript } from '@mui/material/styles';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript()}
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

// src/app/providers.tsx (Client Component)
'use client';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,  // Enables CSS custom properties
  colorSchemes: {
    light: {},
    dark: {},
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
```

### Theme Toggle Button in AppBar

```tsx
// Source: https://mui.com/material-ui/customization/dark-mode/
'use client';
import { useColorScheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export function ThemeToggleButton() {
  const { mode, setMode } = useColorScheme();
  // mode is undefined on first server render — guard against it
  const isDark = mode === 'dark';
  return (
    <IconButton
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      color="inherit"
      aria-label="toggle dark/light mode"
    >
      {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}
```

### Significant Figure Formatting

```typescript
// Source: MDN - Number.prototype.toPrecision()
// Uses native JavaScript — no library needed
export function formatSigFigs(value: number | null | undefined, sigFigs = 3): string {
  if (value == null || !isFinite(value)) return '—';
  return value.toPrecision(sigFigs);
}
```

### Hatched Missing Value Cell

```css
/* CSS for gray diagonal hatch — missing/null metric values */
.cell-missing {
  background: repeating-linear-gradient(
    45deg,
    #9e9e9e 0px,
    #9e9e9e 2px,
    #bdbdbd 2px,
    #bdbdbd 8px
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-themes` + manual CSS vars | MUI CSS Variables API with `getInitColorSchemeScript` | MUI v6 (2024) | No external dep needed for theme persistence; works without `suppressHydrationWarning` hacks |
| `renderCell` for all custom styling | `getCellClassName` for class-based, `renderCell` only for dynamic inline | MUI DataGrid v5+ | Significant perf improvement; class-based CSS is reused across rows |
| Import full d3 | Import from `d3-scale-chromatic` directly | Ongoing | Reduces bundle from ~500 KB to ~8 KB for colormap only |

**Deprecated/outdated:**
- `@mui/x-data-grid` v5: Uses `GridRowsProp`/`GridColumns` types — replaced by `GridColDef[]` and plain row arrays in v6+
- `ThemeProvider` alone (without `cssVariables: true`): Works but causes SSR flash; always add `cssVariables: true` in 2024+

---

## Open Questions

1. **CSS sticky workaround reliability in MUI v7**
   - What we know: MUI DataGrid Community does not support column pinning; CSS `position: sticky` on internal cells is theoretically possible
   - What's unclear: Whether MUI v7's virtual scroller overflow model breaks CSS sticky on individual cells; no official confirmation either way
   - Recommendation: Implement and test on widest benchmark (GSCDB138, 47 cols) in Wave 1. If it breaks, accept non-sticky columns as fallback with a code comment documenting the limitation and upgrade path to Pro tier.

2. **Summary table aggregation formula**
   - What we know: Each benchmark has a `Score` field per model; the CONTEXT.md says "weighted average matching existing site"; each benchmark JSON has a `weights` object
   - What's unclear: The `weights` in each benchmark JSON are per-metric weights (for intra-benchmark Score calculation), not inter-benchmark weights for the category summary. The existing Dash site likely uses a simple average of benchmark Scores per category.
   - Recommendation: Use simple arithmetic mean of benchmark `Score` values per category (or check the existing site's source code at https://github.com/ddmms/ml-peg). Flag this for user validation before shipping.

3. **GitHub link data completeness**
   - What we know: Model `id` values include `mace-mp-0a`, `mace-mp-0b3`, `mace-mpa-0`, `mace-omat-0`, `orb-v3-consv-inf-omat`, `mattersim-5M`, `uma-s-1p1-omat`, etc.
   - What's unclear: Complete GitHub URLs for all ~19 model IDs — some models (UMA, MatterSim) may be proprietary with HuggingFace repos rather than GitHub
   - Recommendation: Create `model-links.ts` with known mappings; use `undefined` for unknown models so no broken link renders. Defer to user to fill in missing URLs.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.x (Python only — no frontend test framework installed) |
| Config file | `pyproject.toml` `[tool.pytest.ini_options]` |
| Quick run command | `uv run pytest tests/ -x -q` |
| Full suite command | `uv run pytest tests/ -v` |

No frontend testing framework (Jest/Vitest) is installed. Frontend testing is manual for Phase 2. The planner should add a Wave 0 task to decide whether to install Vitest for component tests — given the small component count, manual browser testing is acceptable for this phase.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-1.1 | DataGrid renders all model rows | manual | browser: load `/bulk_crystal/elasticity`, count rows | N/A |
| FR-1.2 | Color-coding formula correct | unit | `uv run pytest tests/test_color.py -x` | ❌ Wave 0 (frontend logic; Python test for color math) |
| FR-1.3 | Category tabs navigate to correct URL | manual | click tab, verify URL changes | N/A |
| FR-1.4 | Benchmark sub-tabs show per-benchmark table | manual | select category, click sub-tab | N/A |
| FR-1.5 | MLIP column shows display name not id | manual | visual inspection | N/A |
| FR-1.6 | Null cells show hatched pattern | manual | find benchmark with null values | N/A |
| FR-4.1 | Theme toggle works | manual | click toggle button | N/A |
| FR-4.2 | No SSR flash | manual | hard reload, observe flash | N/A |
| FR-4.3 | Theme persists across reload | manual | set dark, reload, verify dark | N/A |
| FR-5.1 | GitHub links present and correct | manual | hover MLIP name, verify link | N/A |
| FR-5.2 | 16 category tabs visible | unit | `uv run pytest tests/test_api.py::test_categories -x` | ✅ |
| FR-5.3 | Deep links load correct tab | manual | navigate directly to `/bulk_crystal/elasticity` | N/A |
| NFR-1.1 | Page load <2s | manual | Chrome DevTools Network, broadband throttle off | N/A |
| NFR-1.2 | Sort re-render <100ms | manual | Chrome DevTools Performance, click column header | N/A |
| NFR-1.3 | CDN cache headers present | unit | `uv run pytest tests/test_api.py::test_benchmark_table_cache_headers -x` | ❌ Wave 0 |
| NFR-4.1 | Keyboard navigation works | manual | Tab through cells, Shift+Tab | N/A |
| NFR-4.2 | WCAG contrast in both themes | manual | Chrome DevTools accessibility panel | N/A |
| NFR-4.3 | Screen reader labels | manual | VoiceOver/NVDA on toggle button | N/A |

### Sampling Rate
- **Per task commit:** `uv run pytest tests/ -x -q` (Python API tests; ~3 seconds)
- **Per wave merge:** `uv run pytest tests/ -v` (full suite; ~10 seconds)
- **Phase gate:** Full suite green + manual browser checklist before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_api.py::test_benchmark_table_cache_headers` — covers NFR-1.3; add to existing `tests/test_api.py`
- [ ] `tests/test_api.py::test_benchmark_table_thresholds` — verifies `meta.thresholds` returned after API extension (FR-1.2)
- [ ] No frontend test framework installation needed — manual testing is sufficient for Phase 2 scope

---

## Sources

### Primary (HIGH confidence)
- MUI Material UI Dark Mode docs — https://mui.com/material-ui/customization/dark-mode/
- MUI DataGrid Column Pinning docs — https://mui.com/x/react-data-grid/column-pinning/ (confirmed Pro-only)
- MUI DataGrid Styling docs — https://mui.com/x/react-data-grid/style/ (getCellClassName vs renderCell)
- d3-scale-chromatic GitHub — https://github.com/d3/d3-scale-chromatic (interpolateViridis API)
- Live codebase inspection: `api/models.py`, `api/index.py`, `src/lib/types.ts`, multiple `*_metrics_table.json` files

### Secondary (MEDIUM confidence)
- MUI Next.js integration docs — https://mui.com/material-ui/integrations/nextjs/ (AppRouterCacheProvider + getInitColorSchemeScript)
- GitHub issue #5189 — https://github.com/mui/mui-x/issues/5189 (CSS sticky workaround — marked "not planned" by MUI maintainer, workaround tested by community)
- npm @mui/material-nextjs — https://www.npmjs.com/package/@mui/material-nextjs (version 7.3.9 current)

### Tertiary (LOW confidence)
- Community blog: dark mode without flash — https://dev.to/torver213/dark-mode-light-mode-in-next-js-14-app-router-with-material-ui-without-ui-flickering-4flk (unverified against MUI v6)
- CSS sticky column approach for DataGrid — multiple StackOverflow/GitHub issue discussions, none officially supported

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed via official MUI docs and codebase inspection; all packages confirmed available on npm
- Architecture: HIGH — Next.js App Router patterns verified; column pinning limitation confirmed from official MUI docs
- Pitfalls: HIGH for known pitfalls (thresholds missing from API, column pinning Pro-only); MEDIUM for CSS sticky reliability (insufficient official documentation)

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (MUI stable; valid ~90 days; check for MUI v7 DataGrid Community feature additions that might include column pinning)
