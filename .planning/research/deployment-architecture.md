# Deployment Architecture: Next.js + FastAPI on Vercel

**Project:** ML-PEG UI
**Researched:** 2026-03-10
**Overall confidence:** HIGH (all critical claims verified against official Vercel docs)

---

## 1. Canonical Folder Structure

This is the structure Vercel natively supports with zero additional configuration for Python + Next.js cohabitation. The key invariant: **the `api/` directory at the project root is Vercel's Python entrypoint trigger.**

```
ml-peg-ui/
├── api/
│   └── index.py              # FastAPI ASGI app — Vercel's Python entrypoint
├── src/
│   └── app/                  # Next.js App Router
│       ├── layout.tsx
│       ├── page.tsx
│       └── (routes)/
├── public/                   # Static assets served directly via CDN
├── pyproject.toml            # uv Python project + version pin
├── uv.lock                   # Committed lockfile for reproducible builds
├── package.json              # bun JS project
├── bun.lockb                 # bun lockfile
├── next.config.ts            # Next.js config (local dev rewrites)
├── vercel.json               # Vercel routing and function config
└── .python-version           # Optional fallback version pin
```

**Why `api/index.py` specifically:**
Vercel auto-detects any `.py` file inside `api/` that exports an `app` variable (ASGI) or `handler` class (WSGI). The file `api/index.py` maps to the `/api` route. FastAPI's ASGI interface is natively supported — just export `app = FastAPI()`.

**Why not `backend/` or `server/`:**
Vercel only auto-discovers Python in `api/`, `app/`, `src/`. Using `backend/` requires extra `vercel.json` build configuration. The `api/` convention is the path of least resistance and matches all official examples.

**Reading data files from Python:**
Vercel sets the working directory to the **project root**, not `api/`. So `open("data/file.json")` works from `api/index.py` without path manipulation. Alternatively use `os.path.join(os.path.dirname(__file__), "..", "data", "file.json")` for robustness.

---

## 2. Routing: `vercel.json` and `next.config.ts`

### Production: `vercel.json` is not strictly required

When Next.js and FastAPI share the same Vercel project with `api/index.py` at root, Vercel automatically routes:
- `/api/*` → Python function (`api/index.py`)
- `/*` → Next.js

However, FastAPI handles its own sub-routing internally. All `/api/v1/leaderboard`, `/api/v1/figure/:id`, etc. are resolved by FastAPI — Vercel only knows about the single function at `api/index.py`.

The problem: Vercel normally creates one serverless function **per file** in `api/`. With FastAPI, you want a single function that handles all routes. The solution is a catch-all rewrite.

