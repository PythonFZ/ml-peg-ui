# Phase 1: Infrastructure - Research

**Researched:** 2026-03-10
**Domain:** Next.js + FastAPI monorepo, Vercel serverless Python, MinIO S3, local dev tooling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**API versioning & routing**
- Path-based versioning: all endpoints under `/api/v1/...`
- Vercel routes all `/api/**` to FastAPI serverless function
- Can add `/api/v2/` later without breaking existing clients

**API endpoint structure (hierarchical)**
- `GET /api/v1/health` — health check
- `GET /api/v1/categories` — returns all categories with embedded benchmark lists (single call gives frontend everything for navigation)
- `GET /api/v1/benchmarks/{slug}/table` — returns metrics table for a specific benchmark
- `GET /api/v1/benchmarks/{slug}/figures/{figure_slug}` — returns Plotly figure JSON (<4 MB) or 307 redirect to presigned S3 URL (>4 MB)
- `GET /api/v1/models` — returns unique model list derived from metrics tables (computed at startup/first request, cached)

**Response format (envelope)**
- All list endpoints wrapped in `{"data": [...], "meta": {...}}`
- Meta includes count; expandable for future pagination/metadata
- Single-resource endpoints use `{"data": {...}}`
- Consistent shape across all endpoints

**Categories endpoint shape**
- Embeds benchmark list inline — no second call needed
- Shape: `{"data": [{"slug": "conformers", "name": "Conformers", "benchmarks": [{"slug": "37conf8", "name": "37Conf8"}, ...]}]}`
- Data is small (~14 categories, ~50 benchmarks) — embedding is efficient

**Benchmark table data**
- Pass through metrics_table.json content as-is, wrapped in envelope
- No Pydantic normalization — the JSON shape already matches MUI DataGrid needs
- Add `meta.columns` listing the column names for the frontend

**Models resource**
- Derived from data at runtime — scan metrics tables for unique model entries
- Cached after first computation
- No separate models index file needed for Phase 1
- Shape: `{"data": [{"id": "mace-mp-0a", "display_name": "mace-mp-0a-D3"}, ...]}`

**Figure serving strategy**
- Figures <4 MB: return Plotly JSON directly (200) — benefits from Vercel CDN caching
- Figures >4 MB: return 307 redirect to presigned MinIO URL
- 4 MB threshold chosen to stay under Vercel's 4.5 MB response limit with headroom

**Local dev data access (filesystem fallback)**
- If `MINIO_ENDPOINT` env var is not set, read from local `data/` folder (filesystem)
- If `MINIO_ENDPOINT` is set, connect to MinIO bucket
- Storage abstraction layer in Python that picks filesystem vs S3 based on env
- Zero setup for local dev — just have `data/` folder, no MinIO needed

