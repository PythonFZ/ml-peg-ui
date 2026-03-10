# Project Research Summary

**Project:** ML-PEG UI
**Domain:** Scientific benchmarking leaderboard — Next.js + FastAPI monorepo on Vercel
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

ML-PEG UI replaces a Dash-based scientific benchmarking leaderboard with a production-grade Next.js 15 + FastAPI application deployed on Vercel. The data layer is entirely pre-computed: 52 metrics table JSONs, 239+ Plotly figure JSONs, and ~71,000 diatomic curve files live in MinIO object storage. The API is a pure read-only pass-through with no computation — its primary job is to serve the right file from the right S3 key, apply caching headers, and redirect oversized files via presigned URLs. This architecture means performance is almost entirely a frontend concern (bundle size, lazy loading, memoization) and a caching concern (CDN headers).

The most important risk is the size constraint on Vercel: a hard 4.5 MB response body limit and a 500 MB Python bundle limit. Three files violate the response limit — `phonon_interactive.json` (333 MB), `figure_bulk_density.json` (>50 MB), and `figure_shear_density.json` (>50 MB). All three must be served via S3 presigned URL redirects; they must never pass through the function. The local `data/` directory must be excluded from the Vercel bundle entirely via `.vercelignore` and `excludeFiles` in `vercel.json`. Everything else fits comfortably within limits.

The recommended stack is fully locked: Next.js 15 + App Router, FastAPI with minio-py (not boto3), MUI v6 DataGrid Community tier, react-plotly.js with partial bundle and `ssr: false`, bun for JS tooling, uv for Python. The color-coding scheme uses threshold-aware `good`/`bad` values (not viridis) as the data model already encodes per-metric direction and normalization. Phase ordering is driven by a hard dependency: the API must serve real data before any frontend component is meaningful to build.

## Key Decisions (Locked)

These decisions are confirmed and should not be revisited during planning:

- **minio-py over boto3** — 93 KB vs 82 MB. The storage backend is MinIO, not AWS S3. minio-py is native, smaller, and the correct fit.
- **MUI DataGrid Community (MIT)** — 7 rows × ~50 columns is far below the 100-row virtualization cap. Column pinning (Pro-only) is the only missing feature; a CSS sticky workaround suffices.
- **`getCellClassName` + CSS classes for heatmap** — avoids React render per cell; threshold direction (good/bad) is encoded per metric in the data, color formula is `(value - bad) / (good - bad)` clamped to [0,1].
- **Presigned URL redirect for large files** — mandatory for phonon_interactive.json (333 MB), figure_bulk_density.json and figure_shear_density.json (>50 MB each). `Cache-Control: no-store` on presigned URL endpoints to prevent CDN caching stale signed URLs.
- **`dynamic(import, {ssr: false})` + `plotly.js-basic-dist-min`** — ~70% bundle reduction; Plotly loaded only on drawer open.
- **MUI CSS Variables API** (`cssVariables: true`) for dark/light mode — no `next-themes`, no SSR flash.
- **ORJSONResponse as default** — 10-20x faster serialization for figure JSONs up to 2 MB.
- **GZipMiddleware** at `minimum_size=1000`, `compresslevel=6` — does not compress StreamingResponse (acceptable since streaming is not used for data endpoints).
- **`concurrently` for local dev** — not Turborepo; `bun run dev` starts both Next.js (port 3000) and uvicorn (port 8000). Next.js proxies `/api/*` to FastAPI via `next.config.ts` rewrites.
- **Root-level `api/` for Python** — Vercel's auto-detection trigger. Python code lives at `api/index.py`; Next.js route handlers live at `src/app/api/` — these must not conflict.

## Key Findings

### Stack

The Vercel deployment architecture is verified against official docs. The canonical folder structure places FastAPI at `api/index.py` (root level, Vercel auto-detects ASGI). A `vercel.json` catch-all rewrite routes all `/api/*` traffic to that single file. The Python bundle must exclude `data/`, test files, and extxyz/xyz files. uv is natively supported with zero config when `pyproject.toml` + `uv.lock` are present; do not mix with `requirements.txt`.

