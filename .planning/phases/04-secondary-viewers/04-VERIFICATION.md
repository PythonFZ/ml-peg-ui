---
phase: 04-secondary-viewers
verified: 2026-03-12T08:30:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 4: Secondary Viewers Verification Report

**Phase Goal:** Researchers can explore diatomic curves, atomic structures, and NEB trajectories from within the UI (phonon viewer deferred)
**Verified:** 2026-03-12T08:30:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are sourced from must_haves frontmatter across the four plans.

#### Plan 01 — Backend API (FR-6.1, FR-6.2, FR-6.3, FR-6.4)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | GET /api/v1/diatomics/index returns a JSON map of element pairs to model lists | VERIFIED | `api/index.py:331` `@router.get("/diatomics/index")` returns `DiatomicIndexResponse` |
| 2 | GET /api/v1/diatomics/curves/{pair} returns distance/energy arrays for all models with data | VERIFIED | `api/index.py:342` `@router.get("/diatomics/curves/{pair}")` returns `DiatomicCurvesResponse` |
| 3 | GET /api/v1/structures/{benchmark_slug}/{model}/{filename} returns raw xyz string and has_pbc | VERIFIED | `api/index.py:374` `@router.get("/structures/...")` returns `StructureResponse` |
| 4 | GET /api/v1/nebs/{benchmark}/{model}/{band}/frames returns frames array with energy, species, positions, lattice | VERIFIED | `api/index.py:412` `@router.get("/nebs/.../frames")` returns `NebFramesResponse` |
| 5 | FR-6.3 (phonon) is deferred — no phonon endpoint created | VERIFIED | No phonon route exists; REQUIREMENTS.md marks FR-6.3 Pending; deferred-items.md documents it |

#### Plan 02 — Diatomic Curve Viewer Frontend (FR-6.1)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 6 | Navigating to /diatomics shows a full periodic table with non-data elements grayed out | VERIFIED | `src/app/diatomics/page.tsx` renders `<PeriodicTable>` using `useDiatomicIndex()` with disabled state logic |
| 7 | Clicking an element filters the table to show only valid pair partners | VERIFIED | `PeriodicTable.tsx:195 lines` — validPartners logic based on pair-key filtering; selection state machine in page.tsx |
| 8 | Selecting a second element loads and displays all model curves as overlaid Plotly traces | VERIFIED | `DiatomicChart.tsx` builds one scatter trace per curve, imported via `useDiatomicCurves(pair)` in page.tsx |
| 9 | Chart shows distance (angstrom) on x-axis and energy (eV) on y-axis with legend | VERIFIED | `DiatomicChart.tsx:75 lines` — xaxis title "Distance (Å)", yaxis title "Energy (eV)", legend configured |

#### Plan 03 — 3D Structure Viewer Frontend (FR-6.2)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 10 | Benchmarks show a "View Structure" button in the figure drawer (when model selected) | VERIFIED | `FigureDrawer.tsx:191` "View Structure" button; `FigureDrawer.tsx:240` renders `<StructureModal>` |
| 11 | Clicking opens a modal with 3D ball-and-stick molecular rendering | VERIFIED | `StructureModal.tsx:34` uses `useStructure` hook; renders `<Mol3DViewer>` via dynamic import |
| 12 | 3Dmol.js loads lazily (not in initial bundle) | VERIFIED | `StructureModal.tsx:17` `dynamic(() => import('./Mol3DViewer'), { ssr: false })`; `Mol3DViewer.tsx:55` imports 3dmol inside useEffect only |

