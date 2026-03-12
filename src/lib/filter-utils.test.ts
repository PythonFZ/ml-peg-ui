/**
 * Nyquist validation tests for Phase 05 filtering requirements.
 *
 * These tests verify the pure behavioral logic described in:
 *   - FR-2.1 (05-01-01): model filter narrows leaderboard rows
 *   - FR-2.2 (05-01-02): benchmark search generates correct option objects
 *   - FR-2.3 (05-01-03): column filter computes correct columnVisibilityModel
 *   - FR-7.1 (05-02-01): weight/threshold overrides merge correctly with API defaults
 *
 * The logic under test is extracted verbatim from the implementation in
 * src/app/[category]/[benchmark]/page.tsx and src/components/AppHeader.tsx.
 * These helpers are defined locally here because the implementation embeds
 * the logic inline inside React components (read-only).
 */

import { describe, it, expect } from 'vitest';
import type { MetricsRow, Category, ColumnDescriptor, BenchmarkMeta, Threshold } from './types';

// ---------------------------------------------------------------------------
// FR-2.1 helpers (verbatim from page.tsx lines 58-64)
// ---------------------------------------------------------------------------

function filterRowsByModels(rows: MetricsRow[], selectedModels: string[]): MetricsRow[] {
  return selectedModels.length > 0
    ? rows.filter((row) => selectedModels.includes(row.MLIP as string))
    : rows;
}

// ---------------------------------------------------------------------------
// FR-2.2 helpers (verbatim from AppHeader.tsx benchmarkOptions computation)
// ---------------------------------------------------------------------------

interface BenchmarkOption {
  label: string;
  href: string;
}

function buildBenchmarkOptions(categories: Category[]): BenchmarkOption[] {
  return categories.flatMap((cat) =>
    cat.benchmarks.map((b) => ({
      label: b.name,
      href: `/${cat.slug}/${b.slug}`,
    }))
  );
}

// ---------------------------------------------------------------------------
// FR-2.3 helpers (verbatim from page.tsx lines 136-143)
// ---------------------------------------------------------------------------

function computeColumnVisibility(
  colFilter: string,
  columns: ColumnDescriptor[]
): Record<string, boolean> {
  if (!colFilter.trim()) return {};
  return Object.fromEntries(
    columns
      .filter((col) => col.id !== 'MLIP' && col.id !== 'Score' && col.id !== 'id')
      .map((col) => [col.id, col.name.toLowerCase().includes(colFilter.toLowerCase())])
  );
}

// ---------------------------------------------------------------------------
// FR-7.1 helpers (verbatim from page.tsx lines 76-94)
// ---------------------------------------------------------------------------

function mergeWeights(
  meta: BenchmarkMeta,
  weightOverrides: Record<string, number>
): Record<string, number> {
  return Object.fromEntries(
    meta.columns
      .filter((c) => c.id !== 'MLIP' && c.id !== 'Score' && c.id !== 'id')
      .map((c) => [c.id, weightOverrides[c.id] ?? meta.weights[c.id] ?? 1])
  );
}

