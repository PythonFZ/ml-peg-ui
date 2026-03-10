# Phase 1: Infrastructure - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

A working Vercel deployment serving real data from MinIO, with local dev running in one command. Delivers: Next.js + FastAPI monorepo, MinIO data pipeline, `bun run dev` starts everything, placeholder landing page, and health/data endpoints returning real data.

Requirements: NFR-2.1, NFR-2.2, NFR-2.3, NFR-2.4, NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4

</domain>

<decisions>
## Implementation Decisions

### API versioning & routing
- Path-based versioning: all endpoints under `/api/v1/...`
- Vercel routes all `/api/**` to FastAPI serverless function
- Can add `/api/v2/` later without breaking existing clients

### API endpoint structure (hierarchical)
- `GET /api/v1/health` — health check
- `GET /api/v1/categories` — returns all categories with embedded benchmark lists (single call gives frontend everything for navigation)
- `GET /api/v1/benchmarks/{slug}/table` — returns metrics table for a specific benchmark
- `GET /api/v1/benchmarks/{slug}/figures/{figure_slug}` — returns Plotly figure JSON (<4 MB) or 307 redirect to presigned S3 URL (>4 MB)
- `GET /api/v1/models` — returns unique model list derived from metrics tables (computed at startup/first request, cached)

### Response format (envelope)
- All list endpoints wrapped in `{"data": [...], "meta": {...}}`
- Meta includes count; expandable for future pagination/metadata
- Single-resource endpoints use `{"data": {...}}`
- Consistent shape across all endpoints

### Categories endpoint shape
- Embeds benchmark list inline — no second call needed
- Shape: `{"data": [{"slug": "conformers", "name": "Conformers", "benchmarks": [{"slug": "37conf8", "name": "37Conf8"}, ...]}]}`
- Data is small (~14 categories, ~50 benchmarks) — embedding is efficient

### Benchmark table data
- Pass through metrics_table.json content as-is, wrapped in envelope
- No Pydantic normalization — the JSON shape already matches MUI DataGrid needs (array of row objects with id, MLIP, Score, metric columns)
- Add `meta.columns` listing the column names for the frontend

### Models resource
- Derived from data at runtime — scan metrics tables for unique model entries
- Cached after first computation
- No separate models index file needed for Phase 1
- Shape: `{"data": [{"id": "mace-mp-0a", "display_name": "mace-mp-0a-D3"}, ...]}`

### Figure serving strategy
- Figures <4 MB: return Plotly JSON directly (200) — benefits from Vercel CDN caching
- Figures >4 MB: return 307 redirect to presigned MinIO URL
- 4 MB threshold chosen to stay under Vercel's 4.5 MB response limit with headroom

### Local dev data access (filesystem fallback)
- If `MINIO_ENDPOINT` env var is not set, read from local `data/` folder (filesystem)
- If `MINIO_ENDPOINT` is set, connect to MinIO bucket
- Storage abstraction layer in Python that picks filesystem vs S3 based on env
- Zero setup for local dev — just have `data/` folder, no MinIO needed

### Environment variables
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

</decisions>

<specifics>
## Specific Ideas

- Categories endpoint should be a single call that gives the frontend everything it needs for sidebar/tab navigation — no waterfalling
- Table data passthrough keeps the API simple and avoids schema maintenance burden as benchmarks evolve
- Filesystem fallback means a new developer can `git clone`, extract data, `bun run dev` and be running immediately

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, empty repo

### Established Patterns
- None yet — Phase 1 establishes all patterns

### Integration Points
- `data/` directory structure: `{category}/{benchmark}/{benchmark}_metrics_table.json` and `figure_{name}.json`
- Model directories under each benchmark contain `.xyz` files (relevant for Phase 4, not Phase 1)
- `data/assets/` contains additional resources

### Data shape (from inspection)
- Metrics table JSON: `{"data": [{"MLIP": "name-D3", "id": "name", "Score": 0.83, ...metric_columns}]}`
- Figure JSON: `{"data": [...], "layout": {...}}` — standard Plotly format
- 14 top-level categories, ~50+ benchmarks, ~20 models

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-infrastructure*
*Context gathered: 2026-03-10*
