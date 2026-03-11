import { interpolateViridis } from 'd3-scale-chromatic';

/**
 * Normalize a raw metric value to [0, 1] where 1.0 = good.
 * Formula: (value - bad) / (good - bad), clamped to [0, 1].
 */
export function normalizeScore(value: number, good: number, bad: number): number {
  if (good === bad) return 0.5; // degenerate threshold — avoid division by zero
  const t = (value - bad) / (good - bad);
  return Math.max(0, Math.min(1, t));
}

/**
 * Return a CSS rgb() color from the viridis_r colormap.
 * viridis_r: normalizedScore=1 (good) → yellow (#fde725), normalizedScore=0 (bad) → purple (#440154)
 * d3 interpolateViridis: 0→purple, 1→yellow — so passing normalizedScore directly gives viridis_r behavior.
 */
export function viridisR(normalizedScore: number): string {
  const clamped = Math.max(0, Math.min(1, normalizedScore));
  return interpolateViridis(clamped);
}

/**
 * Determine text color for WCAG AA contrast on viridis background.
 * Viridis midpoint ~0.5 is teal (#21908c) — dark text works above ~0.4.
 */
export function textColorForViridis(normalizedScore: number): 'black' | 'white' {
  return normalizedScore > 0.4 ? 'black' : 'white';
}
