# Phase 4: Secondary Viewers - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Researchers can explore diatomic curves, atomic structures, and NEB trajectories from within the UI. Three viewer types: (1) diatomic curve viewer with periodic table element selector and multi-model overlay, (2) 3D structure viewer for benchmarks with xyz files, (3) NEB trajectory viewer with 3D animation and energy profile. Phonon interactive viewer is deferred to a future phase.

Requirements: FR-6.1, FR-6.2, FR-6.4 (FR-6.3 phonon deferred)

</domain>

<decisions>
## Implementation Decisions

### Diatomic curve viewer
- Dedicated page at `/diatomics` (under physicality category navigation)
- Custom-built periodic table grid for element selection (no npm packages — existing ones are outdated)
- Full periodic table shown; elements without diatomic data are grayed out / non-clickable
- After selecting element 1, only valid pair partners remain enabled (dynamic filtering from pre-built index)
- Selecting an element pair renders all 19 models as overlaid Plotly curves with legend
- Pre-built `diatomic_index.json` maps valid element pairs → available models (avoids enumerating 92K files at runtime)
- Curve data: `{pair, element_1, element_2, distance[], energy[]}` per model per pair

### 3D structure viewer
- Uses 3Dmol.js (~500 KB) for WebGL molecular rendering
- Accessed via "View Structure" button in the existing figure drawer (appears only for benchmarks with xyz files)
- Opens a modal/panel with the 3D viewer
- Ball-and-stick rendering style (atoms as spheres, bonds as sticks)
- Show unit cell wireframe box for crystal structures (when Lattice/pbc="T T T" present)
- 3Dmol.js loaded lazily (similar to Plotly lazy loading pattern from Phase 3)
- 10+ benchmarks have xyz files; viewer only appears when structure data exists

### NEB trajectory viewer
- Dedicated page at `/nebs/li_diffusion` with model selector
- Side-by-side layout: 3D structure animation (3Dmol.js) on left, energy vs. reaction coordinate Plotly chart on right
- Scrub through frames or auto-play animation
- Server-side extxyz parsing: FastAPI endpoint parses extxyz files and returns JSON (frames with atoms, positions, energy)
- Python-side parsing using ASE or custom parser — browser receives ready-to-render data
- 27 extxyz files total, 2 per model (b and c NEB bands), small files

### Claude's Discretion
- Periodic table grid styling and layout (CSS Grid)
- Diatomic chart axis labels, colors, and legend placement
- 3Dmol.js viewer controls and camera defaults
- Animation speed and playback controls for NEB viewer
- Loading states for all three viewers
- Error handling when structure/curve data is missing
- Mobile responsive behavior for dedicated pages

</decisions>

<specifics>
## Specific Ideas

- Periodic table element selector for diatomics — researcher clicks elements directly on the table, not in dropdowns
- All models overlaid on diatomic chart for immediate comparison — no model selection step needed
- "View Structure" button in figure drawer keeps the leaderboard → figure → structure flow natural
- NEB viewer pairs 3D animation with energy profile so researchers see both the structural path AND the energy barrier simultaneously
- ZnDraw is the eventual replacement for 3Dmol.js (see deferred ideas)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/PlotlyChart.tsx`: Lazy-loaded Plotly component via `next/dynamic` — reuse for diatomic curves and NEB energy charts
- `src/components/FigureDrawer.tsx`: MUI Drawer — add "View Structure" button for benchmarks with xyz files
- `src/components/FigureSkeleton.tsx`: Loading skeleton — pattern for viewer loading states
- `src/lib/api.ts`: SWR-based data fetching hooks — extend with diatomic, structure, and NEB hooks
- `src/lib/types.ts`: TypeScript interfaces — needs diatomic curve, structure, and NEB frame types
- `api/storage.py`: Storage abstraction (filesystem/MinIO) — all data fetching goes through this

### Established Patterns
- SWR with `revalidateOnFocus: false` for data fetching
- `next/dynamic` with `ssr: false` for heavy client-side libraries (Plotly)
- MUI CSS Variables API for dark/light mode theming
- API proxy in `next.config.ts` (`/api/*` → `http://127.0.0.1:8000/api/*`)
- Presigned URL 307 redirect for large files (Phase 3)

### Integration Points
- Category tabs in `src/components/CategoryTabs.tsx` — diatomics is under physicality category
- Figure drawer `src/components/FigureDrawer.tsx` — add structure viewer button
- `api/index.py` — new endpoints needed: diatomic index, diatomic curves, structure files, NEB frames
- App Router pages — new routes: `/diatomics`, `/nebs/li_diffusion`

### Data Characteristics
- Diatomic curves: 19 models × 5,665 element pairs = 92,414 JSON files (few KB each)
- XYZ structures: 820K files across 10+ benchmarks (~5.6 MB total)
- NEB extxyz: 27 files (multi-frame, few KB each), `li_diffusion` benchmark only
- Phonon: 333 MB single file — DEFERRED

</code_context>

<deferred>
## Deferred Ideas

- **Phonon interactive viewer** (FR-6.3) — 333 MB Plotly JSON file too large to handle without a splitting/streaming strategy. Deferred to Phase 5+ when a clear approach is decided (pre-split per model, streaming, or client-side progressive loading).
- **ZnDraw integration** — Replace 3Dmol.js with ZnDraw for richer molecular visualization. ZnDraw is the user's preferred long-term solution but 3Dmol.js is the pragmatic v1 choice.

</deferred>

---

*Phase: 04-secondary-viewers*
*Context gathered: 2026-03-11*
