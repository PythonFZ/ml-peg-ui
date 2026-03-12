---
phase: 5
slug: ux-polish
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
updated: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | none (no vitest.config; runs from project root) |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && bun run build` |
| **Estimated runtime** | ~1 second (vitest) + ~15 seconds (build) |

---

## Sampling Rate

- **After every task commit:** Run `bun run build`
- **After every plan wave:** Run `bun run build` + manual browser smoke test
- **Before `/gsd:verify-work`:** Full suite must be green + all 6 success criteria verified in running app
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | FR-2.1 | unit | `npx vitest run src/lib/filter-utils.test.ts` | ✅ | ✅ green |
| 05-01-02 | 01 | 1 | FR-2.2 | unit | `npx vitest run src/lib/filter-utils.test.ts` | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | FR-2.3 | unit | `npx vitest run src/lib/filter-utils.test.ts` | ✅ | ✅ green |
| 05-02-01 | 02 | 1 | FR-7.1 | unit | `npx vitest run src/lib/filter-utils.test.ts` | ✅ | ✅ green |
| 05-02-02 | 02 | 1 | FR-7.2 | unit (score-calc) | `npx vitest run src/lib/score-calc.test.ts` | ✅ | ✅ green |
| 05-02-03 | 02 | 1 | FR-7.3 | unit | `npx vitest run src/lib/summary-calc.test.ts` | ✅ | ✅ green |
| 05-03-01 | 03 | 3 | FR-2.1, FR-7.1 | unit | `npx vitest run src/lib/tutorial-storage.test.ts` | ✅ | ✅ green |
| 05-03-02 | 03 | 3 | FR-2.1, FR-7.1 | manual + build | `bun run build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. `bun run build` provides TypeScript type checking. All FR-2.x and FR-7.x requirements are UI-behavioral and best verified by manual execution against the running app.

Optional: `bun add -D vitest` for unit testing `score-calc.ts` pure functions.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Model filter narrows leaderboard rows | FR-2.1 | UI interaction in DataGrid | Type model name in AppBar filter → verify rows narrow to matching models; select multiple → verify all selected shown |
| Benchmark search navigates to tab | FR-2.2 | Navigation behavior | Type benchmark name in AppBar search → select → verify correct benchmark page loads |
| Column filter hides non-matching columns | FR-2.3 | DataGrid column visibility | Type metric name in column filter → verify non-matching columns hide; MLIP/Score always visible |
| Weight sliders adjust metric weights | FR-7.1 | Slider interaction | Move vertical slider → verify value display updates |
| Score recalculates without server round-trip | FR-7.2 | Client-side computation | Move weight slider → verify Score column updates immediately; check Network tab shows no requests |
| Category weights reorder summary | FR-7.3 | Summary table interaction | Move category weight slider → verify model order changes by adjusted composite score |

---

## Validation Sign-Off

- [x] All tasks have automated verify command
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete — 78/78 tests passing (npx vitest run)

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 6 |
| Resolved | 6 |
| Escalated | 0 |

Test files added:
- `src/lib/filter-utils.test.ts` (23 tests) — FR-2.1, FR-2.2, FR-2.3, FR-7.1
- `src/lib/summary-calc.test.ts` (7 tests) — FR-7.3
- `src/lib/tutorial-storage.test.ts` (7 tests) — FR-2.1/FR-7.1 tutorial gate
