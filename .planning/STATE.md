---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 05-01-PLAN.md
last_updated: "2026-03-12T09:24:10.614Z"
last_activity: "2026-03-10 — Plan 01-02 complete: FastAPI backend with storage abstraction and all Phase 1 endpoints"
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 16
  completed_plans: 14
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Fast, modern scientific benchmarking leaderboard replacing the slow Dash app at ml-peg.stfc.ac.uk
**Current focus:** Phase 1 — Infrastructure

## Current Position

Phase: 1 of 5 (Infrastructure)
Plan: 2 of 2 in current phase (01-01 and 01-02 complete — Phase 1 done)
Status: Phase 1 complete
Last activity: 2026-03-10 — Plan 01-02 complete: FastAPI backend with storage abstraction and all Phase 1 endpoints

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 7.5 min
- Total execution time: 0.25 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure | 2 | 15min | 7.5min |

**Recent Trend:**
- Last 5 plans: 12min (01-01), 3min (01-02)
- Trend: Improving

*Updated after each plan completion*
| Phase 01.1-replace-orjsonresponse-with-pydantic-response-models P01 | 3 | 2 tasks | 7 files |
| Phase 02-leaderboard-core P02 | 2 | 2 tasks | 8 files |
| Phase 03-figure-drawer P01 | 3 | 2 tasks | 4 files |
| Phase 03-figure-drawer P02 | 4 | 2 tasks | 9 files |
| Phase 03-figure-drawer P02 | 10 | 3 tasks | 9 files |
| Phase 04-secondary-viewers P01 | 5 | 2 tasks | 11 files |
| Phase 04-secondary-viewers P03 | 2 | 2 tasks | 5 files |
| Phase 04-secondary-viewers P02 | 4 | 2 tasks | 5 files |
| Phase 04-secondary-viewers P04 | 12 | 2 tasks | 6 files |
| Phase 05-ux-polish P01 | 5 | 2 tasks | 7 files |

## Accumulated Context

### Roadmap Evolution

