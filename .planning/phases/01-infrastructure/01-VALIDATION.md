---
phase: 1
slug: infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (via uv) |
| **Config file** | `pyproject.toml` `[tool.pytest.ini_options]` — Wave 0 |
| **Quick run command** | `uv run pytest tests/ -x -q -m "not integration"` |
| **Full suite command** | `uv run pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `uv run pytest tests/ -x -q -m "not integration"`
- **After every plan wave:** Run `uv run pytest tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | NFR-2.1 | unit | `uv run pytest tests/test_api.py::test_app_exists -x` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | NFR-2.1 | unit | `uv run pytest tests/test_api.py::test_health -x` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 1 | NFR-2.1 | unit | `uv run pytest tests/test_api.py::test_categories -x` | ❌ W0 | ⬜ pending |
| 1-01-04 | 01 | 1 | NFR-2.1 | unit | `uv run pytest tests/test_api.py::test_models -x` | ❌ W0 | ⬜ pending |
| 1-01-05 | 01 | 1 | NFR-2.2 | smoke | `uv run python scripts/check_bundle_size.py` | ❌ W0 | ⬜ pending |
| 1-01-06 | 01 | 1 | NFR-2.3 | unit | `uv run pytest tests/test_storage.py::test_fs_get_json -x` | ❌ W0 | ⬜ pending |
| 1-01-07 | 01 | 1 | NFR-2.3 | integration | `uv run pytest tests/test_storage.py::test_minio_get_json -x -m integration` | ❌ W0 | ⬜ pending |
| 1-01-08 | 01 | 1 | NFR-2.4 | smoke | `uv run pytest tests/test_config.py::test_vercelignore -x` | ❌ W0 | ⬜ pending |
| 1-01-09 | 01 | 1 | NFR-3.1 | smoke | `uv run pytest tests/test_config.py::test_dev_script -x` | ❌ W0 | ⬜ pending |
| 1-01-10 | 01 | 1 | NFR-3.2 | smoke | `uv run pytest tests/test_config.py::test_uv_lockfile -x` | ❌ W0 | ⬜ pending |
| 1-01-11 | 01 | 1 | NFR-3.4 | smoke | `uv run pytest tests/test_config.py::test_ts_types -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_api.py` — stubs for NFR-2.1 (FastAPI endpoints)
- [ ] `tests/test_storage.py` — stubs for NFR-2.3 (filesystem + MinIO backends)
- [ ] `tests/test_config.py` — stubs for NFR-2.4, NFR-3.1, NFR-3.2, NFR-3.4 (config smoke tests)
- [ ] `tests/conftest.py` — shared fixtures (TestClient, temp data dir)
- [ ] Framework install: `uv add --dev pytest httpx` — httpx needed for FastAPI TestClient

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `bun run dev` starts both Next.js and uvicorn | NFR-3.1 | Requires running processes | Run `bun run dev`, verify port 3000 and 8000 respond |
| Vercel deployment succeeds | NFR-2.2 | Requires Vercel platform | Deploy and verify `/api/v1/health` returns 200 |
| MinIO presigned URLs accessible from browser | NFR-2.3 | Requires real MinIO + browser | Hit figure endpoint for >4MB figure, follow 307 redirect |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
