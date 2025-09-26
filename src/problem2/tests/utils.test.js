import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCurrency, formatNumber, calculateToAmount, calculateTotalVolume, getMockBalance } from '../lib/utils.js';

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
    expect(formatCurrency('')).toBe('$0.00');
  });

  it('handles negative amounts', () => {
    expect(formatCurrency(-123.45)).toMatch(/-?\$123\.45/);
  });

  it('handles very large numbers', () => {
    expect(formatCurrency(1234567.89)).toMatch(/\$1,234,567\.89/);
  });

  it('handles edge case of exactly 1', () => {
    expect(formatCurrency(1)).toBe('$1.00');
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
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
  });

  it('respects maxDecimals parameter', () => {
    expect(formatNumber(1.234567, 2)).toBe('1.23');
    expect(formatNumber(1.234567, 4)).toBe('1.2346');
  });

  it('handles numbers between 1 and 100', () => {
    expect(formatNumber(50.1234)).toMatch(/^50\.1234$/);
  });

  it('handles very large numbers', () => {
    expect(formatNumber(1234567.89)).toMatch(/^1,234,567\.89$/);
  });

  it('handles exactly 0.001', () => {
    expect(formatNumber(0.001)).toBe('0.001');
  });
});

describe('calculateToAmount', () => {
  it('returns 0 when required params are falsy', () => {
    expect(calculateToAmount(0, 1, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, 0, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, 1, 0, 0.5)).toBe(0);
    expect(calculateToAmount(null, 1, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, null, 1, 0.5)).toBe(0);
    expect(calculateToAmount(1, 1, null, 0.5)).toBe(0);
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

  it('handles high slippage', () => {
    expect(calculateToAmount(100, 1, 1, 50)).toBeCloseTo(50, 5);
  });

  it('handles zero slippage', () => {
    expect(calculateToAmount(10, 2, 1, 0)).toBe(20);
  });

  it('handles decimal amounts', () => {
    expect(calculateToAmount(0.5, 2000, 1, 0)).toBe(1000);
  });
});

describe('calculateTotalVolume', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns a value within expected range', () => {
    const volume = calculateTotalVolume();
    expect(volume).toBeGreaterThan(100_000_000);
    expect(volume).toBeLessThan(150_000_000);
  });

  it('returns different values on multiple calls', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.8).mockReturnValueOnce(0.2);
    const volume1 = calculateTotalVolume();
    const volume2 = calculateTotalVolume();
    expect(volume1).not.toBe(volume2);
  });
});

describe('getMockBalance', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns predefined balance for known tokens', () => {
    expect(getMockBalance('ETH')).toBe(2.5);
    expect(getMockBalance('USDC')).toBe(3500);
    expect(getMockBalance('USDT')).toBe(2800);
    expect(getMockBalance('WBTC')).toBeCloseTo(0.15, 2);
    expect(getMockBalance('SWTH')).toBe(35000);
  });

  it('returns fixed balance for unknown tokens', () => {
    expect(getMockBalance('UNKNOWN')).toBe(500);
  });

  it('returns consistent values for unknown tokens on multiple calls', () => {
    // Test that fixed values are consistent by calling multiple times
    const balances = new Set();
    for (let i = 0; i < 10; i++) {
      balances.add(getMockBalance('UNKNOWN'));
    }
    // The mock returns 500 for unknown tokens, so all values will be the same
    // This test verifies the function works consistently
    expect(balances.size).toBe(1);
    expect(Array.from(balances)[0]).toBe(500);
  });
});