- Phase 01.1 inserted after Phase 01: Replace ORJSONResponse with Pydantic response models (URGENT)

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Research]: minio-py (93 KB) over boto3 (82 MB) — mandatory for Vercel bundle limit
- [Research]: MUI DataGrid Community (MIT) — 7 rows × ~50 columns, Community tier sufficient
- [Research]: `getCellClassName` + CSS classes for heatmap — avoids per-cell React render
- [Research]: `dynamic(import, {ssr:false})` + `plotly.js-basic-dist-min` — Plotly only on first drawer open
- [Research]: MUI CSS Variables API for dark/light mode — no SSR flash, no next-themes
- [Research]: Presigned URL 307 redirect for files >4 MB — mandatory for phonon (333 MB) and density figures (>50 MB)
- [Research]: Module-level minio-py singleton — cold start 200ms vs 1-3s if created per request
- [Research]: `concurrently` for local dev — not Turborepo; bun run dev starts Next.js + uvicorn
- [Phase 01-infrastructure]: minio-py over boto3 — boto3 is 82 MB vs minio 93 KB, mandatory for Vercel 100 MB bundle limit
- [Phase 01-infrastructure]: uv.lock committed — required for reproducible Vercel Python builds
- [Phase 01-infrastructure]: concurrently dev script — bun run dev starts next dev + uvicorn in parallel
- [Phase 01-infrastructure]: Category/benchmark index built at lifespan startup and cached in app.state — avoids per-request filesystem scans
- [Phase 01-infrastructure]: Lowercase slug_map (37conf8 -> conformers/37Conf8) handles PascalCase directory naming
- [Phase 01-infrastructure]: Figure endpoint returns 501 stub — size-based redirect logic deferred to Phase 4
- [Phase 01.1-replace-orjsonresponse-with-pydantic-response-models]: Used return type annotations (not response_model=) to preserve BenchmarkRow extra fields
- [Phase 01.1-replace-orjsonresponse-with-pydantic-response-models]: Kept models_cache as list[dict] in app.state — validated on return, not on cache write
- [Phase 01.1-replace-orjsonresponse-with-pydantic-response-models]: envelope() helper removed entirely — Meta model serves same role, type-safely
- [Phase 02-01-leaderboard-core]: Threshold model uses ConfigDict(extra="allow") to absorb level_of_theory field present in production JSON without breaking validation
- [Phase 02-01-leaderboard-core]: BenchmarkMeta is standalone model (not inheriting Meta) — keeps Meta clean for categories/models endpoints
- [Phase 02-01-leaderboard-core]: tooltip_header validated as ColumnTooltip | str union type — defensive against mixed value types in production data
- [Phase 02-leaderboard-core]: MUI cssVariables: true eliminates SSR flash without next-themes — built-in MUI mechanism
- [Phase 02-leaderboard-core]: getInitColorSchemeScript() renders before providers to block hydration mismatch
- [Phase 02-leaderboard-core]: SWR revalidateOnFocus: false prevents unnecessary refetch on tab switch
- [Phase 03-figure-drawer]: 4 MB threshold for 307 redirect — figure files under 4 MB served inline; larger files redirect to presigned URL
- [Phase 03-figure-drawer]: Figure slug derived from filename by stripping figure_ prefix and .json suffix — no separate metadata file needed
- [Phase 03-figure-drawer]: figures index uses storage.list_keys() + figure_*.json filter — reuses existing storage abstraction without new methods
- [Phase 03-figure-drawer]: Use extendTheme instead of createTheme for MUI v7 CSS variables API (colorSchemeSelector support)
- [Phase 03-figure-drawer]: PlotlyChart imported ONLY via next/dynamic to keep Plotly bundle out of initial page JS
- [Phase 03-figure-drawer]: Persistent MUI Drawer variant enables swap-in-place figure switching without close/reopen animation
- [Phase 03-figure-drawer]: filterModel null=all-models (header click) string=single-model (cell click) — parity with ml-peg dual patterns
- [Phase 03-figure-drawer]: scattergl downgraded to scatter — plotly-basic-dist-min excludes WebGL scatter support
- [Phase 04-secondary-viewers]: ASE energy extracted from atoms.calc.results['energy'] directly to avoid side effects
- [Phase 04-secondary-viewers]: PBC detected via string match 'pbc=T T T' on second xyz line — no ASE parsing needed for structure files
- [Phase 04-secondary-viewers]: Diatomic index cached in app.state.diatomic_index lazily on first request
- [Phase 04-secondary-viewers]: NEB band matched via endswith suffix -{band}-neb-band.extxyz to handle both hyphen and underscore model name variants
- [Phase 04-secondary-viewers]: 3Dmol.js imported inside useEffect only — never at module level (SSR incompatible, large bundle)
- [Phase 04-secondary-viewers]: View Structure button only visible when filterModel is set (specific model selected via cell click)
- [Phase 04-secondary-viewers]: StructureModal rendered outside Drawer to avoid z-index stacking issues
- [Phase 04-secondary-viewers]: getPlotlyThemeOverrides inlined in DiatomicChart — two consumers don't justify shared util
- [Phase 04-secondary-viewers]: Pair alphabetical sort in frontend matches backend key format (Ac-H not H-Ac)
- [Phase 04-secondary-viewers]: NEB model list hardcoded in neb-constants.ts (13 models from data/nebs/li_diffusion/) — no model-listing endpoint; add dynamic endpoint in future
- [Phase 04-secondary-viewers]: framesToXyz converts NebFrame JSON to multi-frame XYZ for 3Dmol.js addModelsAsFrames
- [Phase 04-secondary-viewers]: Two separate useEffect hooks in NebStructurePlayer: frames dep for viewer reinit, currentFrame dep for setFrame only
- [Phase 05-ux-polish]: FilterProvider wraps both AppHeader and children in layout.tsx so both share the same context instance
- [Phase 05-ux-polish]: columnVisibilityModel controlled by colFilter; onColumnVisibilityModelChange is no-op to prevent DataGrid overwriting controlled state
- [Phase 05-ux-polish]: Column filter resets via useEffect([benchmark]) on benchmark route param change

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: S3 bucket name and root prefix in production must be confirmed from deployment config
- [Phase 3]: Must audit all 239 figure JSONs for trace types before committing to plotly.js-basic-dist-min vs plotly.js-cartesian-dist-min
- [Phase 4]: 3D structure viewer technology not yet chosen (Molstar vs NGL vs 3Dmol.js) — needs spike
- [Phase 4]: extxyz multi-frame parser for NEB not identified — needs spike
- [Phase 4]: MinIO CORS config must be verified before presigned URLs work from browser
- [Phase 4]: Phonon split strategy decision needed (307 redirect vs pre-split per model)
- [Phase 4]: diatomic_index.json pre-build script must be created before diatomic viewer works

## Session Continuity

Last session: 2026-03-12T09:24:10.611Z
Stopped at: Completed 05-01-PLAN.md
Resume file: None