**Core technologies:**
- Next.js 15 + App Router: frontend framework — official Vercel-first, App Router required for MUI CSS Variables integration
- FastAPI (ASGI): Python API — natively supported by Vercel as ASGI function
- minio-py: S3 client — 93 KB vs 82 MB boto3; MinIO-native, correct for this storage backend
- MUI v6 + `@mui/x-data-grid` Community: UI components — MUI CSS Variables eliminates SSR flash; Community tier sufficient
- react-plotly.js + plotly.js-basic-dist-min: charts — lazy-loaded, `ssr:false`, partial bundle ~1 MB vs 3.5 MB full
- bun: JS package manager + dev runner — auto-detected by Vercel from `bun.lockb`
- uv: Python package manager — auto-detected by Vercel from `pyproject.toml` + `uv.lock`
- orjson: JSON serialization — 10-20x faster than stdlib, AVX2 available on Vercel's x86-64 infra
- concurrently: local dev orchestration — runs Next.js + uvicorn together under `bun run dev`

### Data Model

The data model is fully inspected from live files (HIGH confidence). 52 `*_metrics_table.json` files define 50 benchmarks across 16 categories. Each metrics table is a self-contained schema with `data[]` rows, `columns[]`, `thresholds` (per-metric good/bad values with physical units), `weights` (for user-adjustable score), and `model_configs` (full model configuration for hover cards).

Critical schema details:
- `ThresholdDef.good` and `ThresholdDef.bad` run in opposite directions per metric (MAE: good=0/bad=50; correlation ρ: good=1.0/bad=-1.0). Color interpolation must use `(value - bad) / (good - bad)` not a fixed viridis scale.
- `MLIP` display name may include `-D3` suffix; `id` is always the canonical model ID. Use `id` for routing, `MLIP` for display.
- 19 canonical models are present, but not all appear in every benchmark.
- Weights can be 0.0 (sub-metrics in GMTKN55) — the weight adjustment UI should default to non-zero weights only.

File count scale:
- 52 metrics tables (all small, <100 KB typically)
- 239 figure JSONs (most under 2 MB; 3 exceptions require presigned redirect)
- ~71,000 diatomic curve files (key-addressed, never enumerate the full prefix)
- xyz/extxyz structure files for 10 specific benchmarks (on-demand fetch, single file at a time)
- 3 onboarding video MP4s (serve via presigned URL from S3)

### API Architecture

The FastAPI backend is a pure read-through layer with no computation. Structure:

**Major components:**
1. `api/index.py` — FastAPI app root, registers routers, global middleware (ORJSONResponse, GZipMiddleware), module-level minio-py client singleton
2. `api/routers/benchmarks.py` — metrics table and figure endpoints; presigned redirect for oversized figures
3. `api/routers/diatomics.py` — key-addressed curve fetch; static index from MinIO (never list 71K files)
4. `api/routers/structures.py` — per-structure xyz/extxyz fetch (on-demand)
5. `api/routers/models.py` — model list derived from any metrics table
6. Two-tier cache: CDN via `Cache-Control` headers (`s-maxage=3600`, `stale-while-revalidate=86400` for stable data) + module-level dict for small index objects only

**Endpoint URL structure confirmed:**
```
GET /api/v1/health
GET /api/v1/models
GET /api/v1/benchmarks                                      # index
GET /api/v1/benchmarks/{category}/{benchmark}/metrics       # MetricsTableFile
GET /api/v1/benchmarks/{category}/{benchmark}/figures       # list
GET /api/v1/benchmarks/{category}/{benchmark}/figures/{filename}  # PlotlyFigureFile or 307 redirect
GET /api/v1/diatomics/{model_id}/{element1}/{element2}      # DiatomicCurveFile
GET /api/v1/structures/{category}/{benchmark}/{model}/{id}  # xyz text
GET /api/v1/nebs/{benchmark}/{model}/{path_letter}          # extxyz text
GET /api/v1/phonon/url                                      # 307 presigned redirect
GET /api/v1/onboarding/videos/{filename}                    # 307 presigned redirect
```

### Frontend Components

**Must-have features:**
- Leaderboard table with threshold-aware color-coded cells (getCellClassName pattern)
- Cell click → Drawer with Plotly figure (lazy-loaded on interaction)
- Multi-select Autocomplete for model/benchmark filtering
- Dark/light mode toggle (MUI CSS Variables, no flash)
- Model hover card showing ModelConfig details
- Benchmark category tabs or navigation

