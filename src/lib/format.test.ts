import { describe, it, expect } from 'vitest';
import { formatSigFigs } from './format';

describe('formatSigFigs', () => {
  it('formats a positive number to 3 significant figures by default', () => {
    const result = formatSigFigs(1.23456);
    expect(result).toBe('1.23');
  });

  it('formats a number to the specified number of significant figures', () => {
    const result = formatSigFigs(1.23456, 5);
    expect(result).toBe('1.2346');
  });

  it('returns em-dash for null', () => {
    const result = formatSigFigs(null);
    expect(result).toBe('\u2014');
  });

  it('returns em-dash for undefined', () => {
    const result = formatSigFigs(undefined);
    expect(result).toBe('\u2014');
  });

  it('returns em-dash for NaN', () => {
    const result = formatSigFigs(NaN);
    expect(result).toBe('\u2014');
  });

  it('returns em-dash for positive Infinity', () => {
    const result = formatSigFigs(Infinity);
    expect(result).toBe('\u2014');
  });

  it('returns em-dash for negative Infinity', () => {
    const result = formatSigFigs(-Infinity);
    expect(result).toBe('\u2014');
  });

  it('formats zero correctly', () => {
    const result = formatSigFigs(0);
    expect(result).toBe('0.00');
  });

  it('formats a very small number to 3 sig figs', () => {
    const result = formatSigFigs(0.000123456);
    expect(result).toBe('0.000123');
  });
});
