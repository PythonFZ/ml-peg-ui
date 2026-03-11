---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 02-02-PLAN.md
last_updated: "2026-03-11T07:35:41.797Z"
last_activity: "2026-03-10 — Plan 01-02 complete: FastAPI backend with storage abstraction and all Phase 1 endpoints"
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 7
  completed_plans: 7
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

Last session: 2026-03-11T06:50:25.519Z
Stopped at: Completed 02-02-PLAN.md
Resume file: None
