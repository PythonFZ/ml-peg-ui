# Roadmap: ML-PEG UI

## Overview

Five phases transform an empty repo into a production-grade scientific benchmarking leaderboard on Vercel. Phase 1 eliminates deployment risk before any feature work — Vercel bundle exclusion, uv/pyproject.toml setup, and MinIO connectivity must work first. Phase 2 delivers the primary screen: the color-coded leaderboard table. Phase 3 adds the cell-click figure drawer. Phase 4 adds the four secondary viewers. Phase 5 completes the scientific utility layer with weight sliders, search, and polish.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure** - Vercel deployment + FastAPI skeleton + MinIO data pipeline (completed 2026-03-10)
- [x] **Phase 01.1: Replace ORJSONResponse with Pydantic response models** (INSERTED) (completed 2026-03-10)
- [ ] **Phase 2: Leaderboard Core** - Color-coded MUI DataGrid with category navigation and CDN caching
- [ ] **Phase 3: Figure Drawer** - Cell-click Plotly drawer with lazy loading and presigned URL redirect
- [x] **Phase 4: Secondary Viewers** - Diatomic curve, 3D structure, NEB trajectory, and phonon viewers (completed 2026-03-12)
- [ ] **Phase 5: UX Polish** - Search autocomplete, weight sliders, tooltips, hover cards, onboarding

## Phase Details

### Phase 1: Infrastructure
**Goal**: A working Vercel deployment serving real data from MinIO, with local dev running in one command
**Depends on**: Nothing (first phase)
**Requirements**: NFR-2.1, NFR-2.2, NFR-2.3, NFR-2.4, NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4
**Success Criteria** (what must be TRUE):
  1. `bun run dev` starts both Next.js (port 3000) and uvicorn (port 8000) without manual steps
  2. `GET /api/v1/health` returns 200 on local and on Vercel
  3. `GET /api/v1/models` and `GET /api/v1/benchmarks` return real data fetched from MinIO
  4. Vercel deployment succeeds with Python bundle under 100 MB (`data/` excluded from bundle)
  5. A Next.js page at `/` renders without errors (placeholder content acceptable)
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md — Project scaffolding: pyproject.toml, Next.js app, Vercel config, TS types, test framework
- [x] 01-02-PLAN.md — Storage abstraction + FastAPI endpoints + comprehensive tests

### Phase 01.1: Replace ORJSONResponse with Pydantic response models (INSERTED)

**Goal:** Replace all ORJSONResponse usage with typed Pydantic response models, remove orjson dependency, and modernize the API to use FastAPI's native Pydantic serialization
**Requirements**: PYDANTIC-01, PYDANTIC-02
**Depends on:** Phase 1
**Plans:** 1/1 plans complete

Plans:
- [ ] 01.1-01-PLAN.md — Pydantic response models, endpoint refactor, orjson removal, test updates

### Phase 2: Leaderboard Core
**Goal**: Researchers can browse benchmark scores for all models in a fast, color-coded leaderboard table
**Depends on**: Phase 1
**Requirements**: FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-4.1, FR-4.2, FR-4.3, FR-5.1, FR-5.2, FR-5.3, NFR-1.1, NFR-1.2, NFR-1.3, NFR-4.1, NFR-4.2, NFR-4.3
**Success Criteria** (what must be TRUE):
  1. All MLIP models appear as rows in a sortable MUI DataGrid; clicking a column header sorts correctly
  2. Cells are color-coded using the `(value - bad) / (good - bad)` formula; missing values show gray/hatched
  3. Navigating to a benchmark category (tab or sidebar) updates the table to show that category's metrics
  4. The page fully loads in under 2 seconds on broadband; table re-renders after sort in under 100ms
  5. Dark and light mode toggle works with no SSR flash; preference persists across page reloads
  6. GitHub links to model repos and benchmark sources are present and correct; URLs are deep-linkable per category
**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md — Extend benchmark table API with thresholds, tooltips, weights; update TS types (completed 2026-03-11)
- [ ] 02-02-PLAN.md — Install MUI, wire dark/light mode, create app shell with category/benchmark tabs
- [ ] 02-03-PLAN.md — Build LeaderboardTable with viridis_r heatmap, sticky columns, GitHub links
- [ ] 02-04-PLAN.md — Summary table, App Router pages, deep-linkable URLs, final verification

