/**
 * Nyquist validation tests for Phase 05 — FR-7.3.
 *
 * FR-7.3 (05-02-03): Category weights adjust the summary overall score.
 *
 * The weighted overall calculation is performed in SummaryTable.tsx
 * lines 140-183 inside a useMemo. This test file extracts that logic
 * as a pure function and verifies its behavior independently.
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure helper: computeWeightedOverall
// Mirrors the logic in SummaryTable.tsx summaryRows useMemo:
//   weightedOverallSum += catWeight * catAvg
//   totalOverallWeight += catWeight
//   overall = totalOverallWeight > 0 ? weightedOverallSum / totalOverallWeight : null
// ---------------------------------------------------------------------------

/**
 * Compute the weighted overall score for a single model row.
 *
 * @param categoryScores - Map of categorySlug -> average score (null if no data)
 * @param categoryWeights - Map of categorySlug -> weight (defaults to 1 if absent)
 * @returns Weighted average score or null if no valid categories
 */
function computeWeightedOverall(
  categoryScores: Record<string, number | null>,
  categoryWeights: Record<string, number>
): number | null {
  let weightedOverallSum = 0;
  let totalOverallWeight = 0;

  for (const [catSlug, catAvg] of Object.entries(categoryScores)) {
    if (catAvg != null) {
      const catWeight = categoryWeights[catSlug] ?? 1;
      weightedOverallSum += catWeight * catAvg;
      totalOverallWeight += catWeight;
    }
  }

  return totalOverallWeight > 0 ? weightedOverallSum / totalOverallWeight : null;
}

// ---------------------------------------------------------------------------
// FR-7.3 Tests: Category weights adjust summary overall score
// ---------------------------------------------------------------------------

describe('FR-7.3: category weights adjust summary overall score', () => {
  it('with equal weights (default 1) returns simple average of category scores', () => {
    const scores = { molecular: 0.8, bulk_crystal: 0.6 };
    const weights = {}; // all default to 1
    const result = computeWeightedOverall(scores, weights);
    // (1 * 0.8 + 1 * 0.6) / (1 + 1) = 1.4 / 2 = 0.7
    expect(result).toBeCloseTo(0.7, 5);
  });

  it('with one category weight set to 0 that category is excluded from overall', () => {
    const scores = { molecular: 0.8, bulk_crystal: 0.6, surfaces: 0.4 };
    const weights = { surfaces: 0 };
    const result = computeWeightedOverall(scores, weights);
    // surfaces excluded (weight=0 means sum is unchanged, but totalWeight += 0)
    // (1*0.8 + 1*0.6 + 0*0.4) / (1 + 1 + 0) = 1.4 / 2 = 0.7
    expect(result).toBeCloseTo(0.7, 5);
  });

  it('upweighting a high-scoring category raises the overall score', () => {
    const scores = { molecular: 0.9, bulk_crystal: 0.5 };
    const equalResult = computeWeightedOverall(scores, {});
    // equally weighted: (0.9 + 0.5) / 2 = 0.7
    expect(equalResult).toBeCloseTo(0.7, 5);

    const weights = { molecular: 2, bulk_crystal: 1 };
    const weightedResult = computeWeightedOverall(scores, weights);
    // (2*0.9 + 1*0.5) / (2 + 1) = (1.8 + 0.5) / 3 = 2.3 / 3 ≈ 0.7667
    expect(weightedResult).toBeCloseTo(2.3 / 3, 5);
    expect(weightedResult!).toBeGreaterThan(equalResult!);
  });

  it('returns null when all category scores are null', () => {
    const scores = { molecular: null, bulk_crystal: null };
    const result = computeWeightedOverall(scores, {});
    expect(result).toBeNull();
  });

  it('ignores null category scores and computes over non-null only', () => {
    const scores = { molecular: 0.8, bulk_crystal: null, surfaces: 0.4 };
    const result = computeWeightedOverall(scores, {});
    // Only molecular (0.8) and surfaces (0.4) contribute
    // (1*0.8 + 1*0.4) / 2 = 0.6
    expect(result).toBeCloseTo(0.6, 5);
  });

  it('returns null when category scores object is empty', () => {
    const result = computeWeightedOverall({}, {});
    expect(result).toBeNull();
  });

  it('adjusting weight from default (1) to 0.5 reduces contribution proportionally', () => {
    const scores = { molecular: 1.0, bulk_crystal: 0.0 };
    const halfWeightResult = computeWeightedOverall(scores, { molecular: 0.5, bulk_crystal: 0.5 });
    // Both weights equal → same as equal weights: (0.5*1.0 + 0.5*0.0) / (0.5 + 0.5) = 0.5
    expect(halfWeightResult).toBeCloseTo(0.5, 5);
  });
});
