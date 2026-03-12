# Requirements — ML-PEG UI

## Functional Requirements

### FR-1: Leaderboard Table
- FR-1.1: Display all MLIP models in a sortable MUI DataGrid
- FR-1.2: Color-code cells using threshold-aware formula `(value - bad) / (good - bad)` clamped to [0,1]
- FR-1.3: Show benchmark categories as navigation (tabs or sidebar)
- FR-1.4: Display per-benchmark metrics tables with Score column
- FR-1.5: Use `id` field for routing, `MLIP` field (with D3 suffix) for display
- FR-1.6: Handle missing model data (None values) with gray/hatched cells

### FR-2: Search & Filtering
- FR-2.1: Multi-entry autocomplete for filtering by model name
- FR-2.2: Multi-entry autocomplete for filtering by benchmark name
- FR-2.3: Client-side filtering (data is small enough)

### FR-3: Interactive Plots
- FR-3.1: Click table cell → open MUI Drawer with Plotly figure
- FR-3.2: Load Plotly lazily via `dynamic(ssr: false)` + partial bundle
- FR-3.3: Support density scatter, violin, parity, and confusion matrix plot types
- FR-3.4: Serve figures >4 MB via presigned S3 URL redirect (307)

### FR-4: Dark/Light Mode
- FR-4.1: Toggle between dark and light themes
- FR-4.2: Use MUI CSS Variables API (no SSR flash)
- FR-4.3: Persist preference in localStorage

### FR-5: Navigation & Links
- FR-5.1: GitHub links to model repos and benchmark sources
- FR-5.2: Category-based navigation structure matching the 14+ benchmark categories
- FR-5.3: Deep-linkable URLs for categories and benchmarks

### FR-6: Secondary Viewers (v1.1)
- FR-6.1: Diatomic curve viewer — element pair selector + multi-model overlay
- FR-6.2: 3D structure viewer for benchmarks with xyz/extxyz files (10 benchmarks)
- FR-6.3: Phonon interactive viewer via presigned URL
- FR-6.4: NEB trajectory viewer

### FR-7: Weight Adjustment (v1.1)
- FR-7.1: Sliders to adjust metric weights per benchmark
- FR-7.2: Client-side score recalculation using weight data from API
- FR-7.3: Category weight adjustment on summary view

## Non-Functional Requirements

### NFR-1: Performance
- NFR-1.1: Initial page load <2s on broadband
- NFR-1.2: Table re-render <100ms (memoized columns, getCellClassName)
- NFR-1.3: CDN caching on all data endpoints (`s-maxage=3600, stale-while-revalidate=86400`)
- NFR-1.4: Plotly bundle loaded only on first drawer open

### NFR-2: Deployment
- NFR-2.1: Single Vercel project — Next.js frontend + FastAPI serverless function
- NFR-2.2: Python bundle <100 MB (target: ~17 MB with minio-py + orjson + pydantic)
- NFR-2.3: All data served from MinIO S3-compatible storage (no local filesystem)
- NFR-2.4: `data/` excluded from Vercel bundle via `.vercelignore` and `excludeFiles`

### NFR-3: Developer Experience
- NFR-3.1: `bun run dev` starts both Next.js and FastAPI via concurrently
- NFR-3.2: uv for Python dependency management
- NFR-3.3: bun for JS dependency management
- NFR-3.4: TypeScript types derived from actual data schemas

### NFR-4: Accessibility
- NFR-4.1: Keyboard navigable table
- NFR-4.2: Sufficient color contrast in both themes
- NFR-4.3: Screen reader labels on interactive elements

## Out of Scope (v1)
- Model submission flow
- User accounts / saved configurations
- Live metric computation from raw data
- Benchmark comparison across categories
- Permalinks to specific table states

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NFR-2.1 | Phase 1 | Complete |
| NFR-2.2 | Phase 1 | Complete |
| NFR-2.3 | Phase 1 | Complete |
| NFR-2.4 | Phase 1 | Complete |
| NFR-3.1 | Phase 1 | Complete |
| NFR-3.2 | Phase 1 | Complete |
| NFR-3.3 | Phase 1 | Complete |
| NFR-3.4 | Phase 1 | Complete |
| FR-1.1 | Phase 2 | Pending |
| FR-1.2 | Phase 2 | Pending |
| FR-1.3 | Phase 2 | Complete |
| FR-1.4 | Phase 2 | Pending |
| FR-1.5 | Phase 2 | Pending |
| FR-1.6 | Phase 2 | Pending |
| FR-4.1 | Phase 2 | Complete |
| FR-4.2 | Phase 2 | Complete |
| FR-4.3 | Phase 2 | Complete |
| FR-5.1 | Phase 2 | Pending |
| FR-5.2 | Phase 2 | Complete |
| FR-5.3 | Phase 2 | Pending |
| NFR-1.1 | Phase 2 | Pending |
| NFR-1.2 | Phase 2 | Pending |
| NFR-1.3 | Phase 2 | Pending |
| NFR-4.1 | Phase 2 | Pending |
| NFR-4.2 | Phase 2 | Pending |
| NFR-4.3 | Phase 2 | Complete |
| FR-3.1 | Phase 3 | Complete |
| FR-3.2 | Phase 3 | Complete |
| FR-3.3 | Phase 3 | Complete |
| FR-3.4 | Phase 3 | Complete |
| NFR-1.4 | Phase 3 | Complete |
| FR-6.1 | Phase 4 | Complete |
| FR-6.2 | Phase 4 | Complete |
| FR-6.3 | Phase 4 | Pending |
| FR-6.4 | Phase 4 | Complete |
| FR-2.1 | Phase 5 | Complete |
| FR-2.2 | Phase 5 | Complete |
| FR-2.3 | Phase 5 | Complete |
| FR-7.1 | Phase 5 | Complete |
| FR-7.2 | Phase 5 | Complete |
| FR-7.3 | Phase 5 | Complete |
