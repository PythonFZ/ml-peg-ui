---
phase: 01-infrastructure
plan: 02
subsystem: api
tags: [fastapi, python, orjson, minio, storage, endpoints, pytest, starlette, testclient]

# Dependency graph
requires:
  - phase: 01-infrastructure/01-01
    provides: pyproject.toml with fastapi/minio/orjson deps, uv.lock, tests/conftest.py fixture scaffold
provides:
  - api/__init__.py — Python package marker for api module
  - api/storage.py — StorageBackend protocol, FilesystemBackend, MinioBackend, create_storage()
  - api/index.py — FastAPI app with health, categories, benchmarks/table, models endpoints
  - tests/test_storage.py — Unit tests for FilesystemBackend (4 unit + 1 integration)
  - tests/test_api.py — Endpoint tests for all Phase 1 routes (9 tests)
  - Updated tests/conftest.py with session-scoped TestClient fixture
affects:
  - 01-03 (frontend fetches from these endpoints)
  - all subsequent phases (storage abstraction pattern reused)

# Tech tracking
tech-stack:
  added:
    - starlette.testclient.TestClient (from starlette bundled with fastapi) — sync test client
    - python-dotenv load_dotenv(".env.local") — local env var override pattern
  patterns:
    - StorageBackend as typing.Protocol — duck-typed abstraction, no inheritance required
    - FastAPI lifespan context manager (not deprecated @on_event) for startup index building
    - envelope() helper wrapping all list responses in {data, meta: {count, ...extra}} shape
    - APIRouter(prefix="/api/v1") — all routes registered on router, included in app
    - ORJSONResponse as default_response_class — fast serialization for benchmark data
    - Cache-Control: s-maxage=3600 headers on data endpoints — CDN caching at Vercel edge
    - Models computed lazily on first /models request, cached in app.state.models_cache
    - Category/benchmark index built once at startup, cached in app.state for all requests

key-files:
  created:
    - api/__init__.py
    - api/storage.py
    - api/index.py
    - tests/test_storage.py
    - tests/test_api.py
  modified:
    - tests/conftest.py

key-decisions:
  - "Category/benchmark index built at startup in lifespan — avoids per-request filesystem scans, mandatory for Vercel cold starts"
  - "Benchmark slug_map: lowercase slug -> actual path — handles PascalCase dirs (37Conf8) accessed via lowercase slug (37conf8)"
  - "Models endpoint lazily scans all metrics tables on first call — acceptable because cached; avoids startup cost"
  - "Figure endpoint returns 501 stub — full implementation needs size-based redirect logic (Phase 4)"
  - "TestClient fixture is session-scoped — lifespan runs once per test session, index built once"
  - "Tests use real data/ directory — catches slug mapping and data format bugs early, consistent with plan intent"

patterns-established:
  - "api/index.py: envelope() helper wraps all list responses in {data, meta} shape"
  - "Storage backend accessed via request.app.state.storage — never imported directly in endpoints"
  - "Benchmark path lookup: slug_map[slug] -> category/BenchmarkDir -> category/BenchmarkDir/slug_metrics_table.json"
  - "categories built from filesystem scan: top-level dirs are categories, subdirs are benchmarks (skip 'assets')"

requirements-completed: [NFR-2.1, NFR-2.3]

# Metrics
duration: 3min
completed: 2026-03-10
---

# Phase 1 Plan 02: FastAPI Backend Summary

**FastAPI backend with 5 endpoints (health, categories, benchmarks/table, models, figure stub) backed by StorageBackend protocol supporting local filesystem and MinIO, with 19 passing tests using real benchmark data**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-10T20:58:21Z
- **Completed:** 2026-03-10T21:01:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- StorageBackend protocol with FilesystemBackend (reads data/) and MinioBackend (reads MinIO S3) implementations, plus create_storage() factory that selects based on MINIO_ENDPOINT env var
- FastAPI app with all Phase 1 endpoints: health returns 200, categories returns 16 real categories with embedded benchmark lists, benchmarks/{slug}/table returns real metrics data with meta.columns, models returns unique models derived from all benchmarks, figure stub returns 501
- 19 unit tests all passing against real data/ directory, covering endpoint shape, slug mapping, 404 handling, and storage error cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Storage abstraction + FastAPI app with all endpoints** - `dc6dd44` (feat)
2. **Task 2: API and storage tests** - `402b68a` (test)

**Plan metadata:** (docs: complete plan — committed after SUMMARY)

## Files Created/Modified

- `api/__init__.py` — Empty Python package marker
- `api/storage.py` — StorageBackend protocol, FilesystemBackend (orjson reads from data/), MinioBackend (minio-py client), create_storage() factory
- `api/index.py` — FastAPI app with lifespan, APIRouter on /api/v1, envelope helper, all 5 endpoints with Cache-Control headers
- `tests/test_storage.py` — 4 unit tests + 1 integration test (skipped without MINIO_ENDPOINT)
- `tests/test_api.py` — 9 endpoint tests covering health, categories, table, models, 404, envelope shape, figure stub
- `tests/conftest.py` — Updated with session-scoped TestClient fixture

## Decisions Made

- **Startup index building in lifespan**: Category/benchmark index built once at startup and cached in app.state — avoids per-request filesystem scans, critical for Vercel cold start performance
- **Lowercase slug_map**: Maps e.g. `37conf8` -> `conformers/37Conf8` — handles the data/ PascalCase directory naming while accepting lowercase slugs in URLs
- **Models lazy + cached**: First /models request scans all metrics tables; result cached in app.state.models_cache — acceptable latency on first call, instant on subsequent
- **Figure endpoint 501 stub**: Full implementation requires size-based decision logic (307 redirect for large files vs inline JSON for small) — deferred to Phase 4 as planned
- **Real data in tests**: Tests run against the actual data/ directory — catches real-world issues like slug mapping failures and JSON format variations early

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. MinIO integration tests are automatically skipped when MINIO_ENDPOINT is not set.

## Next Phase Readiness

- FastAPI app importable as `api.index:app` — ready for Vercel serverless deployment
- `bun run dev` will now start both Next.js and uvicorn (api/index.py exists)
- All Phase 1 API endpoints working with real data — frontend can fetch immediately
- Storage abstraction ready: switch to MinIO by setting MINIO_ENDPOINT env var

---
*Phase: 01-infrastructure*
*Completed: 2026-03-10*