### The Correct `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.py"
    }
  ],
  "functions": {
    "api/**/*.py": {
      "maxDuration": 60,
      "excludeFiles": "{tests/**,__tests__/**,**/*.test.py,**/test_*.py,data/**,assets/**,*.xyz,*.extxyz}"
    }
  }
}
```

**What this does:**
- All `/api/*` requests rewrite to `api/index.py` (FastAPI handles internal routing)
- `maxDuration: 60` sets 60-second timeout (Pro plan max without Fluid Compute; see Section 5)
- `excludeFiles` prevents large local dev data from entering the 500 MB bundle

**Do NOT put this in `vercel.json`** (it conflicts with Next.js):
- `"builds"` array — deprecated, incompatible with Next.js framework detection
- `"routes"` array — also deprecated; use `"rewrites"` instead

### Local Development: `next.config.ts`

In local dev, Vercel doesn't run. The Next.js dev server must proxy `/api/*` to the separately running FastAPI process (port 8000).

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:8000/api/:path*"
            : "/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

**Why this pattern works:**
- In development: Next.js proxies `/api/*` to FastAPI running on :8000
- In production (Vercel): the rewrite is a no-op since Vercel's routing takes over; `/api/:path*` hits the Python function directly
- Same origin for both — no CORS headers needed in either environment

---

## 3. Python + `uv` Configuration

### `pyproject.toml` (root)

```toml
[project]
name = "ml-peg-api"
version = "0.1.0"
description = "ML-PEG benchmarking API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "boto3>=1.35.0",
    "python-multipart>=0.0.12",
]

[project.scripts]
# Tells Vercel where the FastAPI app lives
app = "api.index:app"

[tool.uv]
dev-dependencies = [
    "uvicorn[standard]>=0.32.0",
    "httpx>=0.27.0",
]
```

**Key points:**
- `requires-python = ">=3.12"` pins Python version for Vercel (3.12 is the 2025 default)
- `[project.scripts]` `app = "api.index:app"` tells Vercel where FastAPI lives when the structure diverges from convention
- `dev-dependencies` under `[tool.uv]` are excluded from the Vercel production bundle automatically
- Vercel reads `uv.lock` if present for reproducible builds — commit it

### Vercel's uv support (HIGH confidence)

As of Vercel CLI 48.2.0 (2025), Vercel natively supports uv with zero configuration:
- Detects `pyproject.toml` + `uv.lock` and uses `uv sync` for installs
- 30–65% faster builds than pip
- If both `pyproject.toml` and `requirements.txt` exist with no lockfile, Vercel prefers `pyproject.toml` — **do not mix formats**
- If `uv.lock` is present but doesn't match `pyproject.toml`, Vercel will error (intentional: reproducible builds)

**Recommendation:** Use `pyproject.toml` + `uv.lock` exclusively. Delete `requirements.txt` from production. If you want `requirements.txt` for tooling compatibility, generate it with `uv export --no-hashes > requirements.txt` but tell Vercel to ignore it via `.vercelignore`.

### Pinning Python Version

Three mechanisms, in priority order:
1. `requires-python = ">=3.12"` in `pyproject.toml` — preferred, already in the project file
2. `.python-version` file at root containing `3.12` — simpler fallback
3. `Pipfile.lock` — irrelevant if using uv

Supported versions as of 2026-03: **3.12** (default), **3.13**, **3.14**. Python 3.12 is the safe choice — it's the default and most widely tested on Vercel infrastructure.

---

## 4. JavaScript/bun Configuration

### `package.json` (root)

```json
{
  "name": "ml-peg-ui",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "concurrently --names \"next,api\" --prefix-colors \"cyan,yellow\" \"bun run dev:next\" \"bun run dev:api\"",
    "dev:next": "next dev --turbopack",
    "dev:api": "uv run uvicorn api.index:app --reload --port 8000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@mui/material": "^6.0.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0",
    "@mui/x-data-grid": "^7.0.0",
    "plotly.js": "^2.35.0",
    "react-plotly.js": "^2.6.0"
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

**Why `concurrently` over Turborepo:**
This is not a true monorepo with separate packages — it's a single project with two runtimes. Turborepo adds unnecessary complexity. `concurrently` is a single dev dependency that runs both processes with color-coded output and clean SIGINT handling.

**Why `uv run uvicorn` not `uvicorn` directly:**
`uv run` ensures uvicorn runs in the uv-managed virtual environment, matching the `pyproject.toml` dependencies without manual venv activation.

**Bun on Vercel:**
Vercel auto-detects bun from `bun.lockb`. No configuration needed. Bun is used only for the JS side; Python uses uv independently.

---

## 5. Function Limits: Size and Timeout

### Size: 500 MB uncompressed (Python)

This is the **uncompressed bundle** limit — after Vercel bundles all Python files and installed packages.

**For ML-PEG specifically, the 333 MB `phonon_interactive.json` is a critical threat.** If it ends up in the function bundle, the build will fail. It must never be co-located in the repo root without exclusion.

**Strategy:**
1. The `data/` directory should not be committed (local dev only via `.gitignore`)
2. `excludeFiles` in `vercel.json` explicitly excludes `data/**`
3. On Vercel, all data comes from MinIO/S3 — zero local data in the bundle
4. Keep Python dependencies lean: `fastapi` (~5 MB), `boto3` (~50 MB), `httpx` (~5 MB) total ~60 MB — well under limit
5. If numpy/scipy are ever needed, they add ~100–200 MB each — avoid unless essential

**To diagnose bundle size issues:**
```bash
VERCEL_ANALYZE_BUILD_OUTPUT=1  # Set as env var, redeploy
```

**Exclude patterns for `vercel.json`:**
```json
"excludeFiles": "{data/**,tests/**,*.xyz,*.extxyz,**/__pycache__/**,**/*.pyc}"
```

### Timeout: 10s vs 60s

| Scenario | Limit |
|----------|-------|
| Hobby plan, default | 300s (5 min) |
| Pro plan, default | 300s (5 min) |
| Pro plan, configured max | 800s (13 min) |

**Wait — the PROJECT.md mentions "10s/60s timeout" but this is outdated.** With Fluid Compute enabled (Vercel default since 2024), Python functions have a **300s default** on both Hobby and Pro. The old 10s/60s limits applied to the legacy serverless model.

**For ML-PEG:** All responses should be fast (pre-computed JSON from S3, no computation). Target p99 < 500ms. The 333 MB phonon file must be streamed from S3 directly to the client via redirect or streaming response — never loaded into function memory.

**To set max duration in `vercel.json`:**
```json
"functions": {
  "api/**/*.py": {
    "maxDuration": 30
  }
}
```

30 seconds is generous for serving pre-computed JSON. Setting a lower bound avoids runaway functions.

---

## 6. S3/MinIO Integration from Vercel Serverless

### Environment Variables

Set these in Vercel project settings (Dashboard > Settings > Environment Variables):

```
AWS_ACCESS_KEY_ID=<minio-access-key>
AWS_SECRET_ACCESS_KEY=<minio-secret-key>
AWS_ENDPOINT_URL=https://your-minio-host.example.com
AWS_DEFAULT_REGION=us-east-1
```

**`AWS_ENDPOINT_URL` is the key for MinIO compatibility.** boto3 added official env var support for endpoint URL overrides. Setting this env var means your code needs zero MinIO-specific configuration — it just uses standard boto3 calls.

### Python client code (`api/index.py`)

```python
import boto3
import os
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
import json

