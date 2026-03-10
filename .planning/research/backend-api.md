# Backend API Research: FastAPI + MinIO/S3 on Vercel

**Domain:** FastAPI serving pre-computed scientific benchmark data from MinIO S3-compatible storage
**Researched:** 2026-03-10
**Overall confidence:** HIGH (Vercel limits verified from official docs; library sizes verified from PyPI)

---

## 1. Vercel Serverless Constraints (Verified)

Source: https://vercel.com/docs/functions/limitations

| Constraint | Value |
|---|---|
| Bundle size (Python) | 500 MB uncompressed |
| Bundle size (Node.js) | 250 MB uncompressed |
| Max response/request body | **4.5 MB** — hard limit, returns HTTP 413 |
| Default memory | 2 GB / 1 vCPU (all plans) |
| Max memory (Pro/Ent) | 4 GB / 2 vCPU |
| Default timeout | 300s (5 min) |
| Max timeout (Pro/Ent) | 800s (13 min) |
| File descriptors | 1,024 shared across concurrent executions |

**Critical implication:** The 4.5 MB response body limit means **any endpoint that tries to proxy the 333 MB phonon file will return HTTP 413**. This is a hard platform constraint, not configurable. Pre-signed URL redirect is the only viable approach.

Python functions support streaming responses. The Python runtime supports pyproject.toml + uv.lock natively (Vercel detects uv automatically).

---

## 2. S3 Client: Recommendation is boto3 with module-level initialization

### Option Comparison

| Library | Installed size | Async | MinIO compat | Cold start notes |
|---|---|---|---|---|
| **boto3** | ~82 MB full; ~5-15 MB if stripped to S3 only | No (sync) | Yes (endpoint_url override) | Module-level client avoids per-request init penalty |
| **minio-py** | ~93 KB wheel, tiny footprint | No (sync) | Native | No botocore overhead; smaller bundle |
| **aioboto3** | boto3 + aiohttp overhead | Yes (async) | Yes | Async context manager lifecycle is awkward in serverless |

### Recommendation: minio-py for this project

**Use `minio` (minio-py) over boto3.** Rationale:

1. The storage backend is MinIO, not AWS. minio-py speaks MinIO's dialect natively (including non-AWS auth flows, path-style addressing).
2. minio-py wheel is 93.8 KB vs boto3's ~82 MB (with botocore). This is significant for a 500 MB bundle budget shared with FastAPI and other deps.
3. FastAPI on Vercel is ASGI/synchronous-friendly. aioboto3 adds complexity without clear benefit here — Vercel's Python runtime does not benefit from async I/O the same way a long-running server does.
4. boto3 is the right choice if the backend ever moves to AWS S3 proper. For MinIO-first, minio-py is cleaner.

**Global initialization pattern (mandatory for cold start performance):**

```python
# api/index.py — module-level, NOT inside handler

from minio import Minio
import os

_s3_client: Minio | None = None

def get_s3_client() -> Minio:
    global _s3_client
    if _s3_client is None:
        _s3_client = Minio(
            os.environ["MINIO_ENDPOINT"],
            access_key=os.environ["MINIO_ACCESS_KEY"],
            secret_key=os.environ["MINIO_SECRET_KEY"],
            secure=True,
        )
    return _s3_client
```

Initializing inside the handler means every cold start recreates the connection. Module-level initialization (lazy singleton) runs once per container lifetime. On Vercel with Fluid Compute, containers can be reused across multiple requests — the singleton is reused each time.

---

## 3. FastAPI Endpoint Structure

### Recommended URL Layout

```
GET /api/v1/health                              # health check + version

# Leaderboard / summary views
GET /api/v1/leaderboard                         # all models × all benchmarks summary
GET /api/v1/categories                          # list of 14 benchmark categories
GET /api/v1/categories/{category}               # benchmarks within one category
GET /api/v1/models                              # list of active models with metadata

# Benchmark detail
GET /api/v1/benchmarks/{benchmark}/metrics      # metrics table for a benchmark (53 JSONs)
GET /api/v1/benchmarks/{benchmark}/figures/{figure_id}  # specific Plotly figure JSON (239 files)

# Diatomic curves — 92K+ files, must NOT enumerate directly
GET /api/v1/curves/{element_pair}               # list of models for an element pair
GET /api/v1/curves/{element_pair}/{model}       # single curve JSON for one model

# Large file — presigned URL redirect only
GET /api/v1/phonon/url                          # returns presigned URL, 307 redirect to MinIO

# Structure files (xyz)
GET /api/v1/structures/{benchmark}/{id}         # single xyz structure
```

### APIRouter pattern

Split into routers for maintainability:

