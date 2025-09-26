import { describe, it, expect } from 'vitest';
import { formatCurrency, formatNumber, calculateToAmount } from '../lib/utils.js';

describe('formatCurrency', () => {
  it('formats USD with 2 decimals for >= 1', () => {
    expect(formatCurrency(1234.56)).toMatch(/\$1,234\.56/);
  });

  it('uses up to 6 decimals for < 1', () => {
    const s = formatCurrency(0.000123);
    expect(s.startsWith('$0.000123')).toBe(true);
  });

  it('returns $0.00 for falsy amount', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  it('limits decimals appropriately for big numbers', () => {
    expect(formatNumber(1234.56789)).toMatch(/^1,234\.57$/);
  });

  it('keeps more decimals for numbers < 1', () => {
    expect(formatNumber(0.1234567)).toMatch(/^0\.123457$/);
  });

  it('handles very small numbers with up to 8 decimals', () => {
    expect(formatNumber(0.00000091)).toMatch(/^0\.00000091$/);
  });

  it('returns 0 for falsy number', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('calculateToAmount', () => {
  it('returns 0 when required params are falsy', () => {
    expect(calculateToAmount(0, 1, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, 0, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, 1, 0, 0.5)).toBe(0);
  });

  it('calculates correctly without slippage', () => {
    // from: 2 ETH @ $2000 -> $4000
    // to: USDC @ $1 -> 4000 USDC
    expect(calculateToAmount(2, 2000, 1, 0)).toBe(4000);
  });

  it('applies slippage percent', () => {
    // same as above with 1% slippage -> 3960
    expect(calculateToAmount(2, 2000, 1, 1)).toBeCloseTo(3960, 5);
  });
});
