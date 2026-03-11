# Deferred Items — Phase 03 Figure Drawer

## Pre-existing Test Failure (Out of Scope)

**File:** `tests/test_models.py::test_benchmark_table_response_accepts_data_meta`

**Discovered during:** Plan 03-01, full test suite run

**Issue:** `BenchmarkTableResponse` uses `BenchmarkMeta` as its `meta` field type, but the test passes a `Meta` instance. This was already failing before Plan 03-01 changes.

**Not fixed because:** Pre-existing failure, not caused by current plan changes. Out of scope per deviation rule scope boundary.

**Fix when:** Address in a separate plan or during Phase 03-02 test cleanup.
