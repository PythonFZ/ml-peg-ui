---
phase: 4
slug: secondary-viewers
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.0.2 + httpx 0.27.0 |
| **Config file** | `pyproject.toml` → `[tool.pytest.ini_options]` |
| **Quick run command** | `uv run pytest tests/ -x -q` |
| **Full suite command** | `uv run pytest tests/ -v` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `uv run pytest tests/ -x -q`
- **After every plan wave:** Run `uv run pytest tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | FR-6.1, FR-6.2, FR-6.4 | unit | `uv run pytest tests/test_storage_get_bytes.py -x` | ✅ | ✅ green |
| 04-01-02 | 01 | 1 | FR-6.1 | unit | `uv run pytest tests/test_diatomics.py -x` | ✅ | ✅ green |
| 04-01-03 | 01 | 1 | FR-6.2 | unit | `uv run pytest tests/test_structures.py -x` | ✅ | ✅ green |
| 04-01-04 | 01 | 1 | FR-6.4 | unit | `uv run pytest tests/test_nebs.py -x` | ✅ | ✅ green |
| 04-02-01 | 02 | 2 | FR-6.1 | manual | — | — | ✅ manual |
| 04-03-01 | 03 | 2 | FR-6.2 | manual | — | — | ✅ manual |
| 04-04-01 | 04 | 2 | FR-6.4 | manual | — | — | ✅ manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. All 4 test files were created as part of Plan 01 (TDD approach).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Periodic table renders, disabled elements not clickable | FR-6.1 | Visual/interactive UI behavior | Open /diatomics, verify grayed elements are non-interactive |
| Multi-model curves overlay correctly in Plotly chart | FR-6.1 | Visual chart rendering | Select two elements, verify all model traces appear |
| 3D structure renders correctly with unit cell box | FR-6.2 | WebGL rendering requires visual confirmation | Open figure drawer for xyz benchmark, click View Structure |
| NEB animation plays through frames smoothly | FR-6.4 | Animation timing is subjective | Open /nebs/li_diffusion, select model, play animation |
| Energy chart highlights current frame during playback | FR-6.4 | Visual animation sync | Play NEB animation, verify red dot tracks current frame |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-12

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Test results:** 34 passed in 0.72s across 4 test files:
- `tests/test_diatomics.py` — 8 tests (FR-6.1 API)
- `tests/test_structures.py` — 7 tests (FR-6.2 API)
- `tests/test_nebs.py` — 9 tests (FR-6.4 API)
- `tests/test_storage_get_bytes.py` — 10 tests (storage + Pydantic models)