### Phase 3: Figure Drawer
**Goal**: Clicking any data cell opens a Plotly chart in a drawer, with large figures handled via presigned redirect
**Depends on**: Phase 2
**Requirements**: FR-3.1, FR-3.2, FR-3.3, FR-3.4, NFR-1.4
**Success Criteria** (what must be TRUE):
  1. Clicking a leaderboard cell opens an MUI Drawer containing the correct Plotly figure for that model/benchmark combination
  2. Plotly JavaScript loads only on the first drawer open (not on initial page load); subsequent opens are instant
  3. Density scatter, violin, parity, and confusion matrix figure types all render correctly
  4. Figures larger than 4 MB (bulk_density, shear_density) load successfully via 307 presigned URL redirect without hitting Vercel's 4.5 MB limit
  5. Charts render correctly in both dark and light mode
**Plans:** 1/2 plans executed

Plans:
- [ ] 03-01-PLAN.md — Backend figure endpoints: figures index, figure detail with 307 redirect, storage get_object_size
- [ ] 03-02-PLAN.md — Frontend FigureDrawer with lazy Plotly, cell-click wiring, dark/light theming

### Phase 4: Secondary Viewers
**Goal**: Researchers can explore diatomic curves, atomic structures, and NEB trajectories from within the UI (phonon viewer deferred)
**Depends on**: Phase 3
**Requirements**: FR-6.1, FR-6.2, FR-6.3, FR-6.4
**Success Criteria** (what must be TRUE):
  1. Selecting an element pair and model in the diatomic viewer renders a multi-model overlay chart without enumerating all 71K files
  2. Benchmarks with xyz structure files (10 benchmarks) show a 3D structure viewer that loads the correct structure on demand
  3. The NEB trajectory viewer plays through extxyz multi-frame data for li_diffusion benchmarks
  4. The phonon interactive viewer loads on demand via presigned URL (the 333 MB file is never proxied through Vercel)
**Plans:** 4/4 plans complete

Plans:
- [ ] 04-01-PLAN.md — Backend: storage get_bytes, Pydantic models, diatomic/structure/NEB endpoints, tests
- [ ] 04-02-PLAN.md — Frontend: diatomic curve viewer with periodic table and multi-model overlay
- [ ] 04-03-PLAN.md — Frontend: 3D structure viewer with 3Dmol.js in figure drawer modal
- [ ] 04-04-PLAN.md — Frontend: NEB trajectory viewer with 3D animation and energy profile chart

### Phase 5: UX Polish
**Goal**: Researchers can filter the leaderboard by model and benchmark, adjust metric weights, and access contextual help
**Depends on**: Phase 4
**Requirements**: FR-2.1, FR-2.2, FR-2.3, FR-7.1, FR-7.2, FR-7.3
**Success Criteria** (what must be TRUE):
  1. Typing in the model filter autocomplete narrows the leaderboard rows to matching models; multiple models can be selected simultaneously
  2. Typing in the benchmark filter autocomplete narrows the visible columns; multiple benchmarks can be selected simultaneously
  3. Moving a metric weight slider recalculates and updates the Score column in real time without a server round-trip
  4. Category-level weight sliders on the summary view reorder models by adjusted composite score
**Plans:** 1/3 plans executed

Plans:
- [ ] 05-01-PLAN.md — Search & filtering: model autocomplete, benchmark quick-search, column filter
- [ ] 05-02-PLAN.md — Weight controls: per-metric sliders, threshold editing, score recalculation
- [ ] 05-03-PLAN.md — Onboarding & polish: tutorial modal, FAQ accordion, model hover cards

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 01.1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure | 2/2 | Complete   | 2026-03-10 |
| 01.1. Pydantic Response Models | 1/1 | Complete    | 2026-03-10 |
| 2. Leaderboard Core | 1/4 | In Progress | - |
| 3. Figure Drawer | 1/2 | In Progress|  |
| 4. Secondary Viewers | 4/4 | Complete   | 2026-03-12 |
| 5. UX Polish | 1/3 | In Progress|  |
