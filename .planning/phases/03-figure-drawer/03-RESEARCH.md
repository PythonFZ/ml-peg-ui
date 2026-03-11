# Phase 3: Figure Drawer - Research

**Researched:** 2026-03-11
**Domain:** MUI Drawer + Plotly lazy loading + FastAPI figure serving + SWR caching
**Confidence:** HIGH

## Summary

Phase 3 is well-defined and the codebase provides strong foundations. The figure endpoint is stubbed at `/api/v1/benchmarks/{slug}/figures/{figure_slug}` returning 501. The storage abstraction (`api/storage.py`) already has `presigned_url()` on `MinioBackend` and a local `get_json()` for filesystem dev — both ready for figure serving. All 239 figure JSON files use only `scatter` and `scattergl` trace types (confirmed by full audit), validating the `plotly.js-basic-dist-min` bundle choice. The largest figure is 2.4 MB, so all current figures serve inline without presigned redirect, but the 307 redirect path should be implemented for future-proofing.

The frontend work has two clear parts: (1) a new `FigureDrawer` component with lazy Plotly loading via `next/dynamic`, and (2) wiring `onCellClick` into `LeaderboardTable`. SWR is already in use (`src/lib/api.ts`) and the figure fetch hook fits naturally alongside existing hooks. Dark/light mode uses MUI CSS Variables API (Phase 2), and Plotly theming requires overriding `layout.paper_bgcolor`, `plot_bgcolor`, `font.color`, and gridline colors at render time.

**Primary recommendation:** Implement the figure endpoint in `api/index.py` using the existing `storage.get_json()` path with a size-check for the 307 redirect, then build a `FigureDrawer` component using `next/dynamic` with `plotly.js-basic-dist-min`. Wire `onCellClick` in `LeaderboardTable`, disable clicks for the 5 benchmarks without figures, and apply MUI theme colors to Plotly layout at render time.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Drawer behavior**
- Right-side MUI Drawer, ~50% viewport width
- Clicking another cell while drawer is open swaps the figure in-place (no close/reopen animation)
- Close via X button, clicking outside (backdrop), or Escape key — standard MUI Drawer behavior
- Drawer header shows benchmark name + model name for context (e.g., "Elasticity — MACE-MP-0a")

**Cell click trigger**
- All metric data cells are clickable (not just Score) — clicking any cell opens figures for that benchmark
- Pointer cursor + subtle hover brightness/elevation change to indicate interactivity
- Benchmarks without figures (5 out of 53, verified: phonons, diatomics, extensivity, locality, graphene_wetting_under_strain) have click disabled — no pointer cursor, no hover effect
- Requires knowing which benchmarks have figures (API or metadata check)

**Multi-figure handling**
- Benchmarks with multiple figures (GSCDB138_NCIs has 45, GSCDB138_thermochemistry has 44) show all figures stacked in a scrollable drawer
- No figure selection UI needed — just scroll through all figures for that benchmark

