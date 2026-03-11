/**
 * Format a number to a given number of significant figures.
 * Returns '--' (em-dash) for null, undefined, NaN, or Infinity values.
 */
export function formatSigFigs(value: number | null | undefined, sigFigs = 3): string {
  if (value == null || !isFinite(value)) return '\u2014'; // em-dash for missing values
  return value.toPrecision(sigFigs);
}