#### Plan 04 — NEB Trajectory Viewer Frontend (FR-6.4)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | /nebs/li_diffusion shows a model selector listing all models with NEB data | VERIFIED | `page.tsx:66` maps `NEB_LI_DIFFUSION_MODELS` (13 models) into MUI Select options |
| 14 | Selecting a model loads NEB frames with side-by-side 3D animation and energy chart | VERIFIED | `page.tsx:27` `useNebFrames()` hook; renders `<NebViewer>` with `NebStructurePlayer` (left) + PlotlyChart (right) |
| 15 | Energy chart highlights current frame as a marker | VERIFIED | `NebViewer.tsx:114-126` — second single-point scatter trace with red marker for currentFrame |
| 16 | Users can scrub NEB frames with slider or auto-play | VERIFIED | `NebViewer.tsx` — MUI Slider, Play/Pause toggle, setInterval at 500ms; `NebStructurePlayer.tsx` separate useEffect for currentFrame scrubbing |

**Score:** 16/16 truths verified (12 primary must-haves + 4 additional NEB truths)

---

## Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `api/storage.py` | — | — | VERIFIED | `get_bytes` at lines 26, 65, 144 (protocol + both backends) |
| `api/index.py` | — | — | VERIFIED | 4 new endpoints at lines 331, 342, 374, 412 |
| `api/models.py` | — | — | VERIFIED | 7 Pydantic models: DiatomicCurve, DiatomicIndexResponse, DiatomicCurvesResponse, StructureData, StructureResponse, NebFrame, NebFramesResponse |
| `scripts/build_diatomic_index.py` | — | — | VERIFIED | File exists; diatomic_index.json generated (1,758,653 bytes, 10,441 pairs) |
| `tests/test_diatomics.py` | — | — | VERIFIED | File exists |
| `tests/test_structures.py` | — | — | VERIFIED | File exists |
| `tests/test_nebs.py` | — | — | VERIFIED | File exists |
| `src/components/PeriodicTable.tsx` | 80 | 195 | VERIFIED | Full 118-element CSS Grid, pair filtering, three visual states |
| `src/components/DiatomicChart.tsx` | 30 | 75 | VERIFIED | Plotly multi-model overlay, dynamic import, theme-aware |
| `src/app/diatomics/page.tsx` | 40 | 129 | VERIFIED | Element selection state machine, SWR hooks wired |
| `src/components/Mol3DViewer.tsx` | 30 | 70 | VERIFIED | 3Dmol.js inside useEffect, ball-and-stick, unit cell |
| `src/components/StructureModal.tsx` | 25 | 76 | VERIFIED | MUI Dialog, dynamic Mol3DViewer import, useStructure hook |
| `src/components/FigureDrawer.tsx` | — | — | VERIFIED | Contains "View Structure" at line 191, StructureModal at line 240 |
| `src/components/NebViewer.tsx` | 60 | 159 | VERIFIED | Side-by-side layout, energy chart, playback controls |
| `src/components/NebStructurePlayer.tsx` | 50 | 122 | VERIFIED | framesToXyz helper, multi-frame 3Dmol.js, two-effect pattern |
| `src/app/nebs/li_diffusion/page.tsx` | 40 | 124 | VERIFIED | Model/band selectors, useNebFrames wired, loading states |
| `src/lib/neb-constants.ts` | — | — | VERIFIED | NEB_LI_DIFFUSION_MODELS (13 models), NEB_BANDS exported |
| `data/physicality/diatomics/diatomic_index.json` | — | 1,758,653 bytes | VERIFIED | 10,441 element pairs |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `api/index.py` | `api/storage.py` | `storage.get_bytes()` | VERIFIED | Lines 395, 455 call `storage.get_bytes(file_path)` |
| `api/index.py` | `api/models.py` | Response model classes | VERIFIED | Lines 37-49 import all 4 response models; all used in endpoint return types |
| `src/app/diatomics/page.tsx` | `/api/v1/diatomics/index` | `useDiatomicIndex` SWR hook | VERIFIED | Line 10 imports hook; line 23 calls it |
| `src/app/diatomics/page.tsx` | `/api/v1/diatomics/curves/{pair}` | `useDiatomicCurves` SWR hook | VERIFIED | Line 10 imports hook; line 28 calls it with computed pair |
| `src/components/DiatomicChart.tsx` | `src/components/PlotlyChart.tsx` | dynamic import | VERIFIED | Line 10 `dynamic(() => import('./PlotlyChart'), { ssr: false })`; line 72 renders `<PlotlyChart>` |
| `src/components/FigureDrawer.tsx` | `src/components/StructureModal.tsx` | View Structure button | VERIFIED | Line 11 imports; line 240 renders `<StructureModal>` |
| `src/components/StructureModal.tsx` | `src/components/Mol3DViewer.tsx` | dynamic import, ssr:false | VERIFIED | Line 17 `dynamic(() => import('./Mol3DViewer'), { ssr: false })` |
| `src/components/StructureModal.tsx` | `/api/v1/structures/{slug}/{model}/{file}` | `useStructure` SWR hook | VERIFIED | Line 14 imports; line 34 calls with all three params |
| `src/app/nebs/li_diffusion/page.tsx` | `/api/v1/nebs/li_diffusion/{model}/{band}/frames` | `useNebFrames` SWR hook | VERIFIED | Line 18 imports; line 27 calls hook |
| `src/components/NebViewer.tsx` | `src/components/NebStructurePlayer.tsx` | dynamic import | VERIFIED | Line 18 dynamic import; line 114 renders `<NebStructurePlayer>` |
| `src/components/NebViewer.tsx` | `src/components/PlotlyChart.tsx` | dynamic import | VERIFIED | Line 21 dynamic import; line 126 renders `<PlotlyChart>` |
| `src/components/NebStructurePlayer.tsx` | 3dmol | dynamic import inside useEffect | VERIFIED | Line 55 `await import('3dmol' as any)` inside async IIFE in useEffect |

