---
phase: 3
slug: figure-drawer
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `pyproject.toml` (`[tool.pytest.ini_options]`) |
| **Quick run command** | `uv run pytest tests/test_api.py -x -q` |
| **Full suite command** | `uv run pytest -x -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `uv run pytest tests/test_api.py -x -q`
- **After every plan wave:** Run `uv run pytest -x -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FR-3.1 | unit | `uv run pytest tests/test_api.py::test_benchmark_figures_index -x` | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | FR-3.1 | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_json -x` | ✅ | ✅ green |
| 03-01-03 | 01 | 1 | FR-3.4 | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_redirect_large_file -x` | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | FR-3.1 | manual | N/A — cell click opens drawer | N/A | ✅ verified |
| 03-02-02 | 02 | 2 | FR-3.2 | manual | N/A — browser devtools check | N/A | ✅ verified |
| 03-02-03 | 02 | 2 | FR-3.3 | manual | N/A — visual confirmation | N/A | ✅ verified |
| 03-02-04 | 02 | 2 | NFR-1.4 | manual | N/A — browser network tab | N/A | ✅ verified |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/test_api.py` — `test_benchmark_figures_index`, `test_benchmark_figure_json` exist and pass
- [x] No new test files needed — `tests/test_api.py` extended with figure-specific tests
- [x] `tests/conftest.py` already exists; no new fixtures needed for API tests

*Existing infrastructure covers framework installation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cell click opens MUI Drawer with figure | FR-3.1 | UI interaction — requires browser | Click any data cell in leaderboard, verify drawer slides open with Plotly chart |
| Plotly bundle lazy-loaded | FR-3.2 | Network behavior — requires devtools | Open Network tab, load page, verify no plotly.js; click cell, verify plotly.js loads |
| scatter/scattergl figures render | FR-3.3 | Visual correctness | Open drawer for density, violin, parity, confusion matrix figures; verify rendering |
| Plotly loaded once | NFR-1.4 | Network behavior — requires devtools | Open drawer, close, reopen — verify no second plotly.js fetch in Network tab |
| Dark/light mode rendering | SC-5 | Visual correctness | Toggle theme, verify chart colors adapt |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or manual-only justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all automatable references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated (full)

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

**Resolved:** `test_benchmark_figure_redirect_large_file` (FR-3.4) — automated test added using `monkeypatch` to patch `storage.get_object_size` (returns 5 MB) and `storage.presigned_url` (returns known URL). Test verifies 307 status and correct `Location` header without requiring real large files or MinIO.