**Environment variables**
- Single `.env.local` file (gitignored) for all secrets and config
- `.env.example` committed as template showing required/optional vars
- Both Next.js and FastAPI read from same file
- Key vars: `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

### Claude's Discretion
- Exact FastAPI app structure and module layout within `api/`
- Storage abstraction implementation details
- Next.js app directory structure
- `concurrently` script configuration
- Vercel config (`vercel.json`) specifics
- Placeholder landing page content and styling
- Error response shapes and HTTP status codes
- CDN cache header values

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NFR-2.1 | Single Vercel project — Next.js frontend + FastAPI serverless function | Vercel Python runtime + Next.js rewrites route /api/* to FastAPI in production |
| NFR-2.2 | Python bundle <100 MB (target: ~17 MB with minio-py + orjson + pydantic) | minio-py is 93.8 KB wheel; orjson ~1.6 MB; total well under limit with excludeFiles for data/ |
| NFR-2.3 | All data served from MinIO S3-compatible storage (no local filesystem in prod) | minio-py presigned_get_object + get_object APIs; filesystem fallback for local only |
| NFR-2.4 | `data/` excluded from Vercel bundle via `.vercelignore` and `excludeFiles` | .vercelignore at root + functions excludeFiles in vercel.json confirmed approach |
| NFR-3.1 | `bun run dev` starts both Next.js and FastAPI via concurrently | concurrently package runs next dev + uvicorn simultaneously from one command |
| NFR-3.2 | uv for Python dependency management | Vercel natively supports uv.lock + pyproject.toml; builds 30-65% faster than pip |
| NFR-3.3 | bun for JS dependency management | bunx create-next-app --use-bun confirmed; bun runs Next.js dev server |
| NFR-3.4 | TypeScript types derived from actual data schemas | Types defined in src/lib/types.ts matching actual data/*/benchmark_metrics_table.json shape |
</phase_requirements>

---

## Summary

Phase 1 establishes the full monorepo skeleton for a Next.js + FastAPI application deployed on Vercel. The frontend and backend share a single Vercel project: Next.js handles all non-API routes, and FastAPI handles `/api/**` as a Python serverless function. In production, Vercel's Python runtime bundles the FastAPI app from `api/index.py`; in local dev, `concurrently` runs `next dev` (port 3000) and `uvicorn` (port 8000) side-by-side, with Next.js rewrites proxying `/api/*` to port 8000.

The storage layer is the critical design challenge. FastAPI must read data from MinIO S3 in production (no persistent filesystem on Vercel) but from local `data/` in development. A thin storage abstraction (`StorageBackend` protocol with `FilesystemBackend` and `MinioBackend` implementations) resolves this cleanly. The MinIO client is initialized once at FastAPI startup using the lifespan event, avoiding cold-start overhead on every request. The `data/` directory (>100 MB) must be excluded from the Vercel bundle via both `.vercelignore` and `excludeFiles` in `vercel.json`.

The Python bundle must stay under 500 MB (Vercel hard limit) with a target of ~17 MB. The key package choice is `minio-py` (93.8 KB wheel) over `boto3` (~82 MB) — this is mandatory, not optional. `orjson` provides fast JSON serialization. `uv` + `pyproject.toml` + `uv.lock` is the correct dependency management approach; Vercel supports it natively and builds 30-65% faster with uv than pip.

**Primary recommendation:** Scaffold the project in this order: (1) `pyproject.toml` + `uv.lock` with minimal Python deps, (2) `package.json` with `concurrently` dev script, (3) `api/index.py` with FastAPI app + all 5 endpoints stubbed or wired, (4) `next.config.ts` with rewrites, (5) `vercel.json` with `excludeFiles`, (6) `src/app/layout.tsx` + `src/app/page.tsx` placeholder, (7) `.env.example`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.x | Frontend framework, SSR/static | App Router, TypeScript built-in, Vercel-native |
| FastAPI | 0.115+ | Python API framework | ASGI, automatic OpenAPI, type hints |
| minio-py | 7.2.20 | MinIO/S3 client | 93.8 KB vs boto3's 82 MB — mandatory for bundle limit |
| orjson | 3.x | Fast JSON serialization | 2-5x faster than stdlib json; Rust-backed |
| concurrently | 9.x | Local dev multi-process | Runs next dev + uvicorn from one terminal |
| uv | (latest) | Python package manager | Native Vercel support; 30-65% faster builds |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| uvicorn | 0.30+ | ASGI server for local dev | `uv run uvicorn api.index:app --reload` |
| python-dotenv | 1.x | Load .env.local in FastAPI | Local dev; Vercel injects env vars directly in prod |
| pydantic | 2.x | Response models (if needed) | FastAPI dependency; use for response type hints |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| minio-py | boto3 | boto3 is ~82 MB — exceeds bundle target; minio-py is 93.8 KB |
| concurrently | Turborepo, bun run --parallel | concurrently is simpler; bun --parallel (1.3.9+) is an option but less mature for mixed-runtime setups |
| uv + pyproject.toml | requirements.txt only | Both work on Vercel; uv is faster; pyproject.toml is the modern standard |
| orjson | stdlib json | No real tradeoff; orjson is strictly better for this use case |

**Installation:**
```bash
# Python (uv)
uv add fastapi uvicorn minio orjson python-dotenv

# JavaScript (bun)
bun add --dev concurrently
bunx create-next-app@latest . --typescript --app --use-bun --no-tailwind
```

---

## Architecture Patterns

### Recommended Project Structure
```
ml-peg-ui/
├── api/
│   ├── index.py           # FastAPI app entry point (Vercel detects this)
│   └── storage.py         # Storage abstraction (filesystem vs MinIO)
├── src/
│   └── app/
│       ├── layout.tsx     # Root layout (required)
│       └── page.tsx       # Placeholder landing page
├── data/                  # Local dev data ONLY (gitignored, not deployed)
├── pyproject.toml         # uv Python project + deps
├── uv.lock                # Committed lockfile for reproducible builds
├── package.json           # bun JS project + dev script
├── next.config.ts         # Next.js config with /api rewrites
├── vercel.json            # Routing + excludeFiles
├── .vercelignore          # Excludes data/ from upload
├── .env.local             # Secrets (gitignored)
└── .env.example           # Template (committed)
```

### Pattern 1: Vercel Routing — Next.js + FastAPI Coexistence

**What:** Next.js rewrites proxy `/api/*` to uvicorn (local) or FastAPI serverless function (production).

**When to use:** Any Next.js + FastAPI Vercel monorepo.

**next.config.ts (local dev rewrite):**
```typescript
// Source: https://vercel.com/kb/guide/how-to-use-python-and-javascript-in-the-same-application
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};
export default nextConfig;
```

**vercel.json:**
```json
{
  "functions": {
    "api/index.py": {
      "excludeFiles": "data/**"
    }
  }
}
```

**How Vercel resolves this:** Vercel auto-detects `api/index.py` as a Python serverless function because the file exports an `app` (ASGI). Next.js pages are served by the Next.js runtime. The `/api/*` routes go to the Python function.

**Note:** The `rewrites` in `next.config.ts` only apply during local dev (`next dev`). In production on Vercel, routing is handled by Vercel's infrastructure directly — the rewrite is ignored because Vercel knows to send `/api/*` to the Python function.

### Pattern 2: Storage Abstraction — Filesystem vs MinIO

**What:** A `StorageBackend` protocol with two implementations. The `MINIO_ENDPOINT` env var selects the backend at startup.

**When to use:** Any app that must run locally without cloud infra but uses cloud storage in production.

```python
# Source: FastAPI lifespan pattern (https://fastapi.tiangolo.com/advanced/events/)
from contextlib import asynccontextmanager
from typing import Protocol
import os

class StorageBackend(Protocol):
    def get_json(self, path: str) -> dict: ...
    def list_keys(self, prefix: str) -> list[str]: ...
    def presigned_url(self, path: str) -> str: ...

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.environ.get("MINIO_ENDPOINT"):
        app.state.storage = MinioBackend(...)
    else:
        app.state.storage = FilesystemBackend(base_path="data")
    yield

app = FastAPI(lifespan=lifespan)
```

### Pattern 3: MinIO Client Initialization (Singleton via Lifespan)

**What:** Initialize the Minio client once at startup via FastAPI lifespan. Avoid creating it per-request.

**Why:** Cold starts on Vercel serverless are ~200ms with module-level singleton vs 1-3s if created per request. (Noted in project STATE.md from prior research.)

```python
# Source: minio-py (https://pypi.org/project/minio/)
from minio import Minio
from datetime import timedelta

class MinioBackend:
    def __init__(self):
        self.client = Minio(
            endpoint=os.environ["MINIO_ENDPOINT"],
            access_key=os.environ["MINIO_ACCESS_KEY"],
            secret_key=os.environ["MINIO_SECRET_KEY"],
            secure=True,
        )
        self.bucket = os.environ["MINIO_BUCKET"]

    def get_json(self, object_path: str) -> dict:
        response = self.client.get_object(self.bucket, object_path)
        return orjson.loads(response.read())

    def presigned_url(self, object_path: str) -> str:
        return self.client.presigned_get_object(
            self.bucket, object_path, expires=timedelta(hours=1)
        )
```

### Pattern 4: Figure Serving (Size-Based Decision)

**What:** Return small figures (<4 MB) inline as JSON; redirect large figures (>4 MB) via presigned URL.

```python
import os
import orjson

@app.get("/api/v1/benchmarks/{slug}/figures/{figure_slug}")
async def get_figure(slug: str, figure_slug: str, request: Request):
    storage = request.app.state.storage
    path = f"{category}/{slug}/figure_{figure_slug}.json"

    raw = storage.get_raw_bytes(path)
    if len(raw) < 4 * 1024 * 1024:  # 4 MB threshold
        return Response(
            content=raw,
            media_type="application/json",
            headers={"Cache-Control": "s-maxage=3600, stale-while-revalidate=86400"},
        )
    else:
        url = storage.presigned_url(path)
        return RedirectResponse(url=url, status_code=307)
```

### Pattern 5: Local Dev with concurrently

**What:** Single `bun run dev` command starts both Next.js (3000) and uvicorn (8000).

**package.json:**
```json
{
  "scripts": {
    "dev": "concurrently --names 'next,api' --prefix-colors 'blue,green' 'next dev' 'uv run uvicorn api.index:app --reload --port 8000'",
    "build": "next build",
    "start": "next start"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

**Note on dotenv in FastAPI:** Use `python-dotenv` to load `.env.local` when running locally. In production, Vercel injects env vars directly from the dashboard.

```python
# api/index.py — load .env.local only in dev
from dotenv import load_dotenv
load_dotenv(".env.local")  # no-op if file absent (Vercel prod)
```

### Pattern 6: Data Directory Layout (from inspection)

```
data/
├── {category}/           # e.g. conformers, bulk_crystal
│   └── {Benchmark}/      # e.g. 37Conf8, DipCONFS
│       ├── {benchmark}_metrics_table.json
│       ├── figure_{benchmark}.json
│       └── {model-id}/   # model-specific xyz files (Phase 4)
└── assets/
```

The filesystem backend constructs paths: `data/{category}/{Benchmark}/{benchmark}_metrics_table.json`.

The MinIO backend constructs the same relative paths as S3 object keys within the bucket.

**Key insight:** The `categories` response requires scanning the `data/` directory (or MinIO bucket) to discover category and benchmark slugs. Build an index at startup to avoid repeated filesystem/S3 scans on every request.

### Anti-Patterns to Avoid

- **Creating Minio client per request:** Creates 1-3s overhead on every cold start. Use lifespan/module-level singleton.
- **Including `data/` in Vercel bundle:** The data directory is >100 MB. Must be in both `.vercelignore` AND `excludeFiles` in `vercel.json`.
- **Using boto3:** ~82 MB package size blows the 100 MB Python bundle target.
- **Hardcoding `/api/v1/` prefix in every route:** Use a FastAPI `APIRouter` with prefix `"/api/v1"` and include it once.
- **Reading `.env.local` in production:** Call `load_dotenv(".env.local")` with no error if absent — Vercel provides env vars without a file.
- **CWD assumptions in Vercel Python functions:** Python CWD in Vercel functions is the project root, not the `api/` directory. Use relative paths from root (e.g., `data/conformers/...`), NOT `../data/conformers/...`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Running multiple dev servers | Custom shell scripts / Makefiles | `concurrently` | Process management, signal forwarding, colored output |
| S3/MinIO object access | Custom HTTP requests to S3 API | `minio-py` | Signature V4, presigned URLs, error handling |
| Fast JSON serialization | Custom json encoder | `orjson` | Rust-backed SIMD, 2-5x faster, handles Python types |
| Env file loading | `os.environ` + manual parsing | `python-dotenv` | Handles quoting, exports, multi-line values |
| Python dep management | pip + venv manually | `uv` | Faster, lockfile support, Vercel native |

**Key insight:** The minio-py vs boto3 decision is not aesthetic — it's a hard constraint. boto3 alone (~82 MB) would exceed the 100 MB bundle target stated in NFR-2.2.

---

## Common Pitfalls

### Pitfall 1: `data/` Included in Vercel Bundle
**What goes wrong:** Deployment fails or function exceeds size limit. `data/` is >100 MB locally.
**Why it happens:** Vercel bundles all files in the project root by default.
**How to avoid:** Use BOTH mechanisms:
1. `.vercelignore` — excludes files from upload (like `.gitignore` for Vercel)
2. `vercel.json` `functions.excludeFiles` — excludes from the function bundle specifically
**Warning signs:** Deploy output shows bundle size >50 MB; `vercel deploy` takes unusually long to upload.

### Pitfall 2: uv + pyproject.toml Regression
**What goes wrong:** When both `pyproject.toml` and `requirements.txt` exist but no `uv.lock` is committed, Vercel's builder may select `pyproject.toml`, attempt uv, and skip installing dependencies.
**Why it happens:** Vercel changed Python build behavior in late 2025 (Issue #14041).
**How to avoid:** Commit `uv.lock` alongside `pyproject.toml`. Run `uv lock` locally and commit the result.
**Warning signs:** FastAPI import errors in Vercel deployment logs; function returns 500 on `/api/v1/health`.

### Pitfall 3: CWD Mismatch in Vercel Python Runtime
**What goes wrong:** `open("data/file.json")` works locally but fails on Vercel.
**Why it happens:** CWD is always the project root in Vercel Python functions — same as local. But if you accidentally use `os.path.dirname(__file__)` relative navigation, it may resolve to `api/` subdirectory.
**How to avoid:** Use `pathlib.Path("data") / category / benchmark / filename` — always relative to CWD (project root).
**Warning signs:** `FileNotFoundError` in FilesystemBackend during tests.

### Pitfall 4: `next.config.ts` Rewrite Reaching Production
**What goes wrong:** Developer adds `/api/:path*` rewrite and assumes it routes to FastAPI on Vercel.
**Why it happens:** Rewrites in `next.config.ts` only apply in local `next dev` context. Vercel routes `/api/**` to the Python function before Next.js even sees the request.
**How to avoid:** The rewrite is necessary for local dev (proxies to uvicorn on 8000). On Vercel, it's harmless but unnecessary — Vercel handles the routing. Don't add `destination: https://your-vercel-url/api/...` in production rewrites.

### Pitfall 5: MinIO Presigned URL Contains Internal Host
**What goes wrong:** Presigned URL works internally but fails from browser — URL points to internal MinIO hostname.
**Why it happens:** `Minio(endpoint=...)` uses the provided endpoint for URL generation. If the MinIO server has a different public hostname than the internal one, presigned URLs will contain the internal host.
**How to avoid:** Confirm with ops team that `MINIO_ENDPOINT` is the public-facing hostname. This is flagged as a concern in STATE.md and must be verified before Phase 1 completes.

### Pitfall 6: Benchmark Slug Case Sensitivity
**What goes wrong:** `GET /api/v1/benchmarks/37Conf8/table` returns 404 in production but works locally.
**Why it happens:** MinIO object keys are case-sensitive; filesystem may not be (macOS). The directory is `37Conf8` (mixed case) but the route slug `{slug}` may arrive as `37conf8`.
**How to avoid:** Normalize slugs to lowercase in URL params and store a `slug → actual_path` index at startup. The CONTEXT.md shows slugs like `"37conf8"` (lowercase) mapping to directory `37Conf8`.

---

## Code Examples

### Health endpoint
```python
# api/index.py
from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

app = FastAPI(default_response_class=ORJSONResponse)

@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
```

### APIRouter with prefix
```python
# api/index.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1")

@router.get("/health")
async def health(): ...

@router.get("/categories")
async def categories(request: Request): ...

app.include_router(router)
```

### Envelope response helper
```python
def envelope(data, **meta):
    return {"data": data, "meta": {"count": len(data), **meta}}

# Usage:
return envelope(categories_list)
# Returns: {"data": [...], "meta": {"count": 14}}
```

### .vercelignore
```
data/
data.tar.gz
.env.local
__pycache__/
.venv/
```

### vercel.json (complete)
```json
{
  "functions": {
    "api/index.py": {
      "excludeFiles": "data/**"
    }
  }
}
```

### pyproject.toml (Python deps for Vercel)
```toml
[project]
name = "ml-peg-api"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.30.0",
    "minio>=7.2.0",
    "orjson>=3.10.0",
    "python-dotenv>=1.0.0",
]
```

### TypeScript types (src/lib/types.ts)
```typescript
// Derived from actual data shape in data/*/benchmark_metrics_table.json
export interface ApiEnvelope<T> {
  data: T;
  meta: { count?: number; columns?: string[] };
}

