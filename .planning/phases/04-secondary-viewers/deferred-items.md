# Deferred Items - Phase 04

## Pre-existing test failure (out of scope)

**File:** tests/test_models.py::test_benchmark_table_response_accepts_data_meta
**Issue:** Test passes `Meta(...)` where `BenchmarkMeta(...)` is required. The test is incorrectly typed — `BenchmarkTableResponse.meta` requires `BenchmarkMeta`, not the base `Meta` model.
**Status:** Pre-existing before Phase 04 work. Not caused by any Phase 04 changes.
**Action needed:** Fix the test to use `BenchmarkMeta(count=1, columns=[...])` instead of `Meta(count=1, columns=[...])`.
