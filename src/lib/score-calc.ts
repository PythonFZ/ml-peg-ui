import { normalizeScore } from './color';
import type { MetricsRow, BenchmarkMeta, Threshold } from './types';

export type WeightOverrides = Record<string, number>;
export type ThresholdOverrides = Record<string, Threshold>;

/**
 * Compute a weighted average score for a single row.
 * Uses normalizeScore to convert each metric value to [0, 1], then computes a
 * weighted average. Metrics with weight === 0 or missing thresholds are excluded.
 * Returns null when there are no valid metric values to average.
 */
export function computeScore(
  row: MetricsRow,
  meta: BenchmarkMeta,
  weightOverrides: WeightOverrides = {},
  thresholdOverrides: ThresholdOverrides = {}
): number | null {
  const metricCols = meta.columns.filter(
    (col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id'
  );
  let weightedSum = 0;
  let totalWeight = 0;
  for (const col of metricCols) {
    const value = row[col.id];
    if (value == null || typeof value !== 'number') continue;
    const weight = weightOverrides[col.id] ?? meta.weights[col.id] ?? 1;
    const threshold = thresholdOverrides[col.id] ?? meta.thresholds[col.id];
    if (!threshold || weight === 0) continue;
    const norm = normalizeScore(value, threshold.good, threshold.bad);
    weightedSum += weight * norm;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}
