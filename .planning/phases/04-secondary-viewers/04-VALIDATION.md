---
phase: 4
slug: secondary-viewers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.0.0 + httpx 0.27.0 |
| **Config file** | `pyproject.toml` → `[tool.pytest.ini_options]` |
| **Quick run command** | `uv run pytest tests/ -x -q` |
| **Full suite command** | `uv run pytest tests/ -v` |
| **Estimated runtime** | ~10 seconds |

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
| 04-01-01 | 01 | 1 | FR-6.1 | unit | `uv run pytest tests/test_diatomics.py::test_diatomic_index -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | FR-6.1 | unit | `uv run pytest tests/test_diatomics.py::test_diatomic_curves -x` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | FR-6.2 | unit | `uv run pytest tests/test_structures.py::test_structure_endpoint -x` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 1 | FR-6.4 | unit | `uv run pytest tests/test_nebs.py::test_neb_frames_count -x` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 1 | FR-6.4 | unit | `uv run pytest tests/test_nebs.py::test_neb_frame_schema -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/test_diatomics.py` — stubs for FR-6.1 API endpoints (index + curves)
- [ ] `tests/test_structures.py` — stubs for FR-6.2 structure endpoint
- [ ] `tests/test_nebs.py` — stubs for FR-6.4 NEB frames endpoint
- [ ] ASE install: `uv add ase` — required before extxyz parsing tests

*These test files must be created as part of Wave 0 before implementation begins.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Periodic table renders, disabled elements not clickable | FR-6.1 | Visual/interactive UI behavior | Open /diatomics, verify grayed elements are non-interactive |
| 3D structure renders correctly with unit cell box | FR-6.2 | WebGL rendering requires visual confirmation | Open figure drawer for xyz benchmark, click View Structure |
| NEB animation plays through frames smoothly | FR-6.4 | Animation timing is subjective | Open /nebs/li_diffusion, select model, play animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