```python
# api/routers/leaderboard.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/v1", tags=["leaderboard"])

# api/index.py
from fastapi import FastAPI
from api.routers import leaderboard, benchmarks, curves, phonon

app = FastAPI()
app.include_router(leaderboard.router)
app.include_router(benchmarks.router)
app.include_router(curves.router)
app.include_router(phonon.router)
```

### Query parameter patterns for filtering

```
GET /api/v1/leaderboard?models=mace,orb&categories=bulk_properties
GET /api/v1/benchmarks/{benchmark}/metrics?format=table   # future
```

Avoid nested query parameters. Keep filter params flat and comma-delimited.

---

## 4. The 333 MB Phonon File

**The only valid approach is a presigned URL redirect.** Three reasons:

1. Vercel hard-limits response bodies to 4.5 MB. Streaming the file through the function will fail with HTTP 413.
2. Even if streaming were allowed, a 333 MB transfer at Vercel's egress costs would be expensive and slow.
3. Presigned URLs let MinIO serve the file directly to the browser — no function time billed, no egress through Vercel.

**Implementation:**

```python
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from minio import Minio
from datetime import timedelta

router = APIRouter()

@router.get("/api/v1/phonon/url")
def get_phonon_presigned_url(s3: Minio = Depends(get_s3_client)):
    url = s3.presigned_get_object(
        bucket_name="ml-peg",
        object_name="phonon_interactive.json",
        expires=timedelta(hours=1),
    )
    return RedirectResponse(url=url, status_code=307)
```

Use HTTP 307 (Temporary Redirect) not 302 — 307 preserves the HTTP method and is semantically correct for a temporary presigned URL.

**Frontend implication:** The Next.js client fetches `/api/v1/phonon/url`, follows the 307 to MinIO, and receives the full file directly. The function itself returns nearly instantly.

**Additional option — pre-split the file:** The 333 MB phonon file is almost certainly a Plotly figure with many traces. If the data allows, split it server-side (one-time script) into per-system or per-model sub-files stored in MinIO. Then serve those on-demand. This is the highest-quality UX approach but requires a data pipeline step.

---

## 5. Caching Strategy

### Two-tier approach: CDN caching + module-level memory cache

**Tier 1: Vercel CDN caching (set Cache-Control headers on API responses)**

The benchmark data is pre-computed and changes only on data releases (not per-request). This makes aggressive CDN caching viable.

```python
from fastapi import Response

@router.get("/api/v1/leaderboard")
def get_leaderboard(response: Response):
    data = fetch_leaderboard_from_s3()
    # Cache at Vercel CDN for 1 hour, browser for 5 minutes
    response.headers["Cache-Control"] = "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400"
    return data
```

Cache-Control strategy by endpoint type:

| Endpoint | s-maxage | max-age | Rationale |
|---|---|---|---|
| `/leaderboard` | 3600 | 300 | Changes only on data release |
| `/categories` | 86400 | 600 | Very stable list |
| `/benchmarks/*/metrics` | 3600 | 300 | Pre-computed, stable |
| `/benchmarks/*/figures/*` | 3600 | 300 | Plotly JSON, stable |
| `/curves/*` | 3600 | 60 | High volume, stable |
| `/phonon/url` | 0 | 0 | Presigned URL has its own TTL, must not cache |

**Tier 2: Module-level in-memory cache (for small frequently-accessed data)**

Vercel's Fluid Compute reuses containers across requests. A module-level dict acts as a simple LRU-style cache within a container's lifetime. This is particularly valuable for:
- The categories list (fetched on every page load)
- The models list
- Individual metrics tables (53 files, all small)

```python
import time
from typing import Any

_cache: dict[str, tuple[Any, float]] = {}
CACHE_TTL = 300  # 5 minutes

def cache_get(key: str) -> Any | None:
    if key in _cache:
        value, expires_at = _cache[key]
        if time.time() < expires_at:
            return value
        del _cache[key]
    return None

def cache_set(key: str, value: Any, ttl: int = CACHE_TTL) -> None:
    _cache[key] = (value, time.time() + ttl)
```

**Important caveat:** Do NOT store large objects (figure JSONs, curve files) in this cache — it will grow unbounded and hit the 2 GB memory limit. Cache only index/summary data that is fetched repeatedly and small.

**Do NOT use Redis or external cache services** — the project has no persistent infrastructure and adding it defeats the simplicity of Vercel deployment.

---

## 6. Serving 92K+ Diatomic Curve Files

**Do not enumerate all 92K files through the API.** This would require listing the entire MinIO bucket on every request. Instead:

### Pattern A: Key-addressed direct fetch (recommended)

Files follow a predictable naming scheme. The frontend requests specific files by key, the API fetches that one file from MinIO and returns it.

