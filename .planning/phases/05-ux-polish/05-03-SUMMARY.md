---
phase: 05-ux-polish
plan: 03
subsystem: onboarding-and-discoverability
tags: [tutorial, faq, hover-cards, ux, onboarding]
dependency_graph:
  requires: [05-02]
  provides: [TutorialModal, FaqSection, ModelMetadata, hover-cards]
  affects: [AppHeader, LeaderboardTable, benchmark-page, home-page]
tech_stack:
  added: []
  patterns:
    - useTutorialModal hook with useEffect localStorage gate (no SSR mismatch)
    - MUI MobileStepper for multi-step tutorial wizard
    - MUI Accordion for FAQ section
    - Tooltip with rich JSX content for model hover cards
key_files:
  created:
    - src/components/TutorialModal.tsx
    - src/components/FaqSection.tsx
  modified:
    - src/lib/model-links.ts
    - src/components/LeaderboardTable.tsx
    - src/components/AppHeader.tsx
    - src/app/[category]/[benchmark]/page.tsx
    - src/app/page.tsx
decisions:
  - useTutorialModal reads localStorage only in useEffect — avoids SSR hydration mismatch (open initialized to false)
  - TutorialModal rendered inside AppBar — self-contained, no prop threading through layout
  - FaqSection placed in scrollable overflow:auto container on home page — required to appear below fixed-height SummaryTable
  - MODEL_METADATA exported alongside MODEL_LINKS in model-links.ts — co-location avoids sync issues
metrics:
  duration: 3min
  completed_date: "2026-03-12"
  tasks_completed: 2
  files_created: 2
  files_modified: 5
---

# Phase 05 Plan 03: Onboarding Tutorial, FAQ, and Model Hover Cards Summary

**One-liner:** 3-step localStorage-gated tutorial modal, 5-item MUI Accordion FAQ, and rich model metadata hover cards wired into AppHeader and both page layouts.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TutorialModal and FaqSection components | 726c15f | TutorialModal.tsx, FaqSection.tsx |
| 2 | Add model hover cards, wire tutorial + FAQ into pages | e8a9541 | model-links.ts, LeaderboardTable.tsx, AppHeader.tsx, benchmark/page.tsx, page.tsx |

## What Was Built

### TutorialModal (`src/components/TutorialModal.tsx`)
Multi-step welcome dialog with 3 steps:
1. Welcome to ML-PEG — explains scoring and viridis colormap
2. Explore the Data — explains cell-click figures and column header tooltips
3. Customize Weights — explains weight sliders and threshold editing

Uses MUI Dialog + MobileStepper (dots + Back/Next/Done). The `useTutorialModal` hook reads `localStorage.getItem('mlpeg_tutorial_seen')` inside `useEffect` only — `open` initializes to `false` to avoid SSR hydration mismatch. Dismissal writes the flag and closes; `reopen()` opens without clearing the flag.

### FaqSection (`src/components/FaqSection.tsx`)
5-item MUI Accordion FAQ covering:
1. What is ML-PEG?
2. How are scores calculated?
3. How do thresholds work?
4. How can I add my model?
5. What benchmarks are included?

### MODEL_METADATA (`src/lib/model-links.ts`)
Added `ModelMetadata` interface and `MODEL_METADATA` constant with architecture, params, and training data for all known models (MACE, ORB, MatterSim, UMA, SevenNet, CHGNet, M3GNet, eSEN, EquiformerV2, ALIGNN families).

### Model Hover Cards (`src/components/LeaderboardTable.tsx`)
MLIP column now wraps cell content in MUI `Tooltip` with rich JSX showing model architecture, parameter count, training data, and repository URL. `enterDelay={300}` prevents accidental triggers. Gracefully handles models missing from MODEL_METADATA.

### AppHeader Tutorial Button (`src/components/AppHeader.tsx`)
Added "Tutorial" button with help icon between the search autocompletes and the icon buttons. Uses `useTutorialModal` hook directly inside AppHeader — self-contained, no prop threading. `TutorialModal` rendered at end of AppBar JSX.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `bun run build` passes clean (4/4 static pages generated)
- TypeScript compiles without errors (`npx tsc --noEmit`)
- TutorialModal: 3-step dialog, localStorage gate, Back/Next/Done navigation
- Tutorial button in AppBar reopens modal on demand
- Model hover cards show architecture/params/training on hover (300ms delay)
- FaqSection renders below table on benchmark page and below SummaryTable on home page
- No SSR hydration errors (localStorage access gated in useEffect)

## Self-Check: PASSED

All created files verified on disk. Both task commits (726c15f, e8a9541) confirmed in git log.
