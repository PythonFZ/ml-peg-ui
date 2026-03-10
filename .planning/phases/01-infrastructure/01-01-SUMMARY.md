---
phase: 01-infrastructure
plan: 01
subsystem: infra
tags: [fastapi, uvicorn, minio, next.js, typescript, uv, bun, vercel, concurrently, pytest]

# Dependency graph
requires: []
provides:
  - pyproject.toml with fastapi, minio, orjson, uvicorn, python-dotenv deps
  - uv.lock committed for reproducible Vercel Python builds
  - package.json with concurrently dev script starting next dev + uvicorn
  - next.config.ts with /api/* rewrite to localhost:8000 for local dev
  - vercel.json + .vercelignore excluding data/ from Vercel bundle
  - src/lib/types.ts exporting ApiEnvelope, Category, MetricsRow, Model
  - src/app/page.tsx placeholder landing page
  - pytest test framework with 6 smoke tests all passing
affects:
  - 01-02 (FastAPI endpoints build on this Python + deployment config)
  - all subsequent plans (use this monorepo scaffold)

# Tech tracking
tech-stack:
  added:
    - fastapi>=0.115.0 (Python web framework for Vercel serverless)
    - uvicorn>=0.30.0 (ASGI server for local dev)
    - minio>=7.2.0 (93 KB S3 client — critical to stay under 100 MB Vercel limit)
    - orjson>=3.10.0 (fast JSON serialization)
    - python-dotenv>=1.0.0 (env var management)
    - next.js 15 (React framework)
    - concurrently 9 (parallel process runner for dev)
    - pytest 9 + httpx (test framework)
    - uv (Python package manager)
    - bun (JS package manager, generates bun.lock text lockfile)
  patterns:
    - uv for all Python operations (not pip/python directly)
    - bun for all JS operations
    - monorepo: Python + Next.js in single repo with single Vercel deployment
    - concurrently dev script pattern: 'next dev' + 'uv run uvicorn ...'

key-files:
  created:
    - pyproject.toml
    - uv.lock
    - vercel.json
    - .vercelignore
    - .env.example
    - .gitignore
    - package.json
    - bun.lock
    - next.config.ts
    - tsconfig.json
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/types.ts
    - tests/__init__.py
    - tests/conftest.py
    - tests/test_config.py
  modified: []

key-decisions:
  - "bun.lock (text) not bun.lockb (binary) — bun 1.3.9 changed lockfile format"
  - "minio-py over boto3 mandatory — boto3 is 82 MB, kills Vercel 100 MB bundle limit"
  - "uv.lock committed to repo — required for Vercel to reproduce Python builds"
  - "Manual Next.js scaffold — create-next-app refused non-empty directory, files created manually"
  - "tomllib (stdlib Python 3.11+) used in test — no extra deps needed for TOML parsing"

patterns-established:
  - "Python tests use Path(__file__).resolve().parent.parent for project root resolution"
  - "All smoke tests use pathlib.Path and stdlib JSON/TOML for zero test-only deps"
  - "Vercel exclusion is belt-and-suspenders: both vercel.json excludeFiles AND .vercelignore"

requirements-completed: [NFR-2.2, NFR-2.4, NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4]

# Metrics
duration: 12min
completed: 2026-03-10
---

# Phase 1 Plan 01: Monorepo Scaffold Summary

**Next.js + FastAPI monorepo scaffold with uv/bun package managers, Vercel deployment config excluding data/ bundle, concurrently dev script, TypeScript types from data schema, and 6 passing smoke tests**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-10T20:43:00Z
- **Completed:** 2026-03-10T20:55:16Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- Full Python project config (pyproject.toml + uv.lock committed) with 5 runtime deps using minio-py (not boto3) to stay under 100 MB Vercel bundle limit
- Next.js 15 app skeleton with concurrently dev script that starts both `next dev` and `uv run uvicorn` in parallel, plus /api/* rewrite to localhost:8000
- 6 smoke tests all passing, verifying config correctness against NFR requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Python project + Vercel config + env template** - `ae48126` (chore)
2. **Task 2: Next.js app + concurrently dev script** - `ea9f137` (feat)
3. **Task 3: Test framework + config smoke tests** - `394c486` (test)

**Plan metadata:** (docs: complete plan — committed after SUMMARY)

## Files Created/Modified

- `pyproject.toml` - Python project with fastapi, minio, orjson, uvicorn, python-dotenv deps
- `uv.lock` - Committed lockfile for reproducible Vercel Python builds
- `vercel.json` - Serverless function config with excludeFiles for data/**
- `.vercelignore` - Excludes data/, .venv, tests, .planning from Vercel upload
- `.env.example` - Documents all MinIO env vars (MINIO_ENDPOINT, ACCESS_KEY, SECRET_KEY, BUCKET, PREFIX)
- `.gitignore` - Covers node_modules, .next, .vercel, .venv, __pycache__
- `package.json` - JS project with concurrently dev script and Next.js/React deps
- `bun.lock` - Bun 1.3.9 text lockfile (not binary .lockb)
- `next.config.ts` - /api/:path* rewrite to http://127.0.0.1:8000/api/:path*
- `tsconfig.json` - Next.js TypeScript config with @/* path alias pointing to src/
- `src/app/layout.tsx` - Root layout with metadata title "ML-PEG Leaderboard"
- `src/app/page.tsx` - Placeholder landing page
- `src/lib/types.ts` - ApiEnvelope<T>, Category, MetricsRow, Model interfaces
- `tests/__init__.py` - Empty package marker
- `tests/conftest.py` - tmp_data_dir fixture with mock benchmark structure
- `tests/test_config.py` - 6 smoke tests covering NFR-2.2, NFR-2.4, NFR-3.1-3.4

## Decisions Made

- **minio-py over boto3**: boto3 is ~82 MB vs minio-py ~93 KB — mandatory to stay under Vercel's 100 MB serverless function bundle limit
- **uv.lock committed**: Required for Vercel to reproduce Python dependency installs during build
- **bun.lock text format**: bun 1.3.9 produces `bun.lock` (text) not `bun.lockb` (binary) — plan referred to old binary format
- **Manual Next.js scaffold**: `create-next-app` refused the non-empty directory; created all files manually for full control and predictable output
- **tomllib (Python stdlib)**: Used for TOML parsing in tests — available since Python 3.11, no extra dependency needed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] bun.lockb does not exist — bun 1.3.9 generates bun.lock (text)**

- **Found during:** Task 2 commit
- **Issue:** Plan specified `bun.lockb` (binary lockfile) in the files list, but bun 1.3.9 changed to a text-based `bun.lock` format
- **Fix:** Used `bun.lock` filename in git add command; the lockfile itself is correct and committed
- **Files modified:** bun.lock (the actual generated file)
- **Verification:** `bun install` succeeded and lockfile committed to repo
- **Committed in:** ea9f137 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — wrong lockfile extension in plan)
**Impact on plan:** Trivial naming difference. Lockfile committed, all functionality correct.

## Issues Encountered

- `create-next-app` requires empty directory; worked around by creating all files manually (layout, page, next.config.ts, tsconfig.json, package.json)

## User Setup Required

None - no external service configuration required for this scaffold plan.

## Next Phase Readiness

- Python and JS environments fully set up — `uv sync` and `bun install` both work
- Vercel deployment config correct — data/ excluded from bundle
- `bun run dev` will start both servers once `api/index.py` exists (Plan 02)
- TypeScript types ready for use in components

---
*Phase: 01-infrastructure*
*Completed: 2026-03-10*

## Self-Check: PASSED

All 16 created files exist on disk. All 3 task commits verified in git log (ae48126, ea9f137, 394c486).
