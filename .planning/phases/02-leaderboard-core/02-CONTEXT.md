# Phase 2: Leaderboard Core - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Researchers can browse benchmark scores for all models in a fast, color-coded leaderboard table. Delivers: MUI DataGrid with viridis_r color-coding, category tab navigation with benchmark sub-tabs, summary table, dark/light mode toggle, GitHub links, deep-linkable URLs, and CDN caching. Search/filtering, weight sliders, figure drawer, and secondary viewers are separate phases.

Requirements: FR-1.1, FR-1.2, FR-1.3, FR-1.4, FR-1.5, FR-1.6, FR-4.1, FR-4.2, FR-4.3, FR-5.1, FR-5.2, FR-5.3, NFR-1.1, NFR-1.2, NFR-1.3, NFR-4.1, NFR-4.2, NFR-4.3

</domain>

<decisions>
## Implementation Decisions

### Category navigation
- Top scrollable tab bar (MUI Tabs with `variant="scrollable"`) for the 16 categories
- First tab is "Summary" showing an aggregated score table (one Score column per category + overall Score), matching the existing Dash site pattern
- Selecting a category reveals a second row of sub-tabs for individual benchmarks within that category
- Each benchmark sub-tab shows its own focused metrics table from the per-benchmark API endpoint

### URL routing
- Clean path-based URLs using Next.js App Router: `/` (summary), `/bulk_crystal` (category → first benchmark), `/bulk_crystal/elasticity` (specific benchmark)
- Deep-linkable and shareable — URL fully determines which category and benchmark are displayed
- Browser back/forward navigation works naturally with file-system routing

### Color scale
- viridis_r colormap (yellow=good → teal → purple=bad) — matches the existing ML-PEG Dash site
- Continuous gradient (not discrete steps) — each cell gets a unique color from its exact normalized score
- Formula: `(value - bad) / (good - bad)` clamped to [0,1], using threshold metadata from the API
- Missing/None values: gray background with diagonal hatched stripe pattern, matching existing site

### Table layout
- Horizontal scroll for wide tables (up to 47 metric columns in GSCDB138 benchmarks)
- Pin MLIP and Score columns on the left so they're always visible while scrolling
- Column header tooltips on hover showing metric description, units, and good/bad thresholds (using tooltip_header metadata from the API)
- Number formatting: significant figures (matching the existing Dash site's scientific formatting)
- Data range: 3-47 columns, 7-19 rows per benchmark table

### Page layout
- MUI AppBar header: "ML-PEG" title on left, GitHub repo link icon + dark/light toggle icon on right
- Table fills remaining viewport height below header + tabs (sticky column headers, table body scrolls vertically)
- No page-level vertical scroll — header, tabs, and table all visible at once
- On mobile/narrow screens: horizontal scroll for table, category tabs become scrollable chips

### Dark/Light mode
- MUI CSS Variables API (no SSR flash, no next-themes) — decided in Phase 1 research
- Theme preference persists in localStorage
- Toggle icon in the AppBar

### Claude's Discretion
- Color scale adaptation between dark and light mode (text contrast, opacity adjustments)
- GitHub link placement in table (MLIP column links vs separate icon column)
- Exact MUI theme customization (palette, typography, spacing)
- Loading states and skeleton screens
- Error state handling (API failures, empty categories)
- Summary table score aggregation logic (weighted average matching existing site)
- MUI DataGrid column width strategy

</decisions>

<specifics>
## Specific Ideas

- Match the existing Dash site's navigation pattern: Summary tab + category tabs. The improvement is adding benchmark sub-tabs instead of stacking all benchmarks on one long scrollable page
- viridis_r colormap chosen explicitly to maintain familiarity for existing ml-peg.stfc.ac.uk users
- Gray hatched pattern for missing values matches existing site — researchers already understand this convention
- Significant figure formatting maintains scientific credibility (not fixed decimal places)
- Full viewport table height keeps everything visible at once — researchers shouldn't need to scroll the page itself

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/types.ts`: `ApiEnvelope<T>`, `Category`, `MetricsRow`, `Model` interfaces already defined
- API endpoints fully working: `/api/v1/categories` (16 categories with embedded benchmarks), `/api/v1/benchmarks/{slug}/table` (metrics data with thresholds, tooltip_header, weights), `/api/v1/models` (20 models)
- `next.config.ts`: API proxy configured (`/api/*` → `http://127.0.0.1:8000/api/*`)
- Path alias `@/*` → `./src/*` configured in tsconfig.json

### Established Patterns
- Pydantic response models with envelope pattern: `{"data": [...], "meta": {"count": N, "columns": [...]}}`
- `BenchmarkRow` model with `extra="allow"` for dynamic metric columns
- Storage abstraction (filesystem for local dev, MinIO for production)

### Integration Points
- `src/app/page.tsx`: placeholder landing page to be replaced with Summary table
- `src/app/layout.tsx`: root layout needs MUI ThemeProvider + CssBaseline wrapping
- No MUI packages installed yet — need `@mui/material`, `@mui/x-data-grid`, `@emotion/react`, `@emotion/styled`
- Benchmark table API returns `thresholds` object per metric (good/bad values + unit) — ready for color-coding
- Benchmark table API returns `tooltip_header` metadata per column — ready for column tooltips
- Benchmark table API returns `columns` array with column descriptors

### Data Characteristics
- 16 categories, ~50 benchmarks, ~20 models
- Column count per benchmark: 3 to 47 (GSCDB138_NCIs widest)
- Row count per benchmark: 7 to 19
- Summary table: 16 category Score columns + MLIP + overall Score

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-leaderboard-core*
*Context gathered: 2026-03-10*
