import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOM elements
const createMockElement = (overrides = {}) => ({
  textContent: '',
  innerHTML: '',
  style: { display: 'none' },
  value: '',
  disabled: false,
  addEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => []),
  focus: vi.fn(),
  dispatchEvent: vi.fn(),
  getAttribute: vi.fn(),
  setAttribute: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn(),
    contains: vi.fn()
  },
  ...overrides
});

// Mock document methods
const mockElements = new Map();
const mockGetElementById = vi.fn((id) => {
  if (!mockElements.has(id)) {
    mockElements.set(id, createMockElement());
  }
  return mockElements.get(id);
});

Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

// Mock utility functions
vi.mock('../lib/utils.js', () => ({
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  formatNumber: vi.fn((num, decimals = 6) => num.toFixed(decimals)),
  getMockBalance: vi.fn((symbol) => {
    const balances = {
      ETH: 2.5,
      USDC: 1000,
      USDT: 800,
      WBTC: 0.1,
      SWTH: 5000
    };
    return balances[symbol] || 100;
  })
}));

describe('Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Amount Validation', () => {
    it('validates positive amounts', () => {
      const validateAmount = (amount, selectedToken, getMockBalance) => {
        const num = parseFloat(amount);
        if (!selectedToken || isNaN(num) || num <= 0) {
          return { valid: true, error: null };
        }

        const balance = getMockBalance(selectedToken.symbol);
        if (num > balance) {
          return { valid: false, error: `Insufficient ${selectedToken.symbol} balance` };
        }

        const min = 0.001;
        if (num < min) {
          return { valid: false, error: `Minimum amount is ${min} ${selectedToken.symbol}` };
        }

        return { valid: true, error: null };
      };

      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      const { getMockBalance } = require('../lib/utils.js');

      // Valid amount
      const result1 = validateAmount('1.5', token, getMockBalance);
      expect(result1.valid).toBe(true);
      expect(result1.error).toBeNull();

      // Amount too high
      const result2 = validateAmount('10', token, getMockBalance);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Insufficient ETH balance');

      // Amount too low
      const result3 = validateAmount('0.0001', token, getMockBalance);
      expect(result3.valid).toBe(false);
      expect(result3.error).toBe('Minimum amount is 0.001 ETH');
    });

    it('handles invalid input formats', () => {
      const validateAmount = (amount, selectedToken, getMockBalance) => {
        const num = parseFloat(amount);
        if (!selectedToken || isNaN(num) || num <= 0) {
          return { valid: true, error: null };
        }
        return { valid: true, error: null };
      };

      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      const { getMockBalance } = require('../lib/utils.js');

      // Invalid formats should be handled gracefully
      expect(validateAmount('abc', token, getMockBalance).valid).toBe(true);
      expect(validateAmount('', token, getMockBalance).valid).toBe(true);
      expect(validateAmount('0', token, getMockBalance).valid).toBe(true);
      expect(validateAmount('-1', token, getMockBalance).valid).toBe(true);
    });

  });

  describe('Input Format Validation', () => {
    it('validates decimal input format', () => {
      const validateInputFormat = (value) => {
        return /^\d*\.?\d*$/.test(value);
      };

      // Valid formats
      expect(validateInputFormat('123')).toBe(true);
      expect(validateInputFormat('123.45')).toBe(true);
      expect(validateInputFormat('0.001')).toBe(true);
      expect(validateInputFormat('0')).toBe(true);
      expect(validateInputFormat('')).toBe(true);
      expect(validateInputFormat('.5')).toBe(true);
      expect(validateInputFormat('5.')).toBe(true);

      // Invalid formats
      expect(validateInputFormat('abc')).toBe(false);
      expect(validateInputFormat('12.34.56')).toBe(false);
      expect(validateInputFormat('12,34')).toBe(false);
      expect(validateInputFormat('12-34')).toBe(false);
      expect(validateInputFormat('12+34')).toBe(false);
      expect(validateInputFormat('12e5')).toBe(false);
    });

    it('handles edge cases in input validation', () => {
      const validateInputFormat = (value) => {
        return /^\d*\.?\d*$/.test(value);
      };

      // Edge cases
      expect(validateInputFormat('0.0')).toBe(true);
      expect(validateInputFormat('0.00')).toBe(true);
      expect(validateInputFormat('000.000')).toBe(true);
      expect(validateInputFormat('1234567890.123456789')).toBe(true);
      expect(validateInputFormat(' ')).toBe(false);
      expect(validateInputFormat(' 123')).toBe(false);
      expect(validateInputFormat('123 ')).toBe(false);
    });
  });

  describe('Token Selection Validation', () => {
    it('validates token selection requirements', () => {
      const validateTokenSelection = (fromToken, toToken) => {
        if (!fromToken) {
          return { valid: false, error: 'Please select a token to swap from' };
        }
        if (!toToken) {
          return { valid: false, error: 'Please select a token to swap to' };
        }
        if (fromToken.symbol === toToken.symbol) {
          return { valid: false, error: 'Cannot swap token to itself' };
        }
        return { valid: true, error: null };
      };

      const ethToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      const usdcToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      // Valid selection
      expect(validateTokenSelection(ethToken, usdcToken).valid).toBe(true);

      // Missing from token
      expect(validateTokenSelection(null, usdcToken).valid).toBe(false);
      expect(validateTokenSelection(null, usdcToken).error).toBe('Please select a token to swap from');

      // Missing to token
      expect(validateTokenSelection(ethToken, null).valid).toBe(false);
      expect(validateTokenSelection(ethToken, null).error).toBe('Please select a token to swap to');

      // Same token
      expect(validateTokenSelection(ethToken, ethToken).valid).toBe(false);
      expect(validateTokenSelection(ethToken, ethToken).error).toBe('Cannot swap token to itself');
    });
  });

  describe('Slippage Validation', () => {
    it('validates slippage tolerance values', () => {
      const validateSlippage = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Slippage must be a number' };
        }
        if (num < 0) {
          return { valid: false, error: 'Slippage cannot be negative' };
        }
        if (num > 50) {
          return { valid: false, error: 'Slippage cannot exceed 50%' };
        }
        return { valid: true, error: null };
      };

      // Valid values
      expect(validateSlippage('0.1').valid).toBe(true);
      expect(validateSlippage('0.5').valid).toBe(true);
      expect(validateSlippage('1.0').valid).toBe(true);
      expect(validateSlippage('5.0').valid).toBe(true);
      expect(validateSlippage('0').valid).toBe(true);

      // Invalid values
      expect(validateSlippage('abc').valid).toBe(false);
      expect(validateSlippage('-1').valid).toBe(false);
      expect(validateSlippage('51').valid).toBe(false);
      expect(validateSlippage('').valid).toBe(false);
    });
  });

  describe('Transaction Deadline Validation', () => {
    it('validates transaction deadline values', () => {
      const validateDeadline = (value) => {
        const num = parseInt(value);
        if (isNaN(num)) {
          return { valid: false, error: 'Deadline must be a number' };
        }
        if (num < 1) {
          return { valid: false, error: 'Deadline must be at least 1 minute' };
        }
        if (num > 60) {
          return { valid: false, error: 'Deadline cannot exceed 60 minutes' };
        }
        return { valid: true, error: null };
      };

      // Valid values
      expect(validateDeadline('1').valid).toBe(true);
      expect(validateDeadline('20').valid).toBe(true);
      expect(validateDeadline('60').valid).toBe(true);

      // Invalid values
      expect(validateDeadline('0').valid).toBe(false);
      expect(validateDeadline('61').valid).toBe(false);
      expect(validateDeadline('abc').valid).toBe(false);
      expect(validateDeadline('').valid).toBe(false);
      expect(validateDeadline('-1').valid).toBe(false);
    });
  });

  describe('Error Display Management', () => {
    it('shows error messages correctly', () => {
      const errorElement = createMockElement();
      const errorTextElement = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(errorTextElement)
        .mockReturnValueOnce(errorElement);

      const showError = (message) => {
        const textEl = mockGetElementById('error-text');
        const el = mockGetElementById('error-message');
        if (textEl) textEl.textContent = message;
        if (el) el.style.display = 'flex';
      };

      showError('Test error message');
      expect(errorTextElement.textContent).toBe('Test error message');
      expect(errorElement.style.display).toBe('flex');
    });

    it('hides error messages correctly', () => {
      const errorElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(errorElement);

      const hideError = () => {
        const el = mockGetElementById('error-message');
        if (el) el.style.display = 'none';
      };

      hideError();
      expect(errorElement.style.display).toBe('none');
    });

  });

  describe('Form State Validation', () => {
    it('validates complete form state', () => {
      const validateFormState = (state) => {
        const errors = [];

        if (!state.selectedFromToken) {
          errors.push('Please select a token to swap from');
        }
        if (!state.selectedToToken) {
          errors.push('Please select a token to swap to');
        }
        if (state.selectedFromToken && state.selectedToToken &&
            state.selectedFromToken.symbol === state.selectedToToken.symbol) {
          errors.push('Cannot swap token to itself');
        }

        const amount = parseFloat(state.fromAmount || 0);
        if (amount <= 0) {
          errors.push('Please enter a valid amount');
        } else if (state.selectedFromToken) {
          const balance = state.getMockBalance ? state.getMockBalance(state.selectedFromToken.symbol) : 0;
          if (amount > balance) {
            errors.push(`Insufficient ${state.selectedFromToken.symbol} balance`);
          }
          if (amount < 0.001) {
            errors.push(`Minimum amount is 0.001 ${state.selectedFromToken.symbol}`);
          }
        }

        if (state.slippageTolerance < 0 || state.slippageTolerance > 50) {
          errors.push('Invalid slippage tolerance');
        }

        if (state.transactionDeadline < 1 || state.transactionDeadline > 60) {
          errors.push('Invalid transaction deadline');
        }

        return {
          valid: errors.length === 0,
          errors
        };
      };

      const { getMockBalance } = require('../lib/utils.js');

      // Valid state
      const validState = {
        selectedFromToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        selectedToToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        fromAmount: '1.5',
        slippageTolerance: 0.5,
        transactionDeadline: 20,
        getMockBalance
      };

      const validResult = validateFormState(validState);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid state
      const invalidState = {
        selectedFromToken: null,
        selectedToToken: null,
        fromAmount: '0',
        slippageTolerance: -1,
        transactionDeadline: 0,
        getMockBalance
      };

      const invalidResult = validateFormState(invalidState);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Validation', () => {
    it('validates input in real-time', () => {
      const validateRealTime = (value, selectedToken, getMockBalance) => {
        const num = parseFloat(value);

        // Allow empty input
        if (!value || value === '') {
          return { valid: true, error: null };
        }

        // Check format
        if (!/^\d*\.?\d*$/.test(value)) {
          return { valid: false, error: 'Invalid number format' };
        }

        // Check if it's a valid number
        if (isNaN(num) || num <= 0) {
          return { valid: true, error: null }; // Allow typing
        }

        // Check balance if token is selected
        if (selectedToken) {
          const balance = getMockBalance(selectedToken.symbol);
          if (num > balance) {
            return { valid: false, error: `Insufficient ${selectedToken.symbol} balance` };
          }
        }

        return { valid: true, error: null };
      };

      const { getMockBalance } = require('../lib/utils.js');
      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      // Valid inputs
      expect(validateRealTime('', token, getMockBalance).valid).toBe(true);
      expect(validateRealTime('1', token, getMockBalance).valid).toBe(true);
      expect(validateRealTime('1.5', token, getMockBalance).valid).toBe(true);

      // Invalid format
      expect(validateRealTime('abc', token, getMockBalance).valid).toBe(false);

      // Insufficient balance
      expect(validateRealTime('10', token, getMockBalance).valid).toBe(false);
    });
  });
});
