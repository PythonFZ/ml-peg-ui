import { describe, it, expect } from 'vitest';
import { computeScore } from './score-calc';
import type { BenchmarkMeta, MetricsRow } from './types';

function makeMeta(overrides: Partial<BenchmarkMeta> = {}): BenchmarkMeta {
  return {
    count: 2,
    columns: [
      { id: 'MLIP', name: 'MLIP' },
      { id: 'Score', name: 'Score' },
      { id: 'metric_a', name: 'Metric A' },
      { id: 'metric_b', name: 'Metric B' },
    ],
    thresholds: {
      metric_a: { good: 1.0, bad: 0.0 },
      metric_b: { good: 1.0, bad: 0.0 },
    },
    weights: {
      metric_a: 1,
      metric_b: 1,
    },
    tooltip_header: {},
    ...overrides,
  };
}

function makeRow(values: Record<string, number | null>): MetricsRow {
  return {
    id: 'model1',
    MLIP: 'Model 1',
    Score: 0,
    ...values,
  };
}

describe('computeScore', () => {
  it('with equal weights returns average of normalized values', () => {
    const meta = makeMeta();
    // metric_a = 0.8 → normalized = 0.8, metric_b = 0.4 → normalized = 0.4
    // average = (0.8 + 0.4) / 2 = 0.6
    const row = makeRow({ metric_a: 0.8, metric_b: 0.4 });
    const result = computeScore(row, meta);
    expect(result).toBeCloseTo(0.6, 5);
  });

  it('with weight=0 excludes that metric from calculation', () => {
    const meta = makeMeta();
    // metric_b weight is 0, only metric_a contributes
    const row = makeRow({ metric_a: 0.8, metric_b: 0.2 });
    const result = computeScore(row, meta, { metric_b: 0 });
    // Should return only metric_a normalized = 0.8
    expect(result).toBeCloseTo(0.8, 5);
  });

  it('with overridden thresholds uses overrides instead of meta defaults', () => {
    const meta = makeMeta();
    const row = makeRow({ metric_a: 0.5, metric_b: 0.5 });
    // Override metric_a threshold: good=1, bad=0.5 → value=0.5 normalizes to 0.0
    const result = computeScore(row, meta, {}, { metric_a: { good: 1.0, bad: 0.5 } });
    // metric_a normalized = (0.5 - 0.5) / (1.0 - 0.5) = 0.0
    // metric_b normalized = (0.5 - 0.0) / (1.0 - 0.0) = 0.5
    // average = (0.0 + 0.5) / 2 = 0.25
    expect(result).toBeCloseTo(0.25, 5);
  });

  it('with all null values returns null', () => {
    const meta = makeMeta();
    const row = makeRow({ metric_a: null, metric_b: null });
    const result = computeScore(row, meta);
    expect(result).toBeNull();
  });

  it('with mixed null/number values only counts non-null metrics', () => {
    const meta = makeMeta();
    // metric_a is null, only metric_b contributes
    const row = makeRow({ metric_a: null, metric_b: 0.6 });
    const result = computeScore(row, meta);
    // Only metric_b = 0.6 normalized = 0.6
    expect(result).toBeCloseTo(0.6, 5);
  });
});