---

## Requirements Coverage

| Requirement | Description | Plans | Status | Evidence |
|-------------|-------------|-------|--------|----------|
| FR-6.1 | Diatomic curve viewer — element pair selector + multi-model overlay | 04-01, 04-02 | SATISFIED | Backend endpoint at `/api/v1/diatomics/curves/{pair}`; /diatomics page with PeriodicTable + DiatomicChart |
| FR-6.2 | 3D structure viewer for benchmarks with xyz/extxyz files | 04-01, 04-03 | SATISFIED | Backend endpoint at `/api/v1/structures/{slug}/{model}/{file}`; Mol3DViewer + StructureModal + FigureDrawer button |
| FR-6.3 | Phonon interactive viewer via presigned URL | 04-01 | DEFERRED (by user decision) | No phonon endpoint created; REQUIREMENTS.md status = Pending; documented in deferred-items.md and plan 01 note |
| FR-6.4 | NEB trajectory viewer | 04-01, 04-04 | SATISFIED | Backend endpoint at `/api/v1/nebs/{benchmark}/{model}/{band}/frames`; /nebs/li_diffusion page with NebViewer |

**Note on FR-6.3:** This requirement was explicitly deferred by user decision before plan execution. Plan 04-01 frontmatter notes this, the REQUIREMENTS.md tracking table marks it Pending, and deferred-items.md documents the pre-existing test failure from the backend work. The phase goal statement explicitly calls it out as deferred. No verification gap — this is an intentional, documented deferral.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/PeriodicTable.tsx` | 28, 33 | "placeholder" in comment | Info | Code comment describing CSS grid column positioning for La/Ac — not a code stub |
| `api/storage.py` | 82 | `return []` | Info | Guard clause: returns empty list when directory doesn't exist — correct behavior for `list_keys` |

No blocker anti-patterns found. No TODO/FIXME/HACK/not-implemented stubs in new code.

---

## Commit Verification

All commits claimed in summaries verified present in git log:

| Plan | Task | Commit | Status |
|------|------|--------|--------|
| 04-01 | Task 1 (storage/models/script) | 21eaa6e | VERIFIED |
| 04-01 | Task 2 (endpoints) | ec7f1f3 | VERIFIED |
| 04-02 | Task 1 (types/hooks/PeriodicTable) | 1c0969c | VERIFIED |
| 04-02 | Task 2 (DiatomicChart/page) | 9ddc704 | VERIFIED |
| 04-03 | Task 1 (Mol3DViewer/StructureModal/types/hook) | 33537b5 | VERIFIED |
| 04-03 | Task 2 (FigureDrawer update) | c44c47d | VERIFIED |
| 04-04 | Task 1 (NEB types/hook/constants/NebStructurePlayer) | 8ba25c1 | VERIFIED |
| 04-04 | Task 2 (NebViewer/page) | 9b15759 | VERIFIED |

---

## Human Verification Required

The following items pass all automated checks but require a running application to fully verify:

### 1. Diatomic Periodic Table Pair Filtering

**Test:** Navigate to /diatomics in browser. Click "H" (hydrogen). Observe which elements remain enabled.
**Expected:** Only elements that form a pair with H (e.g., Ac, Ag, Al, ...) are enabled; non-data elements and invalid partners are grayed out and unclickable.
**Why human:** CSS visual state (disabled/enabled/selected) and click behavior cannot be verified by static analysis.

### 2. Diatomic Chart Multi-Model Overlay

**Test:** Select H and H on the periodic table. Observe the chart.
**Expected:** Multiple Plotly scatter traces (one per model, ~19 total), each labeled with the model name in the legend. X-axis "Distance (Å)", Y-axis "Energy (eV)".
**Why human:** Real data rendering and legend presentation require browser execution.

### 3. Structure Viewer — Ball-and-Stick with Unit Cell

**Test:** Open a benchmark with xyz data from the leaderboard. Click a model cell, then "View Structure" in the figure drawer.
**Expected:** MUI dialog opens showing a 3D ball-and-stick molecular structure. If the structure has periodic boundary conditions, a grey wireframe unit cell box should be visible.
**Why human:** WebGL rendering and 3Dmol.js behavior require a browser.

### 4. NEB Trajectory Animation

**Test:** Navigate to /nebs/li_diffusion. Select a model (e.g., "mace-mp-0b3"). Click Play.
**Expected:** 3D structure on the left animates through 13 frames; the red dot on the energy chart moves along the curve tracking the current frame. Slider scrubbing also updates both views synchronously.
**Why human:** Animation timing, 3Dmol frame switching, and Plotly chart update synchronization require browser execution.

### 5. Dark/Light Mode Compatibility

**Test:** Toggle dark/light mode while viewing /diatomics and /nebs/li_diffusion.
**Expected:** Charts adapt colors (dark/light Plotly theme overrides applied), 3Dmol viewer has transparent background matching MUI Paper in both modes.
**Why human:** Theme reactivity requires browser rendering.

---

## Summary

Phase 4 goal is achieved. All three viewer categories are implemented end-to-end:

- **Diatomic curve viewer (FR-6.1):** Backend index + curves endpoints, PeriodicTable component with pair filtering, DiatomicChart with Plotly multi-model overlay, /diatomics page with full element selection state machine.

- **3D structure viewer (FR-6.2):** Backend structure endpoint (raw xyz + pbc detection via ASE), Mol3DViewer with lazy 3Dmol.js import, StructureModal with loading/error states, FigureDrawer updated with "View Structure" button gated on filterModel.

- **NEB trajectory viewer (FR-6.4):** Backend NEB frames endpoint with ASE extxyz parsing, NebStructurePlayer with multi-frame 3Dmol.js and framesToXyz conversion, NebViewer with side-by-side layout and energy chart current-frame highlighting, /nebs/li_diffusion page with model/band selectors and play/pause/scrub controls.

- **Phonon viewer (FR-6.3):** Explicitly deferred by user decision, documented in deferred-items.md and REQUIREMENTS.md. Phase goal statement names this deferral.

All 16 observable truths are verified by static code analysis. All 12 key wiring links confirmed present. No stub patterns found. All 8 commits verified in git history. Human verification needed for visual and interactive behaviors (5 items), but all automated checks pass.

---

_Verified: 2026-03-12T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