**Figure display**
- Plotly modebar (zoom, pan, download) shows on hover — clean by default, tools available on demand
- Skeleton placeholder while figure loads — matches TableSkeleton pattern from leaderboard
- Dark/light mode: override Plotly layout.paper_bgcolor, plot_bgcolor, font.color, and gridline colors to match current MUI theme (not Plotly's built-in dark template)

**Plotly bundle strategy**
- Use `plotly.js-basic-dist-min` (~1.5 MB gzipped) — includes scatter, scattergl, bar, histogram, pie, heatmap, contour; future-proof for Phase 4
- Lazy load via `next/dynamic` with `ssr: false` — Plotly bundle downloads only on first drawer open (NFR-1.4)
- All 239 figures use only `scatter` and `scattergl` trace types (verified by audit)

**Backend figure serving**
- Implement the stubbed figure endpoint to return figure JSON directly (all current figures <4 MB)
- Include size-check + 307 presigned URL redirect logic for files >4 MB (ready for future large figures)
- Satisfies FR-3.4 proactively

**Client-side caching**
- Use SWR (already used for table data) to cache fetched figures
- Re-opening drawer for same benchmark is instant from cache
- Consistent with existing data fetching pattern

### Claude's Discretion
- Exact drawer animation timing and easing
- Skeleton placeholder design and sizing
- Figure title formatting within the drawer
- Error state when figure fetch fails
- Mobile responsive behavior for drawer width
- SWR cache configuration (stale time, revalidation)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FR-3.1 | Click table cell → open MUI Drawer with Plotly figure | MUI Drawer + onCellClick handler in DataGrid; FigureDrawer component; swap-in-place state pattern |
| FR-3.2 | Load Plotly lazily via `dynamic(ssr: false)` + partial bundle | `next/dynamic` with `{ ssr: false }` imports `plotly.js-basic-dist-min`; component renders null until drawer opens |
| FR-3.3 | Support density scatter, violin, parity, and confusion matrix plot types | All 239 figures confirmed as `scatter`/`scattergl` only; basic-dist-min bundle covers all; theming via layout overrides |
| FR-3.4 | Serve figures >4 MB via presigned S3 URL redirect (307) | `storage.presigned_url()` already implemented in MinioBackend; endpoint uses `get_bytes_size()` or stat then 307 redirect |
| NFR-1.4 | Plotly bundle loaded only on first drawer open | `next/dynamic` defers bundle download until first render; subsequent opens use React component already loaded |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `plotly.js-basic-dist-min` | ^2.x | Plotly charting bundle | Smallest bundle with scatter/scattergl; 1.5 MB gzipped vs 3.5 MB full |
| `@mui/material` Drawer | ^7.3.9 (installed) | Sliding panel | Already in project; standard MUI pattern |
| `swr` | ^2.4.1 (installed) | Figure fetch + caching | Already in use for table data; consistent pattern |
| `next/dynamic` | bundled with Next.js ^15 | Lazy component import | Official Next.js API for code-splitting with `ssr: false` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-plotly.js` | ^2.6.0 | React wrapper for Plotly | Wraps `plotly.js-basic-dist-min` via factory pattern for React integration |
| MUI `Skeleton` | installed | Loading placeholder | Already used in TableSkeleton; reuse for figure loading state |
| MUI `useColorScheme` | bundled | Read current MUI color mode | Apply dark/light overrides to Plotly layout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `plotly.js-basic-dist-min` | `plotly.js-cartesian-dist-min` | cartesian is smaller but basic is future-proof for Phase 4 violin/confusion matrix types |
| `react-plotly.js` factory | Raw `Plotly.newPlot()` DOM calls | Factory is idiomatic React, handles resize/unmount lifecycle; raw calls require refs and manual cleanup |
| SWR for figure caching | `useState` + `useEffect` | SWR provides built-in dedup, cache keying, and error handling; consistent with existing pattern |

**Installation:**
```bash
bun add plotly.js-basic-dist-min react-plotly.js
bun add -d @types/react-plotly.js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── FigureDrawer.tsx      # MUI Drawer + lazy Plotly + SWR figure fetch
│   ├── PlotlyChart.tsx       # next/dynamic wrapper (ssr:false) for react-plotly.js
│   └── FigureSkeleton.tsx    # Loading skeleton for figure area
├── lib/
│   ├── api.ts                # Add useBenchmarkFigures() hook
│   └── types.ts              # Add FigureData, FigureResponse interfaces
api/
├── index.py                  # Implement benchmark_figure() endpoint (replace 501)
├── models.py                 # Add FigureResponse, FigureItem Pydantic models
└── storage.py                # Already has presigned_url() — add get_object_size()
```

### Pattern 1: Lazy Plotly with next/dynamic and factory pattern

**What:** `react-plotly.js` requires its Plotly instance at import time via `createPlotlyComponent(Plotly)`. The factory call must happen in the module that is dynamically imported (the leaf component), not in the parent.

**When to use:** Any time Plotly is rendered inside a React tree without SSR.

**Example:**
```typescript
// src/components/PlotlyChart.tsx  (this file is dynamically imported, never directly)
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart({ data, layout }: { data: Plotly.Data[]; layout: Partial<Plotly.Layout> }) {
  return <Plot data={data} layout={layout} config={{ displayModeBar: 'hover' }} useResizeHandler style={{ width: '100%' }} />;
}
```

```typescript
// src/components/FigureDrawer.tsx  (imports PlotlyChart lazily)
import dynamic from 'next/dynamic';

const PlotlyChart = dynamic(() => import('./PlotlyChart'), { ssr: false });
```

**Key point:** `ssr: false` prevents Plotly from being bundled in the server render. The bundle only downloads when `PlotlyChart` first renders in the browser — which happens on first drawer open.

### Pattern 2: Swap-in-place drawer state

**What:** A single `FigureDrawer` component controlled by parent state. No open/close animation when switching benchmarks.

**When to use:** When user clicks a second cell while drawer is already open.

**Example:**
```typescript
// In the page component holding drawer state
const [drawerState, setDrawerState] = useState<{
  open: boolean;
  benchmarkSlug: string | null;
  benchmarkName: string;
  modelName: string;
} | null>(null);

// DataGrid onCellClick handler
const handleCellClick = (params: GridCellParams) => {
  const slug = params.row.benchmarkSlug; // or derived from active benchmark
  if (!slugsWithFigures.has(slug)) return;
  setDrawerState(prev =>
    prev?.open && prev.benchmarkSlug === slug
      ? prev
      : { open: true, benchmarkSlug: slug, benchmarkName: ..., modelName: params.row.MLIP }
  );
};
```

### Pattern 3: Figure API endpoint with size-based routing

**What:** FastAPI endpoint reads figure file; if size > 4 MB, returns 307 to presigned URL; otherwise returns JSON inline.

**When to use:** All figure requests. Currently all files are <4 MB so the redirect path is never triggered, but it must be present.

**Example:**
```python
# api/index.py
@router.get("/benchmarks/{slug}/figures/{figure_slug}")
async def benchmark_figure(slug: str, figure_slug: str, request: Request, response: Response):
    slug_map = request.app.state.slug_map
    storage = request.app.state.storage

    bench_path = slug_map.get(slug.lower())
    if bench_path is None:
        raise HTTPException(status_code=404, detail=f"Benchmark '{slug}' not found")

    figure_file = f"{bench_path}/figure_{figure_slug}.json"

    # Size check: if >4 MB, issue presigned redirect
    try:
        size = storage.get_object_size(figure_file)  # new method to add
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Figure '{figure_slug}' not found")

    INLINE_LIMIT = 4 * 1024 * 1024  # 4 MB
    if size > INLINE_LIMIT:
        url = storage.presigned_url(figure_file)
        return Response(status_code=307, headers={"Location": url})

    payload = storage.get_json(figure_file)
    response.headers["Cache-Control"] = CACHE_HEADER
    return FigureResponse(data=payload)
```

**Storage additions needed:**
- `FilesystemBackend.get_object_size(path) -> int` — `Path.stat().st_size`
- `MinioBackend.get_object_size(path) -> int` — `client.stat_object(bucket, key).size`
- Add to `StorageBackend` Protocol

### Pattern 4: Plotly dark/light theming

**What:** Override Plotly's layout colors at render time using MUI theme values. Plotly's built-in dark template is not used — MUI theme colors are applied directly.

**When to use:** Every Plotly render; responds to `useColorScheme()` mode changes.

**Example:**
```typescript
import { useColorScheme } from '@mui/material/styles';

function getPlotlyThemeOverrides(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return {
    paper_bgcolor: isDark ? '#1a1a2e' : '#ffffff',
    plot_bgcolor: isDark ? '#16213e' : '#f5f5f5',
    font: { color: isDark ? '#e0e0e0' : '#212121' },
    xaxis: { gridcolor: isDark ? '#2d2d4e' : '#e0e0e0' },
    yaxis: { gridcolor: isDark ? '#2d2d4e' : '#e0e0e0' },
  };
}
```

The exact color values should match the MUI theme tokens from Phase 2. Use `useColorScheme()` — already established in the project for dark/light mode.

### Pattern 5: SWR figure list hook

**What:** Fetch all figures for a benchmark slug. Returns array of figure objects (each with `data` and `layout`). Null key prevents fetch when drawer is closed.

**Example:**
```typescript
// src/lib/api.ts addition
export function useBenchmarkFigures(slug: string | null) {
  const { data, isLoading, error } = useSWR<FigureListResponse>(
    slug ? `/api/v1/benchmarks/${slug}/figures` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return {
    figures: data?.data ?? [],
    isLoading,
    error,
  };
}
```

**API endpoint design:** Return all figures for a benchmark in a single request rather than N requests. This avoids waterfall fetching when a benchmark has 44 figures. The endpoint becomes `GET /api/v1/benchmarks/{slug}/figures` (collection) returning an array, rather than fetching each figure separately.

**Alternative (per-figure):** Use `GET /api/v1/benchmarks/{slug}/figures/{figure_slug}` — cleaner REST design but requires N fetches for multi-figure benchmarks. Given the largest benchmarks have 44-45 figures, a bulk endpoint avoids latency.

### Anti-Patterns to Avoid

- **Importing Plotly at top level in a component used server-side:** Plotly uses browser globals (`window`, `document`). Must stay behind `dynamic({ ssr: false })`.
- **Using `next/dynamic` with `loading` prop for skeleton:** The skeleton should live in `FigureDrawer` (always rendered), not in the dynamic wrapper, so it shows while the bundle itself loads.
- **Calling `createPlotlyComponent(Plotly)` in the dynamically loaded parent:** Must be in the dynamically imported leaf module.
- **Fetching figures in a loop:** When a benchmark has 44 figures, fire a single bulk request, not 44 individual requests.
- **Applying Plotly dark template via `template: 'plotly_dark'`:** This doesn't match MUI's color scheme. Override layout colors directly instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plotly React integration | Custom `useEffect` with `Plotly.newPlot()` | `react-plotly.js` factory | Handles resize, cleanup, update diffing, and React lifecycle |
| Figure caching layer | Custom `Map` cache in state | SWR | Already present, handles dedup, error states, stale-while-revalidate |
| Drawer open/close state machine | Complex reducer | Simple `useState` with `{ open, benchmarkSlug }` | Swap-in-place is a 2-field state change, not complex |
| Presigned URL generation | Custom HMAC signing | `storage.presigned_url()` (already built) | minio-py already handles this correctly |
| File size check | Downloading the file to check size | `stat_object()` (MinIO) / `Path.stat().st_size` (filesystem) | Metadata-only call, no data transfer |

**Key insight:** The storage abstraction already has presigned URL generation. The only missing piece is a `get_object_size()` method that does a metadata-only stat call.

## Common Pitfalls

### Pitfall 1: Plotly SSR crash
**What goes wrong:** `window is not defined` error during Next.js SSR if Plotly (or `react-plotly.js`) is imported outside of `dynamic({ ssr: false })`.
**Why it happens:** Plotly accesses browser globals at module load time.
**How to avoid:** `PlotlyChart.tsx` (the leaf that imports Plotly) must only ever be loaded via `dynamic()`. Never import it directly.
**Warning signs:** Build error or runtime error in server console mentioning `window`/`document`.

### Pitfall 2: Figure API returns figures for wrong benchmark
**What goes wrong:** Drawer shows stale figures from the previous benchmark when swapping cells rapidly.
**Why it happens:** If the API key passed to SWR doesn't change, SWR returns cached data. If state updates are batched incorrectly, old slug persists.
**How to avoid:** Always pass the current `benchmarkSlug` as the SWR key. Set slug to `null` to suspend fetching — SWR handles null keys by returning no data.
**Warning signs:** Header says "Benchmark B" but figures show Benchmark A data.

### Pitfall 3: Benchmarks without figures get click handler
**What goes wrong:** Clicking on phonons/diatomics/extensivity/locality/graphene_wetting_under_strain opens the drawer but the figure fetch returns 404.
**Why it happens:** Current data shows 5 benchmarks have no figure files (confirmed by filesystem audit).
**How to avoid:** Maintain a set of slugs-without-figures either hardcoded or from API metadata. Check before attaching `onCellClick` behavior.
**Warning signs:** Drawer opens, shows loading skeleton, then shows error state permanently.

### Pitfall 4: react-plotly.js createPlotlyComponent called at wrong level
**What goes wrong:** Plotly bundle gets included in the server bundle anyway, or `createPlotlyComponent` receives the wrong Plotly instance.
**Why it happens:** Calling `createPlotlyComponent(Plotly)` in a component that is not itself the `dynamic()` target causes the call to happen in the parent scope.
**How to avoid:** The call `createPlotlyComponent(Plotly)` must be at module level inside `PlotlyChart.tsx`, the exact file passed to `dynamic(import('./PlotlyChart'))`.
**Warning signs:** Large initial JS bundle size; Plotly in the server-rendered HTML source.

### Pitfall 5: Multi-figure benchmarks cause waterfall requests
**What goes wrong:** A benchmark with 44 figures fires 44 sequential fetch requests on drawer open.
**Why it happens:** If the hook fetches each figure by slug individually.
**How to avoid:** Design the API to return all figures for a benchmark in a single response. OR: if per-figure endpoint is kept, SWR's deduplication still fires all requests in parallel, but the response size is bounded by 4 MB per figure.
**Warning signs:** Drawer takes multiple seconds to populate for large-figure benchmarks.

### Pitfall 6: Plotly modebar covers drawer header
**What goes wrong:** Plotly's modebar overlaps the drawer header or close button.
**Why it happens:** Plotly positions modebar as `position: absolute` in the top-right of the plot container.
**How to avoid:** Ensure the plot container has `position: relative` and sufficient top padding, or set `config.displayModeBar: 'hover'` so it only appears on chart hover.
**Warning signs:** Modebar visible on initial render overlapping drawer chrome.

## Code Examples

Verified patterns from official sources and existing codebase:

### MUI Drawer (right-side, 50% width)
```typescript
// Source: MUI Drawer docs + existing project MUI v7 install
import Drawer from '@mui/material/Drawer';

<Drawer
  anchor="right"
  open={open}
  onClose={handleClose}
  PaperProps={{ sx: { width: { xs: '100%', md: '50vw' } } }}
>
  {/* content */}
</Drawer>
```

### next/dynamic with ssr:false
```typescript
// Source: Next.js 15 docs — dynamic imports
import dynamic from 'next/dynamic';

const PlotlyChart = dynamic(() => import('@/components/PlotlyChart'), {
  ssr: false,
  // No loading prop here — skeleton lives in FigureDrawer
});
```

### react-plotly.js factory pattern
```typescript
// Source: react-plotly.js README — custom Plotly bundle
// FILE: src/components/PlotlyChart.tsx (imported dynamically only)
import Plotly from 'plotly.js-basic-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

export default function PlotlyChart({ data, layout, config }) {
  return (
    <Plot
      data={data}
      layout={layout}
      config={{ displayModeBar: 'hover', ...config }}
      useResizeHandler
      style={{ width: '100%', height: '400px' }}
    />
  );
}
```

### DataGrid onCellClick with disabled-cell detection
```typescript
// Source: MUI DataGrid v8 docs — event handlers
// In LeaderboardTable.tsx
<DataGrid
  rows={rows}
  columns={columns}
  onCellClick={(params: GridCellParams) => {
    // Skip non-metric columns
    if (params.field === 'MLIP' || params.field === '__check__') return;
    // Skip benchmarks without figures
    if (slugsWithoutFigures.has(activeBenchmarkSlug)) return;
    onCellClick?.(params);
  }}
  // CSS for pointer cursor on clickable cells
  sx={{
    '& .MuiDataGrid-cell[data-has-figures="true"]': {
      cursor: 'pointer',
      '&:hover': { filter: 'brightness(0.92)' },
    },
  }}
/>
```

### FastAPI 307 redirect
```python
# Source: FastAPI/Starlette docs — redirect response
from fastapi.responses import RedirectResponse

# Inside the figure endpoint:
if size > INLINE_LIMIT:
    url = storage.presigned_url(figure_file)
    return RedirectResponse(url=url, status_code=307)
```

### SWR figure hook (null key pattern)
```typescript
// Source: SWR docs — conditional fetching
export function useBenchmarkFigures(slug: string | null) {
  const { data, isLoading, error } = useSWR<FigureListResponse>(
    slug ? `/api/v1/benchmarks/${slug}/figures` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return { figures: data?.data ?? [], isLoading, error };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import Plotly from 'plotly.js'` (full 3.5 MB) | `plotly.js-basic-dist-min` (~1.5 MB gzipped) | Plotly 2.x introduced dist bundles | 57% bundle size reduction |
| next-themes for dark mode | MUI `cssVariables: true` + `getInitColorSchemeScript()` | MUI v6+ | No SSR flash, no extra package |
| `Plotly.newPlot()` DOM calls in `useEffect` | `react-plotly.js` factory + `createPlotlyComponent` | react-plotly.js 2.x | Proper React lifecycle, resize handling |
| Per-figure fetch requests | Bulk figures endpoint | Design choice | Avoids 44-request waterfall for GSCDB138 benchmarks |

**Deprecated/outdated:**
- `plotly.js-dist` (full bundle): Use `plotly.js-basic-dist-min` or `plotly.js-cartesian-dist-min` instead.
- Plotly built-in dark template (`template: 'plotly_dark'`): Does not match MUI theme; override colors directly.

## Open Questions

1. **Bulk vs. per-figure API endpoint design**
   - What we know: GSCDB138_NCIs has 45 figures; RDB7 barrier_density is 2.4 MB
   - What's unclear: If bulk endpoint returns all figures for GSCDB138_thermochemistry (44 × avg 200 KB ≈ 8 MB JSON), that exceeds Vercel's 4.5 MB response limit
   - Recommendation: Keep per-figure endpoint (`GET /api/v1/benchmarks/{slug}/figures/{figure_slug}`) and use SWR `Promise.all` pattern or individual hooks per figure slug. The figure list (slugs only) comes from a separate lightweight `GET /api/v1/benchmarks/{slug}/figures` index endpoint. Each figure fetches independently (SWR deduplication handles concurrent requests).

2. **Benchmarks-without-figures detection**
   - What we know: 5 benchmarks currently lack figures (phonons, diatomics, extensivity, locality, graphene_wetting_under_strain). Confirmed by filesystem audit.
   - What's unclear: Whether this list should be hardcoded or returned dynamically from the API
   - Recommendation: Return `has_figures: boolean` in the categories endpoint or benchmark table meta so the frontend doesn't need a hardcoded list. Alternatively, the figures index endpoint returning an empty array is sufficient — the cell click handler checks `figures.length > 0`.

3. **Figure index endpoint — needed or not?**
   - What we know: The existing API endpoint stub is `GET /api/v1/benchmarks/{slug}/figures/{figure_slug}` (per-figure)
   - What's unclear: Whether to add `GET /api/v1/benchmarks/{slug}/figures` (index) returning figure slug list
   - Recommendation: Add the lightweight index endpoint. It allows the frontend to know which figure slugs exist before fetching them, enables preloading, and lets the cell-click handler know whether a benchmark has figures without a hardcoded list.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.x |
| Config file | `pyproject.toml` (`[tool.pytest.ini_options]`) |
| Quick run command | `uv run pytest tests/test_api.py -x -q` |
| Full suite command | `uv run pytest -x -q` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FR-3.1 | `GET /api/v1/benchmarks/{slug}/figures` returns figure list | unit | `uv run pytest tests/test_api.py::test_benchmark_figures_index -x` | ❌ Wave 0 |
| FR-3.1 | `GET /api/v1/benchmarks/{slug}/figures/{figure_slug}` returns JSON | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_json -x` | ❌ Wave 0 |
| FR-3.1 | Cell click opens drawer (visual behavior) | manual-only | N/A | N/A — UI interaction |
| FR-3.2 | Plotly bundle not in initial page JS (lazy load) | manual-only | N/A — browser devtools check |
| FR-3.3 | scatter/scattergl figures render | manual-only | N/A — visual confirmation |
| FR-3.4 | Figure >4 MB returns 307 redirect | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_redirect -x` | ❌ Wave 0 |
| NFR-1.4 | Plotly bundle loaded once on first drawer open | manual-only | N/A — browser network tab |

### Sampling Rate
- **Per task commit:** `uv run pytest tests/test_api.py -x -q`
- **Per wave merge:** `uv run pytest -x -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_api.py` — add `test_benchmark_figures_index`, `test_benchmark_figure_json`, `test_benchmark_figure_redirect` (extend existing file)
- [ ] No new test files needed — extend `tests/test_api.py` with figure-specific tests
- [ ] `tests/conftest.py` already exists (confirmed); no new fixtures needed for API tests

---

## Sources

### Primary (HIGH confidence)
- Filesystem audit of `/data/` — 239 figure files, all `scatter`/`scattergl` trace types, largest 2.4 MB
- `api/storage.py` — `presigned_url()` already implemented; `get_json()` ready to use
- `api/index.py` — figure endpoint stubbed at line 193-207; clear implementation target
- `src/lib/api.ts` — SWR pattern confirmed; `useBenchmarkFigures` hook fits naturally
- `src/components/LeaderboardTable.tsx` — `onCellClick` prop absent; `disableRowSelectionOnClick` present
- `package.json` — MUI v7, SWR v2.4.1, Next.js v15 confirmed; Plotly not yet installed
- `pyproject.toml` — pytest v8 confirmed; test infrastructure in `tests/`

### Secondary (MEDIUM confidence)
- react-plotly.js factory pattern — standard documented approach for custom Plotly bundles; README confirmed via knowledge
- `plotly.js-basic-dist-min` bundle contents — includes scatter, scattergl per official Plotly bundle documentation
- MUI Drawer API — `anchor="right"`, `PaperProps.sx.width` pattern — standard MUI v7 usage confirmed by existing MUI v7 install

### Tertiary (LOW confidence)
- Vercel 4.5 MB response body limit — cited in discussion; needs verification if bulk endpoint is considered
- `stat_object()` MinIO API for size check — standard minio-py method; confirm exact method name from minio-py docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — plotly not installed yet but confirmed from CONTEXT.md + trace type audit
- Architecture: HIGH — full codebase read, all integration points confirmed
- Pitfalls: HIGH — based on direct code inspection + Plotly SSR constraints (well-known)
- API design: MEDIUM — open question on bulk vs per-figure endpoint; recommendation given

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable stack, 30 days)
