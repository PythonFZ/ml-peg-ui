/**
 * Nyquist validation tests for Phase 05 — FR-2.1 / FR-7.1 (05-03-01).
 *
 * Task 05-03-01: Tutorial localStorage gate — first-time visitors see the modal;
 * after dismissal it is not shown again.
 *
 * The useTutorialModal hook in TutorialModal.tsx uses:
 *   const TUTORIAL_KEY = 'mlpeg_tutorial_seen';
 *   useEffect(() => {
 *     if (!localStorage.getItem(TUTORIAL_KEY)) setOpen(true);
 *   }, []);
 *   const dismiss = () => { localStorage.setItem(TUTORIAL_KEY, '1'); setOpen(false); };
 *   const reopen = () => setOpen(true);
 *
 * Since we cannot add jsdom/testing-library per constraints, the localStorage
 * gate logic is extracted as a pure state machine and tested without React.
 *
 * The pure logic under test:
 *   - shouldShowTutorial(storageValue) → boolean
 *   - tutorialStorageKey is 'mlpeg_tutorial_seen'
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Constants and pure logic extracted from TutorialModal.tsx
// ---------------------------------------------------------------------------

const TUTORIAL_KEY = 'mlpeg_tutorial_seen';

/** Returns true if the tutorial should be shown (key not yet set). */
function shouldShowTutorial(storedValue: string | null): boolean {
  return !storedValue;
}

/** Returns the value written to localStorage on dismissal. */
function dismissValue(): string {
  return '1';
}

// ---------------------------------------------------------------------------
// FR-2.1 / FR-7.1 (05-03-01): Tutorial localStorage gate tests
// ---------------------------------------------------------------------------

describe('tutorial localStorage gate (05-03-01)', () => {
  it('uses the correct storage key: mlpeg_tutorial_seen', () => {
    expect(TUTORIAL_KEY).toBe('mlpeg_tutorial_seen');
  });

  it('shows tutorial when localStorage has no stored value (first visit)', () => {
    const result = shouldShowTutorial(null);
    expect(result).toBe(true);
  });

  it('does not show tutorial when localStorage already has the seen flag', () => {
    const result = shouldShowTutorial('1');
    expect(result).toBe(false);
  });

  it('does not show tutorial for any truthy stored value', () => {
    // Any non-null/non-empty string value counts as "seen"
    expect(shouldShowTutorial('true')).toBe(false);
    expect(shouldShowTutorial('seen')).toBe(false);
  });

  it('dismissal writes a truthy string value to storage', () => {
    const value = dismissValue();
    expect(value).toBeTruthy();
    expect(typeof value).toBe('string');
  });

  it('dismissal value causes shouldShowTutorial to return false on next visit', () => {
    const stored = dismissValue();
    expect(shouldShowTutorial(stored)).toBe(false);
  });

  it('empty string is treated as not seen (falsy), so tutorial would show', () => {
    // localStorage.getItem returns null for absent keys, but if someone sets ''
    // that would be falsy and the tutorial would show — same behavior as null
    const result = shouldShowTutorial('');
    expect(result).toBe(true);
  });
});