```python
@router.get("/api/v1/curves/{element_pair}/{model}")
def get_curve(element_pair: str, model: str, response: Response):
    # Construct deterministic S3 key
    key = f"diatomic/{element_pair}/{model}.json"
    try:
        data = s3.get_object("ml-peg", key)
        content = data.read()
        response.headers["Cache-Control"] = "public, max-age=60, s-maxage=3600"
        return Response(content=content, media_type="application/json")
    except S3Error as e:
        if e.code == "NoSuchKey":
            raise HTTPException(status_code=404)
        raise
```

### Pattern B: Presigned URLs for batches (alternative)

For bulk download use-cases, return a batch of presigned URLs so the browser fetches directly from MinIO:

```python
@router.get("/api/v1/curves/{element_pair}/urls")
def get_curve_urls(element_pair: str, models: list[str] = Query(default=[])):
    urls = {}
    for model in models:
        key = f"diatomic/{element_pair}/{model}.json"
        urls[model] = s3.presigned_get_object("ml-peg", key, expires=timedelta(hours=1))
    return {"urls": urls}
```

Pattern B reduces API function time (MinIO serves files directly) but requires the frontend to manage multiple parallel fetches.

**Recommendation:** Pattern A for the interactive leaderboard (controlled, one at a time). Pattern B for any "download all curves for element pair X" feature.

### Pagination for index endpoints

If an endpoint lists which models are available for a given element pair, use limit/offset pagination:

```python
@router.get("/api/v1/curves/{element_pair}")
def list_curves(element_pair: str, limit: int = 20, offset: int = 0):
    # Return list of available models for this pair
    ...
```

---

## 7. Response Optimization

### Use ORJSONResponse for all JSON endpoints

FastAPI's default `json.dumps` is 10-20x slower than orjson for large payloads. The figure JSONs (up to 2 MB each) will benefit significantly.

```python
# requirements.txt / pyproject.toml
# orjson

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse

app = FastAPI(default_response_class=ORJSONResponse)
```

Setting `default_response_class=ORJSONResponse` applies globally. All JSON responses will use orjson serialization. No per-endpoint change needed.

**Caveat:** orjson requires AVX2 CPU instructions. Vercel runs on x86-64 AWS Lambda infrastructure — AVX2 is available. No fallback needed for this deployment target.

### GZipMiddleware for large JSON responses

The Plotly figure JSONs (up to 2 MB) compress well (JSON is highly compressible). GZip at minimum_size=1000 handles the threshold automatically.

```python
from starlette.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=6)
```

