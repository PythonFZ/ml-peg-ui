---
phase: 02-leaderboard-core
plan: "01"
subsystem: api
tags: [fastapi, pydantic, typescript, benchmark, thresholds, viridis, heatmap]

# Dependency graph
requires:
  - phase: 01-infrastructure
    provides: FastAPI backend with benchmark_table endpoint and storage abstraction

provides:
  - Extended BenchmarkTableResponse with thresholds/tooltip_header/weights/structured columns
  - Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta Pydantic models in api/models.py
  - TypeScript interfaces Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta, BenchmarkTableResponse
  - Tests for all new metadata fields and cache headers

affects: [03-data-viz, frontend color-coding, viridis_r heatmap implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BenchmarkMeta extends count/columns with typed thresholds/tooltip_header/weights dicts"
    - "Threshold model uses extra='allow' to absorb level_of_theory from raw JSON without breaking validation"
    - "ColumnTooltip | str union type for tooltip_header values — real data has both dict and string forms"

key-files:
  created: []
  modified:
    - api/models.py
    - api/index.py
    - src/lib/types.ts
    - tests/test_api.py

key-decisions:
  - "Threshold model uses ConfigDict(extra='allow') to absorb undocumented level_of_theory field present in real JSON without breaking validation"
  - "BenchmarkMeta replaces Meta directly in BenchmarkTableResponse rather than inheriting, keeping Meta clean for other endpoints"
  - "tooltip_header validated as ColumnTooltip | str union — production data confirmed all values are dicts, but union is defensive"
  - "columns_validated falls back to None if empty list (preserves nullable semantics from original Meta.columns)"

patterns-established:
  - "Extract raw JSON fields immediately after payload read, then validate each with Pydantic before building response model"
  - "TDD: write failing tests first, commit RED, then implement GREEN"

requirements-completed: [NFR-1.3, FR-1.2, FR-1.4]

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 2 Plan 01: Extended Benchmark Table API Summary

**Pydantic models Threshold/ColumnDescriptor/ColumnTooltip/BenchmarkMeta added; benchmark_table endpoint now passes thresholds, tooltip_header, weights, and structured columns from raw JSON; TypeScript types mirror the extended shape**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T06:48:19Z
- **Completed:** 2026-03-11T06:50:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Extended API models with Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta in api/models.py
- Updated benchmark_table endpoint to extract and validate thresholds/tooltip_header/weights/columns from raw JSON
- Added 5 new tests (thresholds, tooltip_header, weights, structured columns, cache headers) — all pass with existing 9 tests
- Updated src/lib/types.ts with matching TypeScript interfaces for frontend consumption

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for thresholds/tooltips/weights/cache** - `62334e1` (test)
2. **Task 1: Extend API models and benchmark_table endpoint** - `50eea30` (feat)
3. **Task 2: TypeScript types for extended API response** - `4479477` (feat)

**Plan metadata:** (docs commit follows)

_Note: TDD task 1 has separate test commit (RED) and implementation commit (GREEN)_

## Files Created/Modified
- `api/models.py` - Added Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta; updated BenchmarkTableResponse to use BenchmarkMeta
- `api/index.py` - Updated benchmark_table endpoint to extract and validate rich metadata from raw JSON; imported new model classes
- `src/lib/types.ts` - Added Threshold, ColumnDescriptor, ColumnTooltip, BenchmarkMeta, BenchmarkTableResponse TypeScript interfaces
- `tests/test_api.py` - Added 5 new tests for thresholds, tooltip_header, weights, structured columns, and cache headers

## Decisions Made
- `Threshold` model uses `ConfigDict(extra="allow")` to absorb the `level_of_theory` field present in production JSON without breaking validation (not in spec but present in real data)
- `BenchmarkMeta` is a new model rather than inheriting from `Meta`, keeping `Meta` clean for categories/models endpoints
- `tooltip_header` validated as `ColumnTooltip | str` union type defensively, though all production values are dicts
- `columns_validated` falls back to `None` if empty, preserving the nullable semantics from the original `Meta.columns`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Threshold model needed extra="allow" for level_of_theory field**
- **Found during:** Task 1 inspection of real JSON data
- **Issue:** Real JSON thresholds contain `level_of_theory` field not in the spec; without `extra="allow"` Pydantic would strip it silently or error
- **Fix:** Added `model_config = ConfigDict(extra="allow")` to `Threshold` model so extra fields are preserved without raising validation errors
- **Files modified:** api/models.py
- **Verification:** Tests pass; `uv run pytest tests/test_api.py -x -v` all 14 pass
- **Committed in:** 50eea30 (Task 1 feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - undocumented field in real data)
**Impact on plan:** Minor defensive fix, no scope creep.

## Issues Encountered
None beyond the Threshold extra field handled above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Threshold data now available in API response — frontend can implement viridis_r color-coding using `meta.thresholds[metric].good` and `meta.thresholds[metric].bad`
- `meta.tooltip_header` ready for column header tooltip rendering
- `meta.weights` ready for client-side score computation if needed
- TypeScript types are ready for import in page components

---
*Phase: 02-leaderboard-core*
*Completed: 2026-03-11*

## Self-Check: PASSED

- FOUND: api/models.py
- FOUND: api/index.py
- FOUND: src/lib/types.ts
- FOUND: tests/test_api.py
- FOUND: .planning/phases/02-leaderboard-core/02-01-SUMMARY.md
- FOUND commit 62334e1: test(02-01) failing tests
- FOUND commit 50eea30: feat(02-01) API models/endpoint
- FOUND commit 4479477: feat(02-01) TypeScript types