function mergeThresholds(
  meta: BenchmarkMeta,
  thresholdOverrides: Record<string, Threshold>
): Record<string, Threshold> {
  return Object.fromEntries(
    meta.columns
      .filter((c) => c.id !== 'MLIP' && c.id !== 'Score' && c.id !== 'id')
      .map((c) => [c.id, thresholdOverrides[c.id] ?? meta.thresholds[c.id]])
      .filter(([, t]) => t != null)
  );
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const sampleRows: MetricsRow[] = [
  { id: 'model-a', MLIP: 'MACE-MP-0', Score: 0.9, mae: 0.1 },
  { id: 'model-b', MLIP: 'ORB-v2', Score: 0.7, mae: 0.3 },
  { id: 'model-c', MLIP: 'SevenNet', Score: 0.5, mae: 0.5 },
];

const sampleCategories: Category[] = [
  {
    slug: 'molecular',
    name: 'Molecular',
    benchmarks: [
      { slug: 'conformers', name: 'Conformers' },
      { slug: 'isomers', name: 'Isomers' },
    ],
  },
  {
    slug: 'bulk_crystal',
    name: 'Bulk Crystal',
    benchmarks: [
      { slug: 'lattice', name: 'Lattice Constants' },
    ],
  },
];

const sampleColumns: ColumnDescriptor[] = [
  { id: 'MLIP', name: 'MLIP' },
  { id: 'Score', name: 'Score' },
  { id: 'mae', name: 'MAE' },
  { id: 'rmse', name: 'RMSE' },
  { id: 'force_mae', name: 'Force MAE' },
];

const sampleMeta: BenchmarkMeta = {
  count: 3,
  columns: sampleColumns,
  thresholds: {
    mae: { good: 0.0, bad: 1.0 },
    rmse: { good: 0.0, bad: 2.0 },
    force_mae: { good: 0.0, bad: 5.0 },
  },
  weights: {
    mae: 1.0,
    rmse: 0.5,
    force_mae: 0.8,
  },
  tooltip_header: {},
};

// ---------------------------------------------------------------------------
// FR-2.1: Model filter narrows leaderboard rows
// ---------------------------------------------------------------------------

describe('FR-2.1: model filter narrows leaderboard rows', () => {
  it('returns all rows when no models are selected', () => {
    const result = filterRowsByModels(sampleRows, []);
    expect(result).toHaveLength(3);
    expect(result).toEqual(sampleRows);
  });

  it('returns only matching rows when a single model is selected', () => {
    const result = filterRowsByModels(sampleRows, ['MACE-MP-0']);
    expect(result).toHaveLength(1);
    expect(result[0].MLIP).toBe('MACE-MP-0');
  });

  it('returns rows for multiple selected models simultaneously', () => {
    const result = filterRowsByModels(sampleRows, ['MACE-MP-0', 'ORB-v2']);
    expect(result).toHaveLength(2);
    const mlips = result.map((r) => r.MLIP);
    expect(mlips).toContain('MACE-MP-0');
    expect(mlips).toContain('ORB-v2');
  });

  it('returns empty array when selected model is not in data', () => {
    const result = filterRowsByModels(sampleRows, ['NonExistentModel']);
    expect(result).toHaveLength(0);
  });

  it('uses exact MLIP display name for matching (case-sensitive)', () => {
    // 'mace-mp-0' (lowercase) should NOT match 'MACE-MP-0'
    const result = filterRowsByModels(sampleRows, ['mace-mp-0']);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// FR-2.2: Benchmark search generates correct option objects
// ---------------------------------------------------------------------------

describe('FR-2.2: benchmark search generates correct option objects', () => {
  it('generates one option per benchmark across all categories', () => {
    const options = buildBenchmarkOptions(sampleCategories);
    // molecular: 2 benchmarks + bulk_crystal: 1 benchmark = 3 total
    expect(options).toHaveLength(3);
  });

  it('each option has label equal to benchmark name', () => {
    const options = buildBenchmarkOptions(sampleCategories);
    const labels = options.map((o) => o.label);
    expect(labels).toContain('Conformers');
    expect(labels).toContain('Isomers');
    expect(labels).toContain('Lattice Constants');
  });

  it('each option href is /{categorySlug}/{benchmarkSlug}', () => {
    const options = buildBenchmarkOptions(sampleCategories);
    const hrefs = options.map((o) => o.href);
    expect(hrefs).toContain('/molecular/conformers');
    expect(hrefs).toContain('/molecular/isomers');
    expect(hrefs).toContain('/bulk_crystal/lattice');
  });

  it('returns empty array when categories list is empty', () => {
    const options = buildBenchmarkOptions([]);
    expect(options).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// FR-2.3: Column filter computes correct columnVisibilityModel
// ---------------------------------------------------------------------------

describe('FR-2.3: column filter computes correct columnVisibilityModel', () => {
  it('returns empty object when filter is empty (all columns visible)', () => {
    const result = computeColumnVisibility('', sampleColumns);
    expect(result).toEqual({});
  });

  it('returns empty object when filter is whitespace only', () => {
    const result = computeColumnVisibility('   ', sampleColumns);
    expect(result).toEqual({});
  });

  it('shows only matching metric columns when filter matches a substring', () => {
    // 'mae' matches 'MAE' and 'Force MAE' but not 'RMSE'
    const result = computeColumnVisibility('mae', sampleColumns);
    expect(result['mae']).toBe(true);
    expect(result['force_mae']).toBe(true);
    expect(result['rmse']).toBe(false);
  });

  it('MLIP and Score columns are always excluded from the visibility model', () => {
    const result = computeColumnVisibility('anything', sampleColumns);
    // MLIP and Score must not appear in the visibility model entries
    expect('MLIP' in result).toBe(false);
    expect('Score' in result).toBe(false);
  });

  it('matching is case-insensitive', () => {
    const lowerResult = computeColumnVisibility('mae', sampleColumns);
    const upperResult = computeColumnVisibility('MAE', sampleColumns);
    expect(lowerResult).toEqual(upperResult);
  });

  it('returns false for all metric columns when filter matches nothing', () => {
    const result = computeColumnVisibility('zzznomatch', sampleColumns);
    expect(result['mae']).toBe(false);
    expect(result['rmse']).toBe(false);
    expect(result['force_mae']).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FR-7.1: Weight and threshold overrides merge correctly with API defaults
// ---------------------------------------------------------------------------

describe('FR-7.1: weight overrides merge correctly with API defaults', () => {
  it('returns API default weights when no overrides provided', () => {
    const result = mergeWeights(sampleMeta, {});
    expect(result['mae']).toBe(1.0);
    expect(result['rmse']).toBe(0.5);
    expect(result['force_mae']).toBe(0.8);
  });

  it('override replaces API default for the specified metric', () => {
    const result = mergeWeights(sampleMeta, { mae: 0.25 });
    expect(result['mae']).toBe(0.25);
    // Unoverridden metrics keep their API defaults
    expect(result['rmse']).toBe(0.5);
    expect(result['force_mae']).toBe(0.8);
  });

  it('multiple overrides applied simultaneously', () => {
    const result = mergeWeights(sampleMeta, { mae: 0.0, force_mae: 0.5 });
    expect(result['mae']).toBe(0.0);
    expect(result['force_mae']).toBe(0.5);
    expect(result['rmse']).toBe(0.5); // unchanged
  });

  it('MLIP and Score columns are excluded from merged weights', () => {
    const result = mergeWeights(sampleMeta, {});
    expect('MLIP' in result).toBe(false);
    expect('Score' in result).toBe(false);
  });
});

describe('FR-7.1: threshold overrides merge correctly with API defaults', () => {
  it('returns API default thresholds when no overrides provided', () => {
    const result = mergeThresholds(sampleMeta, {});
    expect(result['mae']).toEqual({ good: 0.0, bad: 1.0 });
    expect(result['rmse']).toEqual({ good: 0.0, bad: 2.0 });
  });

  it('override replaces API default threshold for the specified metric', () => {
    const override: Threshold = { good: 0.1, bad: 0.5 };
    const result = mergeThresholds(sampleMeta, { mae: override });
    expect(result['mae']).toEqual(override);
    // Unoverridden metrics keep their API defaults
    expect(result['rmse']).toEqual({ good: 0.0, bad: 2.0 });
  });

  it('MLIP and Score columns excluded from merged thresholds', () => {
    const result = mergeThresholds(sampleMeta, {});
    expect('MLIP' in result).toBe(false);
    expect('Score' in result).toBe(false);
  });

  it('metrics with no threshold entry are excluded from result', () => {
    const metaNoForce: BenchmarkMeta = {
      ...sampleMeta,
      thresholds: { mae: { good: 0.0, bad: 1.0 } },
    };
    const result = mergeThresholds(metaNoForce, {});
    // rmse and force_mae have no threshold in this meta, should be absent
    expect('rmse' in result).toBe(false);
    expect('force_mae' in result).toBe(false);
  });
});