**Known limitation:** `GZipMiddleware` does NOT compress `StreamingResponse` objects — this is a Starlette design limitation (GitHub fastapi/fastapi#4739). This is acceptable because we are not using streaming for the data endpoints (only for the phonon presigned redirect, which doesn't need compression).

`compresslevel=6` is the sweet spot: significantly faster than level 9 with only marginally larger output. Level 9 is rarely worth the CPU cost on serverless where you pay for active CPU time.

### Do not use streaming for regular JSON responses

`StreamingResponse` is appropriate for:
- Live data / SSE
- Files too large to buffer (but these go via presigned URL redirect anyway)

For the benchmark data endpoints, buffer the full response and return it as `ORJSONResponse`. This is simpler, compressible by GZipMiddleware, and CDN-cacheable. Streaming responses cannot be CDN-cached.

---

## 8. API Design: Leaderboard vs Detail Views

### Leaderboard summary endpoint

The leaderboard table needs a compact summary: model names, benchmark categories, and one score per cell. This should NOT return all 239 figure JSONs inline.

```json
GET /api/v1/leaderboard
{
  "models": ["mace", "orb", "chgnet"],
  "categories": ["bulk_properties", "phonons", "surfaces"],
  "scores": {
    "mace": {
      "bulk_properties": 0.91,
      "phonons": 0.87,
      "surfaces": 0.76
    }
  },
  "updated_at": "2025-12-01"
}
```

This is derived from the 53 metrics table JSONs, aggregated. It should be pre-aggregated if possible (store a `leaderboard_summary.json` in MinIO), not computed on each request.

### Benchmark detail endpoint

When the user clicks a leaderboard cell, the frontend requests the specific figure:

```json
GET /api/v1/benchmarks/bulk_modulus/figures/parity_plot
{
  "data": [...],   // Plotly trace data
  "layout": {...}  // Plotly layout
}
```

This is a direct pass-through of the pre-computed Plotly figure JSON from MinIO.

### Separation of concerns

- Summary endpoint: light, fast, CDN-cached at long TTL
- Detail endpoint: potentially large (2 MB figure JSON), CDN-cached per figure ID
- The frontend loads summary on page load, then lazily loads detail on interaction

---

## 9. Pitfalls Specific to This Project

### Pitfall 1: 4.5 MB response body limit

**What goes wrong:** Any endpoint that tries to return the phonon file (333 MB) or even a large figure JSON through the function will be truncated or return HTTP 413.
**Prevention:** Use presigned URL redirect for phonon. Verify figure JSONs are under 4.5 MB each — if any exceed this, they also need presigned redirect treatment.
**Detection:** Test with the largest figure JSON. If any is >4 MB, add a presigned redirect fallback.

### Pitfall 2: Unbounded in-memory cache growth

**What goes wrong:** Caching large figure JSONs in the module-level dict causes memory to grow on a warm container, eventually hitting OOM.
**Prevention:** Only cache small index/summary objects. Never cache individual figure JSONs or curve files in memory.

### Pitfall 3: GZipMiddleware not compressing streaming responses

**What goes wrong:** A developer uses `StreamingResponse` expecting GZipMiddleware to compress it. It won't.
**Prevention:** Use `ORJSONResponse` (buffered) for all data endpoints. Reserve `StreamingResponse` for genuine streaming use-cases (none in this project).

### Pitfall 4: S3 client initialized per-request

**What goes wrong:** Cold start takes 1-3 seconds instead of <500ms because the Minio client is initialized inside the route handler.
**Prevention:** Use module-level lazy singleton (shown in section 2).

### Pitfall 5: Listing 92K files from MinIO on request

**What goes wrong:** `s3.list_objects("ml-peg", prefix="diatomic/")` returns 92K entries, exhausting file descriptors (limit is 1,024) and causing 30+ second timeouts.
**Prevention:** Never list the full diatomic prefix. Use key-addressed direct fetch. Build a static index file (e.g., `diatomic_index.json`) stored in MinIO and fetched once, cached in memory.

### Pitfall 6: Phonon presigned URL caching

**What goes wrong:** CDN caches the 307 redirect response, and the presigned URL in the Location header expires while still being served from CDN cache.
**Prevention:** Set `Cache-Control: no-store` on the presigned URL endpoint. The presigned URL TTL (1 hour) is internal to MinIO, not CDN-aware.

### Pitfall 7: CORS not needed but easy to misconfigure

**What goes wrong:** Adding permissive CORS middleware that breaks same-origin requests or opens the API to cross-origin abuse.
**Prevention:** The Vercel deployment puts the Next.js frontend and FastAPI backend on the same origin (`same-origin` requests). No CORS configuration is needed. Add `CORSMiddleware` only if a separate domain needs access.

---

## 10. Bundle Size Budget

Estimated sizes for key dependencies:

| Package | Approx installed size |
|---|---|
| fastapi | ~4 MB |
| uvicorn | ~2 MB |
| minio-py | ~1 MB |
| orjson | ~1 MB |
| pydantic v2 | ~8 MB |
| starlette | ~1 MB |
| **Total estimate** | **~17 MB** |

Compare to boto3 + botocore: ~82 MB. Choosing minio-py saves ~80 MB of the 500 MB budget.

Remaining budget is available for scientific Python libs if needed (numpy, scipy, etc.), though none should be needed for a pure data-serving API.

---

## Sources

- [Vercel Functions Limits (official)](https://vercel.com/docs/functions/limitations) — bundle size, timeout, response body, memory limits
- [Vercel Python Runtime (official)](https://vercel.com/docs/functions/runtimes/python) — Python version support, uv/pyproject.toml, streaming
- [Vercel Cache-Control Headers (official)](https://vercel.com/docs/caching/cache-control-headers) — CDN caching strategy, s-maxage, stale-while-revalidate
- [Vercel Memory Configuration (official)](https://vercel.com/docs/functions/configuring-functions/memory) — 2 GB default, Fluid Compute
- [minio-py PyPI](https://pypi.org/project/minio/) — 93.8 KB wheel, Python >=3.9
- [boto3 bundle size (GitHub issue)](https://github.com/boto/botocore/issues/1629) — botocore ~36 MB, full boto3 ~82 MB
- [How boto3 impacts Lambda cold starts (tecRacer, 2021)](https://www.tecracer.com/blog/2021/02/how-boto3-impacts-the-cold-start-times-of-your-lambda-functions.html) — global initialization pattern
- [GZipMiddleware streaming limitation (FastAPI GitHub)](https://github.com/fastapi/fastapi/issues/4739)
- [orjson FastAPI performance (undercodetesting.com)](https://undercodetesting.com/boost-fastapi-performance-by-20-with-orjson/) — 10-20x faster than stdlib json
- [S3 presigned URL redirect pattern (fourtheorem)](https://fourtheorem.com/the-illustrated-guide-to-s3-pre-signed-urls/) — 307 redirect pattern
- [FastAPI best practices (zhanymkanov)](https://github.com/zhanymkanov/fastapi-best-practices) — APIRouter structure
- [aiobotocore cold start discussion (GitHub)](https://github.com/aio-libs/aiobotocore/discussions/987) — async client lifecycle in serverless
