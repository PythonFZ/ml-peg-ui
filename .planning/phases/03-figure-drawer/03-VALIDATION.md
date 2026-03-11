---
phase: 3
slug: figure-drawer
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 03-01-01 | 01 | 1 | FR-3.1 | unit | `uv run pytest tests/test_api.py::test_benchmark_figures_index -x` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FR-3.1 | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_json -x` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | FR-3.4 | unit | `uv run pytest tests/test_api.py::test_benchmark_figure_redirect -x` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | FR-3.1 | manual | N/A — cell click opens drawer | N/A | ⬜ pending |
| 03-02-02 | 02 | 2 | FR-3.2 | manual | N/A — browser devtools check | N/A | ⬜ pending |
| 03-02-03 | 02 | 2 | FR-3.3 | manual | N/A — visual confirmation | N/A | ⬜ pending |
| 03-02-04 | 02 | 2 | NFR-1.4 | manual | N/A — browser network tab | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_api.py` — add `test_benchmark_figures_index`, `test_benchmark_figure_json`, `test_benchmark_figure_redirect` (extend existing file)
- [ ] No new test files needed — extend `tests/test_api.py` with figure-specific tests
- [ ] `tests/conftest.py` already exists; no new fixtures needed for API tests

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
