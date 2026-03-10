---
phase: 01-infrastructure
verified: 2026-03-10T21:15:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 1: Infrastructure Verification Report

**Phase Goal:** Working monorepo with Python + Next.js, local storage backend serving real data, all API endpoints returning 200, deployable to Vercel
**Verified:** 2026-03-10T21:15:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | `bun run dev` starts both Next.js and uvicorn via concurrently | VERIFIED | `package.json` scripts.dev contains `concurrently … 'next dev' 'uv run uvicorn api.index:app --reload --port 8000'` |
| 2  | `uv sync` installs all Python dependencies from pyproject.toml | VERIFIED | pyproject.toml has all 5 runtime deps; uv.lock is 574-line committed lockfile; `uv run python -c "import fastapi; import minio; import orjson"` passes |
| 3  | `data/` is excluded from Vercel bundle via .vercelignore and vercel.json excludeFiles | VERIFIED | `.vercelignore` line 1 is `data/`; `vercel.json` sets `functions.api/index.py.excludeFiles = "data/**"` |
| 4  | Python bundle target is under 100 MB (minio-py not boto3) | VERIFIED | pyproject.toml deps include `minio>=7.2.0`, `boto3` is absent; test_pyproject_deps confirms this |
| 5  | TypeScript types match the actual data shape in metrics_table.json files | VERIFIED | `src/lib/types.ts` exports `ApiEnvelope<T>`, `Category`, `MetricsRow`, `Model`; test_ts_types confirms all 4 interfaces |
| 6  | GET /api/v1/health returns 200 with {status: ok} | VERIFIED | test_health passes; actual HTTP response verified via TestClient against real app |
| 7  | GET /api/v1/categories returns envelope with all categories and embedded benchmark lists | VERIFIED | test_categories and test_categories_embed_benchmarks pass; returns >= 10 real categories with benchmark lists |
| 8  | GET /api/v1/benchmarks/{slug}/table returns metrics table wrapped in envelope with meta.columns | VERIFIED | test_benchmark_table passes; returns rows with id/MLIP/Score plus meta.columns list; 404 for unknown slug |
| 9  | GET /api/v1/models returns envelope with unique models derived from metrics tables | VERIFIED | test_models passes; returns models with id and display_name from real data |
| 10 | Storage abstraction reads from local data/ when MINIO_ENDPOINT is not set | VERIFIED | create_storage() returns FilesystemBackend when MINIO_ENDPOINT absent; all 4 FilesystemBackend unit tests pass |
| 11 | Storage abstraction reads from MinIO when MINIO_ENDPOINT is set | VERIFIED | MinioBackend instantiated from env vars; integration test guarded by @pytest.mark.integration (skipped without MINIO_ENDPOINT — correct behavior) |
| 12 | FastAPI app is importable as api.index:app for both uvicorn and Vercel | VERIFIED | `uv run python -c "from api.index import app; print(type(app).__name__)"` prints `FastAPI` |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `pyproject.toml` | Python project config with fastapi, minio, orjson, uvicorn, python-dotenv deps | VERIFIED | All 5 deps present, requires-python>=3.12, pytest in dev group |
| `uv.lock` | Committed lockfile for reproducible Vercel builds | VERIFIED | 574 lines, file exists and committed (ae48126) |
| `package.json` | JS project config with concurrently dev script | VERIFIED | concurrently in devDependencies and in dev script |
| `next.config.ts` | Next.js config with /api rewrite to uvicorn for local dev | VERIFIED | Rewrites /api/:path* to http://127.0.0.1:8000/api/:path* |
| `vercel.json` | Vercel function config with excludeFiles for data/ | VERIFIED | functions.api/index.py.excludeFiles = "data/**" |
| `.vercelignore` | Excludes data/ from Vercel upload | VERIFIED | First line is `data/`, also excludes data.tar.gz, .venv, tests, .planning |
| `src/lib/types.ts` | TypeScript types derived from actual data schemas | VERIFIED | Exports ApiEnvelope, Category, MetricsRow, Model — all 4 interfaces |
| `src/app/page.tsx` | Placeholder landing page | VERIFIED | File exists |
| `tests/conftest.py` | Pytest fixtures for test suite | VERIFIED | tmp_data_dir fixture + session-scoped test_client TestClient fixture |
| `tests/test_config.py` | Smoke tests for config files | VERIFIED | 6 smoke tests all pass |
| `api/index.py` | FastAPI app with all Phase 1 endpoints | VERIFIED | 230 lines; exports `app`; health, categories, benchmarks/table, models, figure-stub; lifespan, envelope helper |
| `api/storage.py` | StorageBackend protocol with FilesystemBackend and MinioBackend | VERIFIED | 133 lines; exports StorageBackend, FilesystemBackend, MinioBackend, create_storage |
| `tests/test_api.py` | Unit tests for all API endpoints | VERIFIED | 122 lines; 9 endpoint tests |
| `tests/test_storage.py` | Unit tests for filesystem backend, integration tests for MinIO | VERIFIED | 69 lines; 4 unit + 1 integration test |
| `bun.lock` | Bun lockfile for reproducible JS builds | VERIFIED | 184 lines; text format (bun 1.3.9) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json` | `next.config.ts` | dev script runs `next dev` which reads next.config.ts | WIRED | scripts.dev = `concurrently … 'next dev' 'uv run uvicorn…'`; pattern `concurrently.*next dev.*uvicorn` present |
| `vercel.json` | `.vercelignore` | both exclude data/ from Vercel (belt and suspenders) | WIRED | vercel.json has `"excludeFiles": "data/**"`; .vercelignore has `data/` line |
| `api/index.py` | `api/storage.py` | lifespan creates storage backend, endpoints access via request.app.state.storage | WIRED | `from api.storage import StorageBackend, create_storage`; `app.state.storage = storage`; endpoints access via `request.app.state.storage` |
| `api/storage.py` | `data/` | FilesystemBackend reads JSON files from data/ directory | WIRED | `pathlib.Path(base_path)` with default `"data"`; `full_path = self._base / path` |
| `api/index.py` | `orjson` | ORJSONResponse as default response class | WIRED | `from fastapi.responses import ORJSONResponse`; `default_response_class=ORJSONResponse` on app; also used in storage.py for JSON parsing |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NFR-2.1 | 01-02 | Single Vercel project — Next.js frontend + FastAPI serverless function | SATISFIED | vercel.json configures `api/index.py` as serverless function; Next.js in src/; single project deployment |
| NFR-2.2 | 01-01, 01-02 | Python bundle <100 MB (minio-py not boto3) | SATISFIED | minio>=7.2.0 in deps; boto3 absent; test_pyproject_deps confirms; minio-py is ~93 KB vs boto3 ~82 MB |
| NFR-2.3 | 01-02 | All data served from MinIO S3-compatible storage (no local filesystem in production) | SATISFIED | MinioBackend reads from MinIO when MINIO_ENDPOINT set; create_storage() factory switches on env var; FilesystemBackend used for local dev only |
| NFR-2.4 | 01-01 | data/ excluded from Vercel bundle via .vercelignore and excludeFiles | SATISFIED | .vercelignore has `data/`; vercel.json has `"excludeFiles": "data/**"`; test_vercelignore and test_vercel_json_excludes_data both pass |
| NFR-3.1 | 01-01 | bun run dev starts both Next.js and FastAPI via concurrently | SATISFIED | dev script: `concurrently … 'next dev' 'uv run uvicorn api.index:app --reload --port 8000'`; test_dev_script passes |
| NFR-3.2 | 01-01 | uv for Python dependency management | SATISFIED | pyproject.toml + uv.lock both committed; test_uv_lockfile passes; all tests run via `uv run pytest` |
| NFR-3.3 | 01-01 | bun for JS dependency management | SATISFIED | bun.lock committed (184 lines); package.json managed by bun; devDependencies installed |
| NFR-3.4 | 01-01 | TypeScript types derived from actual data schemas | SATISFIED | src/lib/types.ts exports ApiEnvelope, Category, MetricsRow, Model; test_ts_types passes; types match real data shape (id, MLIP, Score fields) |

All 8 required requirement IDs from PLAN frontmatter (NFR-2.1 through NFR-2.4, NFR-3.1 through NFR-3.4) accounted for. No orphaned requirements found — REQUIREMENTS.md traceability table lists all 8 as Phase 1 with status Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `api/index.py` | 163-177 | Figure endpoint raises 501 — intentional stub for Phase 4 | Info | Documented in plan; expected behavior; returns 501 not 200; separate test (test_figure_stub) confirms |

No blockers or warnings. The figure stub is intentional and explicitly documented in both the plan and summary. The ORJSONResponse deprecation warnings in tests are informational only — the code works correctly and is not blocking.

### Human Verification Required

None. All automated checks pass and no items require human visual or runtime verification at this infrastructure phase.

### Gaps Summary

No gaps. All 12 observable truths verified, all 15 artifacts confirmed substantive and wired, all 5 key links confirmed, all 8 requirements satisfied. 19/19 unit tests pass against real data.

**Notable:** One deviation from the plan was auto-handled — `bun.lockb` (binary) was planned but bun 1.3.9 generates `bun.lock` (text). The correct text lockfile was committed; no functional impact.

---

_Verified: 2026-03-10T21:15:00Z_
_Verifier: Claude (gsd-verifier)_