export interface Category {
  slug: string;
  name: string;
  benchmarks: Array<{ slug: string; name: string }>;
}

export interface MetricsRow {
  id: string;       // routing key
  MLIP: string;     // display name (D3 suffix)
  Score: number;
  [metric: string]: number | string | null;
}

export interface Model {
  id: string;
  display_name: string;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `requirements.txt` only on Vercel | `pyproject.toml` + `uv.lock` | Late 2025 | 30-65% faster builds; commit uv.lock to avoid regression |
| `@event.on_startup` decorators | `lifespan` context manager | FastAPI 0.93+ | `on_startup` still works but lifespan is preferred pattern |
| boto3 for S3 access | minio-py for MinIO | Project decision | 82 MB → 93 KB; mandatory for bundle compliance |
| `npm run dev` with `&` background | `concurrently` | Standard practice | Process management, clean shutdown, colored output |

**Deprecated/outdated:**
- `@app.on_event("startup")`: Deprecated in FastAPI 0.93+. Use `lifespan` context manager instead.
- `vercel.json` `routes` array with `builds`: Old Vercel v2 format. Modern Vercel auto-detects frameworks; use `functions` key for Python-specific config.

---

## Open Questions

1. **MinIO bucket name and root prefix in production**
   - What we know: Env var is `MINIO_BUCKET`; endpoint is MinIO-compatible S3
   - What's unclear: Whether data lives at bucket root or under a prefix like `fabian.zills/` (seen in PROJECT.md as `mc ls icp/fabian.zills`)
   - Recommendation: Treat `MINIO_BUCKET` as the bucket name and `MINIO_PREFIX` as optional root prefix (default empty). The `.env.example` should document both.

2. **MinIO presigned URL public reachability**
   - What we know: MinIO endpoint configured via `MINIO_ENDPOINT`
   - What's unclear: Whether the MinIO server's public hostname matches the API endpoint used for presigned URL generation (STATE.md flags this as a Phase 1 blocker)
   - Recommendation: Test presigned URL manually before Phase 1 is marked complete. Include in verification checklist.

3. **`data/` subdirectory naming convention — case sensitivity**
   - What we know: Directory is `37Conf8` (PascalCase); CONTEXT.md uses slug `37conf8` (lowercase)
   - What's unclear: Is the MinIO bucket key stored as PascalCase or lowercase?
   - Recommendation: Build a startup index that maps lowercase slug → actual key path. Never construct object paths from URL params directly.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (via uv) |
| Config file | `pyproject.toml` `[tool.pytest.ini_options]` — Wave 0 |
| Quick run command | `uv run pytest tests/ -x -q` |
| Full suite command | `uv run pytest tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NFR-2.1 | FastAPI app exports `app` ASGI variable at `api/index.py` | unit | `uv run pytest tests/test_api.py::test_app_exists -x` | Wave 0 |
| NFR-2.1 | `GET /api/v1/health` returns 200 | unit | `uv run pytest tests/test_api.py::test_health -x` | Wave 0 |
| NFR-2.1 | `GET /api/v1/categories` returns envelope with data array | unit | `uv run pytest tests/test_api.py::test_categories -x` | Wave 0 |
| NFR-2.1 | `GET /api/v1/models` returns envelope with data array | unit | `uv run pytest tests/test_api.py::test_models -x` | Wave 0 |
| NFR-2.2 | Python bundle size under 100 MB | smoke | `uv run python scripts/check_bundle_size.py` | Wave 0 |
| NFR-2.3 | MinIO backend: get_json retrieves real data | integration | `uv run pytest tests/test_storage.py::test_minio_get_json -x -m integration` | Wave 0 |
| NFR-2.3 | Filesystem backend: get_json reads from data/ | unit | `uv run pytest tests/test_storage.py::test_fs_get_json -x` | Wave 0 |
| NFR-2.4 | `.vercelignore` contains `data/` line | smoke | `uv run pytest tests/test_config.py::test_vercelignore -x` | Wave 0 |
| NFR-3.1 | `package.json` dev script contains concurrently + uvicorn | smoke | `uv run pytest tests/test_config.py::test_dev_script -x` | Wave 0 |
| NFR-3.2 | `pyproject.toml` and `uv.lock` both exist | smoke | `uv run pytest tests/test_config.py::test_uv_lockfile -x` | Wave 0 |
| NFR-3.4 | TypeScript types exist in `src/lib/types.ts` | smoke | `uv run pytest tests/test_config.py::test_ts_types -x` | Wave 0 |

**Note:** Integration tests against real MinIO require env vars. Mark with `@pytest.mark.integration` and skip by default with `pytest -m "not integration"`.

### Sampling Rate
- **Per task commit:** `uv run pytest tests/ -x -q -m "not integration"`
- **Per wave merge:** `uv run pytest tests/ -v`
- **Phase gate:** Full suite green (including integration with MinIO env vars set) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/test_api.py` — covers NFR-2.1 (FastAPI endpoints)
- [ ] `tests/test_storage.py` — covers NFR-2.3 (filesystem + MinIO backends)
- [ ] `tests/test_config.py` — covers NFR-2.4, NFR-3.1, NFR-3.2, NFR-3.4 (config file smoke tests)
- [ ] `tests/conftest.py` — shared fixtures (TestClient, temp data dir)
- [ ] Framework install: `uv add --dev pytest httpx` — httpx needed for FastAPI TestClient

---

## Sources

### Primary (HIGH confidence)
- Vercel official docs: [FastAPI on Vercel](https://vercel.com/docs/frameworks/backend/fastapi) — entry points, lifespan, ASGI app variable
- Vercel official docs: [Python Runtime](https://vercel.com/docs/functions/runtimes/python) — excludeFiles, bundle limits, CWD behavior, pyproject.toml + uv.lock support
- Vercel changelog: [uv support announcement](https://vercel.com/changelog/python-package-manager-uv-is-now-available-for-builds-with-zero) — 30-65% faster, supported formats
- Vercel KB: [Python + JavaScript same app](https://vercel.com/kb/guide/how-to-use-python-and-javascript-in-the-same-application) — next.config.js rewrites pattern
- PyPI: [minio 7.2.20](https://pypi.org/project/minio/) — 93.8 KB wheel, Python 3.9+, confirmed current version
- FastAPI official: [Lifespan Events](https://fastapi.tiangolo.com/advanced/events/) — startup/shutdown pattern

### Secondary (MEDIUM confidence)
- GitHub Issue [vercel/vercel#14041](https://github.com/vercel/vercel/issues/14041) — uv + pyproject.toml regression when uv.lock absent; confirmed via multiple reports
- [Next.js rewrites docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) — source/destination proxy pattern
- [minio-py presigned examples](https://github.com/minio/minio-py/blob/master/examples/presigned_get_object.py) — presigned_get_object API

### Tertiary (LOW confidence)
- Community reports on cold start timing (200ms singleton vs 1-3s per-request) — cited in STATE.md from prior research; not independently verified in this session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via PyPI (minio-py size), Vercel official docs (uv support, Python runtime), Next.js docs
- Architecture (routing): HIGH — verified via Vercel official docs and KB article
- Architecture (storage): HIGH — minio-py API confirmed via PyPI + GitHub examples; FastAPI lifespan confirmed via official docs
- Pitfalls: HIGH (bundle size, CWD) via official docs; MEDIUM (presigned URL hostname issue) via GitHub issues + STATE.md
- Test framework: HIGH — pytest is standard Python testing; httpx for async ASGI client is documented FastAPI pattern

**Research date:** 2026-03-10
**Valid until:** 2026-06-10 (Vercel Python runtime config is stable; re-verify uv support specifics if deploying after April 2026)
