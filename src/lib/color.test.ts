import { describe, it, expect } from 'vitest';
import { normalizeScore, viridisR, textColorForViridis } from './color';

describe('normalizeScore', () => {
  it('returns 1.0 when value equals good threshold', () => {
    const result = normalizeScore(10, 10, 0);
    expect(result).toBe(1.0);
  });

  it('returns 0.0 when value equals bad threshold', () => {
    const result = normalizeScore(0, 10, 0);
    expect(result).toBe(0.0);
  });

  it('returns value between 0 and 1 for midpoint', () => {
    const result = normalizeScore(5, 10, 0);
    expect(result).toBeCloseTo(0.5, 5);
  });

  it('clamps to 1.0 when value exceeds good threshold', () => {
    const result = normalizeScore(15, 10, 0);
    expect(result).toBe(1.0);
  });

  it('clamps to 0.0 when value is below bad threshold', () => {
    const result = normalizeScore(-5, 10, 0);
    expect(result).toBe(0.0);
  });

  it('returns 0.5 when good equals bad (degenerate threshold)', () => {
    const result = normalizeScore(5, 5, 5);
    expect(result).toBe(0.5);
  });

  it('handles inverted thresholds where bad > good', () => {
    // good=0, bad=10 (lower is better, e.g. error metric)
    // value=3: (3-10)/(0-10) = -7/-10 = 0.7
    const result = normalizeScore(3, 0, 10);
    expect(result).toBeCloseTo(0.7, 5);
  });
});

describe('viridisR', () => {
  it('returns a CSS color string (hex or rgb format from d3)', () => {
    const result = viridisR(0.5);
    // d3 interpolateViridis returns hex strings like '#21918c'
    expect(result).toMatch(/^#[0-9a-f]{6}$|^rgb/i);
  });

  it('returns a color for normalizedScore=0 (bad → purple)', () => {
    const result = viridisR(0);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns a color for normalizedScore=1 (good → yellow)', () => {
    const result = viridisR(1);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns different colors for score=0 and score=1', () => {
    const bad = viridisR(0);
    const good = viridisR(1);
    expect(bad).not.toBe(good);
  });

  it('clamps out-of-range scores below 0 to same as 0', () => {
    const clamped = viridisR(-0.5);
    const zero = viridisR(0);
    expect(clamped).toBe(zero);
  });

  it('clamps out-of-range scores above 1 to same as 1', () => {
    const clamped = viridisR(1.5);
    const one = viridisR(1);
    expect(clamped).toBe(one);
  });
});

describe('textColorForViridis (NFR-4.2 WCAG contrast)', () => {
  it('returns white for dark viridis backgrounds (score < 0.4)', () => {
    const result = textColorForViridis(0.2);
    expect(result).toBe('white');
  });

  it('returns white exactly at score = 0', () => {
    const result = textColorForViridis(0);
    expect(result).toBe('white');
  });

  it('returns black for light viridis backgrounds (score > 0.4)', () => {
    const result = textColorForViridis(0.6);
    expect(result).toBe('black');
  });

  it('returns black exactly at score = 1', () => {
    const result = textColorForViridis(1);
    expect(result).toBe('black');
  });

  it('uses 0.4 as the threshold boundary — score exactly 0.4 returns white', () => {
    // "normalizedScore > 0.4" means 0.4 itself falls to white
    const result = textColorForViridis(0.4);
    expect(result).toBe('white');
  });

  it('score just above 0.4 returns black', () => {
    const result = textColorForViridis(0.401);
    expect(result).toBe('black');
  });
});
