---
phase: 04-secondary-viewers
plan: "01"
subsystem: backend-api
tags: [fastapi, storage, ase, diatomics, structures, nebs, pydantic, tdd]
dependency_graph:
  requires: []
  provides:
    - api.storage.get_bytes
    - GET /api/v1/diatomics/index
    - GET /api/v1/diatomics/curves/{pair}
    - GET /api/v1/structures/{benchmark_slug}/{model}/{filename}
    - GET /api/v1/nebs/{benchmark}/{model}/{band}/frames
  affects:
    - api/index.py
    - api/storage.py
    - api/models.py
tech_stack:
  added: [ase==3.27.0]
  patterns:
    - TDD (red-green) for all new code
    - ASE extxyz parsing for NEB frames (energy from atoms.calc.results)
    - Diatomic index cached in app.state after first load (same pattern as models_cache)
    - PBC detection via 'pbc="T T T"' string match on second line of xyz file
key_files:
  created:
    - api/models.py (new Phase 4 models section)
    - scripts/build_diatomic_index.py
    - data/physicality/diatomics/diatomic_index.json
    - tests/test_storage_get_bytes.py
    - tests/test_diatomics.py
    - tests/test_structures.py
    - tests/test_nebs.py
  modified:
    - api/storage.py (get_bytes added to protocol and both backends)
    - api/index.py (4 new endpoints + diatomic_index cache in lifespan)
    - pyproject.toml (ase dependency added)
decisions:
  - "ASE get_potential_energy() NOT used — energy read from atoms.calc.results['energy'] directly to avoid side effects"
  - "PBC detected via string match 'pbc=\"T T T\"' on second xyz line — no need for ASE parsing of structure files"
  - "Diatomic index cached in app.state.diatomic_index after first load — avoids re-reading 10KB JSON per request"
  - "MinioBackend.get_bytes catches S3Error with code NoSuchKey and re-raises as FileNotFoundError for consistent interface"
  - "NEB band file matching uses suffix pattern -{band}-neb-band.extxyz — handles both hyphen and underscore model name variants"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 7
  files_modified: 4
---

# Phase 4 Plan 1: Backend API Endpoints for Secondary Viewers Summary

All 4 Phase 4 backend API endpoints implemented with TDD — storage `get_bytes()`, 7 Pydantic models, ASE for extxyz parsing, diatomic index build script generating 10,441 element pairs, and 34 new passing tests.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Extend storage with get_bytes, add Pydantic models, install ASE, create diatomic index script | 21eaa6e | api/storage.py, api/models.py, scripts/build_diatomic_index.py, data/physicality/diatomics/diatomic_index.json |
| 2 | Add 4 new API endpoints with tests | ec7f1f3 | api/index.py, tests/test_diatomics.py, tests/test_structures.py, tests/test_nebs.py |

## Deviations from Plan

None - plan executed exactly as written.

## Pre-existing Issues (out of scope)

**tests/test_models.py::test_benchmark_table_response_accepts_data_meta** — pre-existing failure before Phase 04. Test passes `Meta(...)` where `BenchmarkMeta(...)` is required by `BenchmarkTableResponse`. Not caused by Phase 04 changes. Logged to `deferred-items.md`.

## Decisions Made

1. **ASE energy extraction** — Read from `atoms.calc.results['energy']` directly rather than `atoms.get_potential_energy()` to avoid triggering calculator re-evaluation side effects.

2. **PBC detection** — Simple string match `pbc="T T T"` on the second line of the xyz file. Avoids ASE overhead for what is purely a metadata check.

3. **Diatomic index caching** — `app.state.diatomic_index` set to `None` in lifespan and lazily populated on first request, mirroring the `models_cache` pattern already in the codebase.

4. **MinioBackend.get_bytes** — Catches `S3Error` with `code == "NoSuchKey"` and re-raises as `FileNotFoundError` so callers get a consistent interface regardless of backend.

5. **NEB band matching** — Uses `endswith(f"-{band}-neb-band.extxyz")` suffix pattern which handles both `mace-mp-0b3-b-neb-band.extxyz` and `mattersim_5M-b-neb-band.extxyz`.

## Verification Results

```
uv run pytest tests/ -v (excluding pre-existing failure in test_models.py)
68 passed, 1 skipped

uv run python -c "import json; d=json.load(open('data/physicality/diatomics/diatomic_index.json')); print(f'{len(d)} pairs')"
10441 pairs

uv run python -c "import ase; print(ase.__version__)"
3.27.0
```

## Self-Check: PASSED
