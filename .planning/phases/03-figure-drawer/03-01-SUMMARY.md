---
phase: 03-figure-drawer
plan: 01
subsystem: api
tags: [fastapi, pydantic, storage, figures, plotly, presigned-url]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: StorageBackend protocol, FilesystemBackend, MinioBackend, slug_map index
  - phase: 02-leaderboard-core
    provides: existing Pydantic model patterns (Meta, BenchmarkTableResponse)

provides:
  - StorageBackend.get_object_size() on both FilesystemBackend and MinioBackend
  - FigureItem, FigureListResponse, FigureResponse Pydantic models in api/models.py
  - GET /api/v1/benchmarks/{slug}/figures — figure index endpoint
  - GET /api/v1/benchmarks/{slug}/figures/{figure_slug} — figure detail endpoint with 307 redirect

affects: [03-02-frontend-drawer, 03-figure-drawer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Size-based 307 redirect: files > 4 MB redirect to presigned URL, smaller files served inline"
    - "Figure slug convention: filename pattern figure_{slug}.json strips prefix/suffix to derive slug"
    - "TDD for new endpoints: write failing tests first, then implement"

key-files:
  created: []
  modified:
    - api/storage.py
    - api/models.py
    - api/index.py
    - tests/test_api.py

key-decisions:
  - "4 MB threshold for 307 redirect — figure files under this size served inline; larger files (phonons 333 MB, density >50 MB) redirect to presigned URL"
  - "Figure slug derived from filename by stripping figure_ prefix and .json suffix — no separate metadata file needed"
  - "figures index endpoint uses storage.list_keys() and filters for figure_*.json pattern — reuses existing storage abstraction"

patterns-established:
  - "Figure file naming: data/{category}/{BenchmarkDir}/figure_{slug}.json"
  - "Size-based response routing: get_object_size first, then branch on 4 MB threshold"

requirements-completed: [FR-3.1, FR-3.4]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 3 Plan 1: Figure Backend Endpoints Summary

**FastAPI figure-serving endpoints with size-based 307 presigned URL redirect: figure index listing available slugs per benchmark, and figure detail endpoint serving Plotly JSON inline or redirecting large files**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T08:13:32Z
- **Completed:** 2026-03-11T08:16:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Extended StorageBackend protocol with `get_object_size()` on both FilesystemBackend (stat().st_size) and MinioBackend (stat_object().size)
- Added FigureItem, FigureListResponse, FigureResponse Pydantic models
- Replaced 501 stub with two working endpoints: figures index and figure detail
- 307 redirect logic for files > 4 MB in place, enabling large figures (phonons 333 MB) to be served via presigned URL

## Task Commits

Each task was committed atomically:

1. **Task 1 RED — storage + model tests** - `3579cdc` (test)
2. **Task 1 GREEN — get_object_size + figure models** - `92e36e2` (feat)
3. **Task 2 RED — figure endpoint tests** - `7c3ed28` (test)
4. **Task 2 GREEN — figure index + detail endpoints** - `171dcd5` (feat)

_Note: TDD tasks have multiple commits (test RED then feat GREEN)_

## Files Created/Modified

- `api/storage.py` - Added get_object_size() to StorageBackend protocol, FilesystemBackend, MinioBackend
- `api/models.py` - Added FigureItem, FigureListResponse, FigureResponse Pydantic models
- `api/index.py` - Replaced 501 stub with benchmark_figures_index and benchmark_figure endpoints
- `tests/test_api.py` - Replaced test_figure_stub with 6 new figure endpoint tests; added 5 storage/model unit tests

## Decisions Made

- **4 MB size threshold for 307 redirect**: Chosen per research phase decision. Files under 4 MB served inline; larger files (phonons 333 MB, density figures > 50 MB) redirect via presigned URL. This threshold matches Vercel response size limits.
- **Figure slug derived from filename**: No separate metadata file. `figure_{slug}.json` pattern is self-describing — slug extracted by stripping prefix and suffix.
- **figures index uses list_keys()**: Reuses existing storage abstraction, filters for figure_*.json pattern. No new storage method needed for listing.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

**Pre-existing test failure (out of scope):** `tests/test_models.py::test_benchmark_table_response_accepts_data_meta` was already failing before this plan's changes (passes Meta where BenchmarkMeta is required). Logged to `deferred-items.md`. Not caused by this plan.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Figure backend endpoints complete and tested — frontend drawer can consume `/figures` and `/figures/{slug}` endpoints
- 307 redirect path is implemented but untested against real large files (MinIO CORS must be verified before presigned URLs work from browser — existing blocker)
- Ready for Phase 03-02: frontend figure drawer component

## Self-Check: PASSED

- api/storage.py: FOUND (get_object_size on protocol + both backends)
- api/models.py: FOUND (FigureListResponse present)
- api/index.py: FOUND (benchmark_figures_index present)
- tests/test_api.py: FOUND (test_benchmark_figures_index present)
- 03-01-SUMMARY.md: FOUND
- Commits 3579cdc, 92e36e2, 7c3ed28, 171dcd5: all present in git log

---
*Phase: 03-figure-drawer*
*Completed: 2026-03-11*