app = FastAPI()

# Module-level client — reused across requests in the same execution context
# Vercel Fluid Compute keeps function instances warm, so this matters
s3 = boto3.client("s3")  # picks up AWS_* env vars automatically

BUCKET = os.environ.get("S3_BUCKET", "ml-peg-data")

@app.get("/api/v1/leaderboard/{category}")
async def get_leaderboard(category: str):
    key = f"metrics/{category}.json"
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    data = json.loads(obj["Body"].read())
    return JSONResponse(content=data)
```

**Why module-level `s3` client:**
Vercel Fluid Compute keeps function containers warm across requests. A module-level client is reused — avoiding TCP connection setup overhead on every request. This is the same pattern recommended for DB connection pooling in serverless environments.

**For the 333 MB phonon file — use a presigned URL, not streaming through the function:**

```python
@app.get("/api/v1/phonon-redirect")
async def get_phonon_redirect():
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET, "Key": "figures/phonon_interactive.json"},
        ExpiresIn=3600
    )
    return {"url": url}
```

The client fetches the presigned URL directly from MinIO — bypasses the 4.5 MB request body limit and avoids memory issues in the function. The 333 MB file never passes through Vercel.

**Local dev MinIO configuration:**

```bash
# .env.local (not committed)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT_URL=http://localhost:9000
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET=ml-peg-data
```

boto3 reads `.env.local` if you load it via `python-dotenv` or equivalent. For local dev with uvicorn, use:
```bash
uv run -- env $(cat .env.local | xargs) uvicorn api.index:app --reload
```

Or simpler: add `python-dotenv` and auto-load in `api/index.py` only when `VERCEL != "1"`.

---

## 7. Local Development: Running Both Services Together

### Recommended Approach: `concurrently` in `package.json`

```bash
bun run dev
```

This runs two processes in parallel:
1. `next dev --turbopack` on port 3000
2. `uv run uvicorn api.index:app --reload --port 8000`

Next.js proxies `/api/*` to FastAPI via the `next.config.ts` rewrites defined in Section 2. The developer only opens `localhost:3000` — same origin, no CORS, same experience as production.

### Process Management Details

`concurrently` options worth setting:
```json
"dev": "concurrently --kill-others-on-fail --names 'web,api' --prefix-colors 'blue,green' 'bun run dev:next' 'bun run dev:api'"
```
- `--kill-others-on-fail`: if FastAPI crashes, Next.js stops too (avoids confusing half-running state)
- Named prefixes make log output readable

### Alternative: `vercel dev`

`vercel dev` can simulate the full Vercel environment locally, running both Next.js and Python in one process. However:
- Requires Vercel CLI installed and logged in
- Slower startup than running services separately
- Python hot-reload does not work as well as uvicorn's `--reload`
- Recommended only for testing routing edge cases

**Verdict: use `concurrently` for day-to-day dev; use `vercel dev` to debug production routing issues.**

---

## Critical Gotchas

### 1. `api/` Directory Conflict with Next.js App Router

If using Next.js App Router, Next.js uses `src/app/api/` for its own Route Handlers. The **root-level `api/`** is for Vercel's Python runtime. These must not conflict:
- Python API lives at `api/index.py` (root level)
- Any Next.js server actions or route handlers live at `src/app/api/` (inside src)
- In production, root `api/` takes priority for Vercel Python routing

### 2. Vercel Prefers `pyproject.toml` Over `requirements.txt`

As of CLI 48.2.0, if both exist, `pyproject.toml` wins. Remove `requirements.txt` from production, or Vercel's behavior becomes unpredictable. If CI tools require `requirements.txt`, exclude it from Vercel's build scope.

### 3. The 4.5 MB Response Body Limit

Vercel Functions cap **response bodies at 4.5 MB**. Any JSON endpoint larger than this will return a 413 error. For ML-PEG:
- 239 figure JSONs: "mostly <2 MB" — borderline, verify largest ones
- 333 MB phonon file: **must use presigned URL redirect** (see Section 6)
- 92K diatomic JSONs: served individually, each small — fine

### 4. No Persistent Filesystem

Vercel functions have no writable filesystem between requests. All data must come from S3. Never write to disk in the function; use S3 for any state.

### 5. Fluid Compute Changes Cold Start Behavior

Vercel Fluid Compute (default since 2024) keeps containers warm longer. Module-level initialization (S3 client, config parsing) happens once and is reused. This is a feature — but means you should **not** assume a fresh process per request.

---

## Sources

- [Vercel FastAPI documentation](https://vercel.com/docs/frameworks/backend/fastapi) — HIGH confidence, official
- [Vercel Python runtime docs](https://vercel.com/docs/functions/runtimes/python) — HIGH confidence, official
- [Vercel Functions limits](https://vercel.com/docs/functions/limitations) — HIGH confidence, official
- [Vercel rewrites documentation](https://vercel.com/docs/rewrites) — HIGH confidence, official
- [Vercel uv changelog](https://vercel.com/changelog/python-package-manager-uv-is-now-available-for-builds-with-zero) — HIGH confidence, official
- [Next.js FastAPI Starter template](https://vercel.com/templates/next.js/nextjs-fastapi-starter) — MEDIUM confidence, official template
- [Vercel/vercel issue #14041: uv regression](https://github.com/vercel/vercel/issues/14041) — MEDIUM confidence, community-verified behavior
- [boto3 AWS_ENDPOINT_URL support](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/configuration.html) — HIGH confidence, official
- [Vercel S3 guide](https://vercel.com/kb/guide/how-can-i-use-aws-s3-with-vercel) — MEDIUM confidence, official KB