**Should-have features:**
- Weight adjustment sliders per metric (data provides weights, re-score client-side)
- Diatomic curve viewer (element pair selector + multi-model overlay chart)
- 3D structure viewer for xyz benchmarks (10 benchmarks have structure files)
- NEB trajectory viewer (li_diffusion, extxyz format)
- Phonon interactive viewer (on-demand, presigned URL, accordion pattern)

**Defer to v2+:**
- Benchmark comparison across categories (requires cross-table normalization)
- Model submission flow
- User-saved configurations / permalinks

### Critical Pitfalls

1. **4.5 MB Vercel response body hard limit** — phonon_interactive.json (333 MB), figure_bulk_density.json and figure_shear_density.json (>50 MB) will return HTTP 413 if proxied through the function. Use presigned URL redirect pattern for any file >4 MB. Set `Cache-Control: no-store` on presigned URL endpoints or CDN will serve expired signed URLs.

2. **500 MB Python bundle limit** — local `data/` directory must be excluded via both `.vercelignore` and `vercel.json` `excludeFiles`. The 333 MB phonon file alone would bust the bundle. Estimated prod bundle: ~17 MB (FastAPI + minio-py + orjson + pydantic).

3. **Listing 92K+ diatomic files from MinIO** — `s3.list_objects("ml-peg", prefix="diatomic/")` returns ~71K entries, exhausts file descriptors (limit: 1,024), and times out. Never enumerate the full diatomic prefix. Use key-addressed fetch. Store a static `diatomic_index.json` in MinIO as a pre-built manifest.

4. **S3 client initialized per request** — cold start jumps from ~200ms to 1-3s if minio-py client is created inside the route handler. Use module-level lazy singleton pattern (shown in backend-api.md Section 2). Vercel Fluid Compute reuses containers — the singleton is reused across requests.

5. **Unstable column definitions triggering DataGrid re-renders** — define `columns` with `useMemo` or outside the component. Each render with a new `columns` array reference forces a full DataGrid re-render. Pre-compute min/max for color normalization at data load time, not inside `getCellClassName`.

6. **react-plotly.js without `ssr: false`** — the library is a class component that assumes a browser DOM. Even with `'use client'`, the `ssr: false` dynamic import is mandatory in Next.js App Router. Also: verify all 239 figure JSONs use only trace types in `plotly.js-basic-dist-min` (scatter, bar, pie); phonon/density figures may require `plotly.js-cartesian-dist-min`.

7. **ThresholdDef direction inversion** — color interpolation assumes `good` > `bad` but that is false for MAE metrics (good=0, bad=50). Always use `(value - bad) / (good - bad)` as the formula. This handles both directions correctly.

## Implications for Roadmap

### Phase 1: Infrastructure and Data Pipeline
**Rationale:** Nothing else can be built or tested without real data accessible from MinIO and a working API skeleton. This phase eliminates the two most critical blockers: Vercel deployment configuration and data serving.
**Delivers:** Deployed skeleton on Vercel (or verified locally), MinIO bucket with data loaded, health endpoint, static index endpoints (/api/v1/models, /api/v1/benchmarks)
**Addresses:** Vercel bundle exclusion, uv/pyproject.toml setup, local dev with `concurrently`
**Avoids:** Bundle size explosion (sets up excludeFiles from day one); S3 client singleton (module-level init from day one)

### Phase 2: Leaderboard Core
**Rationale:** The leaderboard table is the primary screen and exercises the most critical API endpoints. Getting this right validates the full data flow from MinIO through FastAPI to the MUI DataGrid before building secondary views.
**Delivers:** Working leaderboard table with threshold-aware color coding, benchmark category navigation, model metadata, CDN caching headers on all endpoints
**Uses:** `getCellClassName` + CSS color classes, `ThresholdDef` color formula, `MetricsTableFile` TypeScript types
**Implements:** `/api/v1/benchmarks/{category}/{benchmark}/metrics` endpoints (52 files, all small), module-level memory cache for index data
**Avoids:** Unstable column definition re-renders (memoize columns); incorrect threshold direction

