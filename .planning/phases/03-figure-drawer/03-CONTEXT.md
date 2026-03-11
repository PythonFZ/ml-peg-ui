# Phase 3: Figure Drawer - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Clicking any data cell in the leaderboard opens an MUI Drawer containing Plotly figures for that benchmark. Plotly loads lazily on first drawer open. Backend serves figure JSON directly, with presigned URL redirect logic ready for figures >4 MB. Search/filtering, weight sliders, and secondary viewers are separate phases.

Requirements: FR-3.1, FR-3.2, FR-3.3, FR-3.4, NFR-1.4

</domain>

<decisions>
## Implementation Decisions

### Drawer behavior
- Right-side MUI Drawer, ~50% viewport width
- Clicking another cell while drawer is open swaps the figure in-place (no close/reopen animation)
- Close via X button, clicking outside (backdrop), or Escape key — standard MUI Drawer behavior
- Drawer header shows benchmark name + model name for context (e.g., "Elasticity — MACE-MP-0a")

### Cell click trigger
- All metric data cells are clickable (not just Score) — clicking any cell opens figures for that benchmark
- Pointer cursor + subtle hover brightness/elevation change to indicate interactivity
- Benchmarks without figures (3 out of 53) have click disabled — no pointer cursor, no hover effect
- Requires knowing which benchmarks have figures (API or metadata check)

### Multi-figure handling
- Benchmarks with multiple figures (e.g., GSCDB138 has 11) show all figures stacked in a scrollable drawer
- No figure selection UI needed — just scroll through all figures for that benchmark

### Figure display
- Plotly modebar (zoom, pan, download) shows on hover — clean by default, tools available on demand
- Skeleton placeholder while figure loads — matches TableSkeleton pattern from leaderboard
- Dark/light mode: override Plotly layout.paper_bgcolor, plot_bgcolor, font.color, and gridline colors to match current MUI theme (not Plotly's built-in dark template)

### Plotly bundle strategy
- Use `plotly.js-basic-dist-min` (~1.5 MB gzipped) — includes scatter, scattergl, bar, histogram, pie, heatmap, contour; future-proof for Phase 4
- Lazy load via `next/dynamic` with `ssr: false` — Plotly bundle downloads only on first drawer open (NFR-1.4)
- All 239 figures use only `scatter` and `scattergl` trace types (verified by audit)

### Backend figure serving
- Implement the stubbed figure endpoint to return figure JSON directly (all current figures <4 MB)
- Include size-check + 307 presigned URL redirect logic for files >4 MB (ready for future large figures)
- Satisfies FR-3.4 proactively

### Client-side caching
- Use SWR (already used for table data) to cache fetched figures
- Re-opening drawer for same benchmark is instant from cache
- Consistent with existing data fetching pattern

### Claude's Discretion
- Exact drawer animation timing and easing
- Skeleton placeholder design and sizing
- Figure title formatting within the drawer
- Error state when figure fetch fails
- Mobile responsive behavior for drawer width
- SWR cache configuration (stale time, revalidation)

</decisions>

<specifics>
## Specific Ideas

- Drawer should feel like a detail panel — table stays partially visible on the left so researchers maintain context
- Swap-in-place behavior enables rapid browsing across different benchmark figures without drawer animation interrupting the workflow
- Pointer cursor + hover effect is minimal enough not to interfere with the viridis_r heatmap color coding

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/LeaderboardTable.tsx`: MUI DataGrid with `disableRowSelectionOnClick` — needs `onCellClick` handler added
- `src/components/TableSkeleton.tsx`: Existing skeleton component — pattern to follow for figure loading skeleton
- `src/lib/api.ts`: SWR-based data fetching — extend with figure fetching hook
- `src/lib/types.ts`: TypeScript interfaces for API responses — needs figure-related types

### Established Patterns
- SWR with `revalidateOnFocus: false` for data fetching (Phase 2)
- MUI CSS Variables API for dark/light mode (Phase 2)
- API proxy configured in `next.config.ts` (`/api/*` → `http://127.0.0.1:8000/api/*`)

### Integration Points
- `api/index.py`: Figure endpoint stubbed at `/api/v1/benchmarks/{slug}/figures/{figure_slug}` — returns 501, needs implementation
- `api/storage.py`: Storage abstraction (filesystem/MinIO) — figure serving needs to use this
- LeaderboardTable: Add `onCellClick` handler to open drawer
- 50 out of 53 benchmarks have figures; 3 benchmarks have metrics tables but no figures
- Figure count per benchmark: typically 1-3, up to 11 (GSCDB138_thermochemistry)
- Largest figure: 2.5 MB (barrier_density) — all under 4 MB threshold

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-figure-drawer*
*Context gathered: 2026-03-11*