### Phase 3: Figure Drawer and Plotly Integration
**Rationale:** The cell-click-to-drawer pattern is the second most important interaction. Requires Phase 2 (table) complete and tests the presigned URL redirect for oversized figures.
**Delivers:** Clickable cells open a Drawer with the correct Plotly figure, lazy-loaded. Presigned URL redirect working for density/phonon figures. Dark mode verified against Plotly chart backgrounds.
**Uses:** `dynamic(import, {ssr: false})` + `plotly.js-basic-dist-min`; MUI Drawer; presigned URL 307 pattern
**Avoids:** SSR failure on Plotly; 4.5 MB response body limit; CDN caching presigned URLs

### Phase 4: Secondary Viewers
**Rationale:** Once the core leaderboard and figure drawer work, these views add depth without blocking anything else. They share the same API patterns but are isolated features.
**Delivers:**
- Diatomic curve viewer (element pair + model selector, multi-overlay Plotly chart)
- 3D structure viewer for xyz benchmarks (on-demand single-file fetch)
- NEB trajectory viewer (extxyz multi-frame)
- Phonon interactive viewer (presigned URL, accordion, on-demand load)
**Avoids:** Enumerating 71K diatomic files (static index from MinIO); loading phonon_interactive.json eagerly

### Phase 5: UX Polish and Advanced Features
**Rationale:** Non-blocking enhancements that improve scientific utility. Safe to defer until core data display is solid.
**Delivers:**
- Weight adjustment sliders (client-side re-score using `weights` from MetricsTableFile)
- Multi-select filter (MUI Autocomplete, ~57 options, client-side)
- Column header tooltips (markdown-rendered `tooltip_header` from MetricsTableFile)
- Model hover cards (ModelConfig details)
- Onboarding video modal (presigned URL for MP4s)
- Dark/light mode toggle (already in layout from Phase 1 but polished here)

### Phase Ordering Rationale

- Phase 1 before everything: Vercel deployment gotchas (bundle size, routing, uv detection) must be solved before any feature work begins. Discovering these late is expensive.
- Phase 2 before Phase 3: The figure drawer assumes the leaderboard table exists to trigger it. API endpoint patterns established in Phase 2 are reused in Phase 3.
- Phase 3 before Phase 4: Presigned URL redirect pattern is established in Phase 3 and reused for phonon/diatomic in Phase 4.
- Phase 4 before Phase 5: No UX polish makes sense until all data surfaces are accessible.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Plotly integration):** Verify trace type coverage of `plotly.js-basic-dist-min` against all 239 actual figure JSONs. May need `plotly.js-cartesian-dist-min` if heatmap/surface traces appear. Medium risk.
- **Phase 4 (3D structure viewer):** No 3D viewer technology was researched. Options include Molstar, NGL Viewer, or 3Dmol.js — all have different bundle sizes and React integration complexity. Needs dedicated spike.
- **Phase 4 (NEB trajectory):** extxyz multi-frame format parsing requires either ASE (heavy Python dep) or a lightweight JS parser. No parser was identified in research.

Phases with well-documented patterns (standard implementation, skip research-phase):
- **Phase 1:** Vercel + FastAPI + uv deployment is fully documented. All patterns verified from official sources.
- **Phase 2:** MUI DataGrid Community + threshold color coding is straightforward. Patterns are copy-ready from frontend-components.md.
- **Phase 5:** MUI Autocomplete, Drawer, ThemeProvider patterns are all documented and code-ready.

## Open Questions

1. **Phonon interactive split strategy** — serve the 333 MB file as a presigned URL redirect (simple, client must handle), or pre-split per-model into ~19 smaller files server-side (better UX, requires a data transformation script). Decision needed before Phase 4.

2. **S3 bucket path prefix** — the MinIO bucket structure mirrors `data/` locally, but the exact bucket name and root prefix in production must be confirmed from deployment configuration. The `S3_BUCKET` env var pattern is in place; the key structure needs a canonical source of truth.

3. **Conformer benchmark structure files** — research noted that conformer benchmarks appear to have model subdirectories but no xyz files were confirmed. Determine whether xyz structure files exist for conformers before implementing the 3D viewer scope in Phase 4.

4. **Plotly trace type audit** — density scatter figures (bulk_density, shear_density) are >50 MB and use unknown trace types. Must audit the actual figure JSON schemas before committing to the basic vs cartesian Plotly bundle.

5. **diatomic_index.json pre-build** — a static manifest of available (element_pair, model) combinations must be generated and uploaded to MinIO before the diatomic curve viewer can work without enumerating the bucket. Decide whether this is a one-time script (Phase 1) or part of a data pipeline.

6. **CORS for MinIO presigned URLs** — the frontend fetches presigned URLs that point directly to MinIO. If MinIO is on a different origin than the Vercel deployment, the browser will block the request unless MinIO has CORS configured. MinIO CORS configuration needs to be verified/set for the production endpoint.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Deployment Architecture | HIGH | All Vercel limits, routing, uv support verified from official docs |
| Backend API | HIGH | Vercel limits double-verified; minio-py size from PyPI; orjson benchmarks from multiple sources |
| Frontend Components | HIGH (MUI), MEDIUM (Plotly) | MUI patterns from official docs; react-plotly.js maintenance status uncertain, last major update ~2 years ago |
| Data Model | HIGH | Direct inspection of live JSON files; TypeScript types derived from actual schemas |

**Overall confidence:** HIGH

### Gaps to Address

- **3D structure viewer technology:** Not researched. Needs a dedicated spike in Phase 4 planning. Molstar is the gold standard for structural biology but may be overkill; NGL Viewer is lighter.
- **Plotly trace type coverage:** `plotly.js-basic-dist-min` covers scatter/bar/pie. Density and phonon figures may use heatmap or surface traces. Must audit before finalizing the Plotly bundle choice.
- **MinIO CORS configuration:** Presigned URL pattern assumes the browser can fetch directly from MinIO. If MinIO is behind a firewall or on a private network, the presigned URL approach breaks and a server-side streaming proxy becomes necessary.
- **Data pipeline for pre-computed indexes:** A `leaderboard_summary.json` and `diatomic_index.json` should be pre-computed and stored in MinIO rather than computed on every API request. Who owns this pipeline and when is it run is undefined.

## Sources

### Primary (HIGH confidence)

- [Vercel FastAPI docs](https://vercel.com/docs/frameworks/backend/fastapi) — routing, folder structure, ASGI detection
- [Vercel Python runtime docs](https://vercel.com/docs/functions/runtimes/python) — uv support, pyproject.toml, Python version pinning
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) — 4.5 MB response body, 500 MB bundle, timeout, memory
- [Vercel rewrites docs](https://vercel.com/docs/rewrites) — catch-all rewrite for FastAPI
- [Vercel uv changelog](https://vercel.com/changelog/python-package-manager-uv-is-now-available-for-builds-with-zero) — native uv support
- [Vercel Cache-Control headers](https://vercel.com/docs/caching/cache-control-headers) — CDN caching strategy
- [minio-py PyPI](https://pypi.org/project/minio/) — 93.8 KB wheel size
- [MUI X DataGrid features](https://mui.com/x/react-data-grid/features/) — Community vs Pro tier comparison
- [MUI Dark Mode docs](https://mui.com/material-ui/customization/dark-mode/) — CSS Variables API
- [boto3 AWS_ENDPOINT_URL](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/configuration.html) — MinIO endpoint override
- Data model: direct file inspection of 8+ live JSON schemas and directory tree

### Secondary (MEDIUM confidence)

- [Next.js FastAPI Starter template](https://vercel.com/templates/next.js/nextjs-fastapi-starter) — confirmed routing conventions
- [react-plotly.js GitHub](https://github.com/plotly/react-plotly.js) — ssr:false requirement, factory pattern
- [plotly.js bundle size discussion](https://community.plotly.com/t/how-can-i-reduce-bundle-size-of-plotly-js-in-react-app/89910) — partial bundle sizing
- [orjson performance benchmarks](https://undercodetesting.com/boost-fastapi-performance-by-20-with-orjson/) — 10-20x faster claim
- [MUI DataGrid Performance](https://v6.mui.com/x/react-data-grid/performance/) — getCellClassName recommendation

### Tertiary (LOW confidence)

- react-plotly.js maintenance status — last major GitHub activity ~2 years ago; library still functional but may have React 19 class component compatibility edge cases. Monitor during Phase 3.

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
