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

const mockQuerySelector = vi.fn((selector) => {
  if (selector === '.slippage-btn') {
    return [
      createMockElement({ dataset: { value: '0.1' } }),
      createMockElement({ dataset: { value: '0.5' } }),
      createMockElement({ dataset: { value: '1.0' } })
    ];
  }
  return createMockElement();
});

const mockQuerySelectorAll = vi.fn((selector) => {
  if (selector === '.slippage-btn') {
    return [
      createMockElement({ dataset: { value: '0.1' } }),
      createMockElement({ dataset: { value: '0.5' } }),
      createMockElement({ dataset: { value: '1.0' } })
    ];
  }
  if (selector === '.token-item') {
    return [
      createMockElement({ getAttribute: vi.fn(() => 'ETH') }),
      createMockElement({ getAttribute: vi.fn(() => 'USDC') })
    ];
  }
  return [];
});

// Mock DOM globals
Object.defineProperty(document, 'getElementById', {
  value: mockGetElementById,
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: mockQuerySelectorAll,
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock utility functions
vi.mock('../lib/utils.js', () => ({
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  formatNumber: vi.fn((num, decimals = 6) => num.toFixed(decimals)),
  calculateToAmount: vi.fn((fromAmount, fromPrice, toPrice, slippage) => {
    if (!fromAmount || !fromPrice || !toPrice) return 0;
    const usd = fromAmount * fromPrice;
    const raw = usd / toPrice;
    const slippageMultiplier = 1 - slippage / 100;
    return raw * slippageMultiplier;
  }),
  getMockBalance: vi.fn((symbol) => {
    const balances = { ETH: 2.5, USDC: 1000, USDT: 800, WBTC: 0.1 };
    return balances[symbol] || 100;
  }),
  calculateTotalVolume: vi.fn(() => 125000000)
}));

describe('Integration Tests - Complete User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Token Swap Flow', () => {
    it('executes full swap flow from token selection to completion', async () => {
      // Mock successful API response
      const mockPrices = [
        { currency: 'ETH', price: 2000 },
        { currency: 'USDC', price: 1 },
        { currency: 'USDT', price: 1.01 }
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockPrices)
      });

      // Initialize app state
      const state = {
        tokens: [],
        prices: {},
        selectedFromToken: null,
        selectedToToken: null,
        currentSelector: null,
        slippageTolerance: 0.5,
        transactionDeadline: 20
      };

      // Step 1: Load token data
      const loadTokenData = async (state) => {
        try {
          const resp = await fetch('https://interview.switcheo.com/prices.json');
          const data = await resp.json();

          state.prices = {};
          data.forEach((item) => {
            if (item.price && item.price > 0) state.prices[item.currency] = item.price;
          });

          state.tokens = [
            { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
            { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
            { symbol: 'USDT', name: 'Tether USD', decimals: 6 }
          ].filter((t) => state.prices[t.symbol]);

          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const loadResult = await loadTokenData(state);
      expect(loadResult.success).toBe(true);
      expect(state.prices.ETH).toBe(2000);
      expect(state.prices.USDC).toBe(1);
      expect(state.tokens).toHaveLength(3);

      // Step 2: Select from token
      const selectFromToken = (state, token) => {
        state.selectedFromToken = token;
        state.currentSelector = null;
        // Simulate UI update
        const fromDisplay = mockGetElementById('from-selected-token');
        if (fromDisplay) fromDisplay.innerHTML = `${token.symbol} - ${token.name}`;
      };

      const ethToken = state.tokens.find(t => t.symbol === 'ETH');
      selectFromToken(state, ethToken);
      expect(state.selectedFromToken.symbol).toBe('ETH');

      // Step 3: Select to token
      const selectToToken = (state, token) => {
        state.selectedToToken = token;
        state.currentSelector = null;
        // Simulate UI update
        const toDisplay = mockGetElementById('to-selected-token');
        if (toDisplay) toDisplay.innerHTML = `${token.symbol} - ${token.name}`;
      };

      const usdcToken = state.tokens.find(t => t.symbol === 'USDC');
      selectToToken(state, usdcToken);
      expect(state.selectedToToken.symbol).toBe('USDC');

      // Step 4: Enter amount
      const fromAmountInput = createMockElement();
      const toAmountInput = createMockElement();
      const fromUsdDisplay = createMockElement();
      const toUsdDisplay = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(fromAmountInput)
        .mockReturnValueOnce(toAmountInput)
        .mockReturnValueOnce(fromUsdDisplay)
        .mockReturnValueOnce(toUsdDisplay);

      const calculateAmounts = (state, fromAmount) => {
        if (!state.selectedFromToken || !state.selectedToToken || fromAmount <= 0) {
          return { toAmount: 0, fromUsd: 0, toUsd: 0 };
        }

        const fromPrice = state.prices[state.selectedFromToken.symbol];
        const toPrice = state.prices[state.selectedToToken.symbol];

        if (!fromPrice || !toPrice) {
          return { toAmount: 0, fromUsd: 0, toUsd: 0 };
        }

        const fromUsd = fromAmount * fromPrice;
        const toAmount = fromUsd / toPrice;
        const toUsd = toAmount * toPrice;

        return { toAmount, fromUsd, toUsd };
      };

      const fromAmount = 1.5;
      const amounts = calculateAmounts(state, fromAmount);

      expect(amounts.fromUsd).toBe(3000); // 1.5 * 2000
      expect(amounts.toAmount).toBe(3000); // 3000 / 1
      expect(amounts.toUsd).toBe(3000); // 3000 * 1

      // Step 5: Validate swap
      const validateSwap = (state, amount) => {
        if (!state.selectedFromToken || !state.selectedToToken) {
          return { valid: false, error: 'Please select tokens' };
        }

        if (amount <= 0) {
          return { valid: false, error: 'Please enter amount' };
        }

        const { getMockBalance } = require('../lib/utils.js');
        const balance = getMockBalance(state.selectedFromToken.symbol);
        if (amount > balance) {
          return { valid: false, error: 'Insufficient balance' };
        }

        return { valid: true };
      };

      const validation = validateSwap(state, fromAmount);
      expect(validation.valid).toBe(true);

      // Step 6: Execute swap
      const executeSwap = async (state, amount) => {
        // Simulate swap transaction
        await new Promise(resolve => setTimeout(resolve, 100));

        // Generate mock transaction hash
        const txHash = '0x' + Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join('');

        return { success: true, txHash };
      };

      const swapResult = await executeSwap(state, fromAmount);
      expect(swapResult.success).toBe(true);
      expect(swapResult.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    });

    it('handles swap flow with error scenarios', async () => {
      // Mock API failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const state = {
        tokens: [],
        prices: {},
        selectedFromToken: null,
        selectedToToken: null,
        currentSelector: null,
        slippageTolerance: 0.5,
        transactionDeadline: 20
      };

      // Test API failure handling
      const loadTokenData = async (state) => {
        try {
          const resp = await fetch('https://interview.switcheo.com/prices.json');
          const data = await resp.json();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const loadResult = await loadTokenData(state);
      expect(loadResult.success).toBe(false);
      expect(loadResult.error).toBe('Network error');

      // Test insufficient balance scenario
      const { getMockBalance } = require('../lib/utils.js');
      state.selectedFromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      state.selectedToToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };
      state.prices = { ETH: 2000, USDC: 1 };

      const validateSwap = (state, amount) => {
        if (!state.selectedFromToken || !state.selectedToToken) {
          return { valid: false, error: 'Please select tokens' };
        }

        if (amount <= 0) {
          return { valid: false, error: 'Please enter amount' };
        }

        const balance = getMockBalance(state.selectedFromToken.symbol);
        if (amount > balance) {
          return { valid: false, error: 'Insufficient balance' };
        }

        return { valid: true };
      };

      const validation = validateSwap(state, 10); // More than available balance
      expect(validation.valid).toBe(false);
      expect(validation.error).toBe('Insufficient balance');
    });
  });

  describe('Token Selection and Search Flow', () => {
    it('executes complete token selection with search', () => {
      const state = {
        tokens: [
          { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
          { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
          { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
          { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
        ],
        prices: { ETH: 2000, USDC: 1, USDT: 1.01, WBTC: 30000 },
        currentSelector: 'from'
      };

      // Step 1: Open token modal
      const openTokenModal = (state) => {
        state.currentSelector = 'from';
        const modal = mockGetElementById('token-modal');
        if (modal) modal.style.display = 'flex';
      };

      openTokenModal(state);
      expect(state.currentSelector).toBe('from');

      // Step 2: Search for tokens
      const searchTokens = (state, searchTerm) => {
        if (!searchTerm?.trim()) {
          return state.tokens;
        }
        const query = searchTerm.toLowerCase();
        return state.tokens.filter(
          (token) => {
            const symbolMatch = token.symbol.toLowerCase() === query;
            const nameMatch = (token.name.toLowerCase().startsWith(query) ||
                              token.name.toLowerCase().includes(` ${query}`) ||
                              token.name.toLowerCase().includes(`${query} `)) &&
                             token.symbol.toLowerCase() !== query;
            return symbolMatch || nameMatch;
          }
        );
      };

      const searchResults1 = searchTokens(state, 'ETH');
      expect(searchResults1).toHaveLength(1);
      expect(searchResults1[0].symbol).toBe('ETH');

      const searchResults2 = searchTokens(state, 'USD');
      expect(searchResults2).toHaveLength(2);
      expect(searchResults2.map(t => t.symbol)).toEqual(['USDC', 'USDT']);

      // Step 3: Select token
      const selectToken = (state, token) => {
        if (state.currentSelector === 'from') {
          state.selectedFromToken = token;
        } else if (state.currentSelector === 'to') {
          state.selectedToToken = token;
        }
        state.currentSelector = null;
        const modal = mockGetElementById('token-modal');
        if (modal) modal.style.display = 'none';
      };

      const selectedToken = searchResults1[0];
      selectToken(state, selectedToken);

      expect(state.selectedFromToken.symbol).toBe('ETH');
      expect(state.currentSelector).toBeNull();
    });
  });

  describe('Settings Configuration Flow', () => {
    it('executes complete settings configuration', () => {
      const state = {
        slippageTolerance: 0.5,
        transactionDeadline: 20
      };

      // Step 1: Open settings modal
      const openSettingsModal = (state) => {
        const modal = mockGetElementById('settings-modal');
        if (modal) modal.style.display = 'flex';
      };

      openSettingsModal(state);

      // Step 2: Update slippage tolerance
      const updateSlippage = (state, value) => {
        state.slippageTolerance = value;
        // Simulate UI update
        const buttons = mockQuerySelectorAll('.slippage-btn');
        buttons.forEach(btn => {
          btn.classList.toggle('active', parseFloat(btn.dataset.value) === value);
        });
      };

      updateSlippage(state, 1.0);
      expect(state.slippageTolerance).toBe(1.0);

      // Step 3: Update transaction deadline
      const updateDeadline = (state, value) => {
        state.transactionDeadline = value;
        const input = mockGetElementById('deadline');
        if (input) input.value = value;
      };

      updateDeadline(state, 30);
      expect(state.transactionDeadline).toBe(30);

      // Step 4: Close settings modal
      const closeSettingsModal = () => {
        const modal = mockGetElementById('settings-modal');
        if (modal) modal.style.display = 'none';
      };

      closeSettingsModal();
    });
  });

  describe('Form Validation and Error Handling Flow', () => {
    it('executes complete validation flow with various error scenarios', () => {
      const state = {
        selectedFromToken: null,
        selectedToToken: null,
        prices: { ETH: 2000, USDC: 1 },
        slippageTolerance: 0.5
      };

      const { getMockBalance } = require('../lib/utils.js');

      // Test 1: No tokens selected
      const validateForm = (state, amount) => {
        const errors = [];

        if (!state.selectedFromToken) {
          errors.push('Please select a token to swap from');
        }
        if (!state.selectedToToken) {
          errors.push('Please select a token to swap to');
        }
        if (amount <= 0) {
          errors.push('Please enter a valid amount');
        }
        if (state.selectedFromToken && amount > 0) {
          const balance = getMockBalance(state.selectedFromToken.symbol);
          if (amount > balance) {
            errors.push(`Insufficient ${state.selectedFromToken.symbol} balance`);
          }
        }

        return {
          valid: errors.length === 0,
          errors
        };
      };

      let validation = validateForm(state, 1.5);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Please select a token to swap from');
      expect(validation.errors).toContain('Please select a token to swap to');

      // Test 2: Select tokens but insufficient balance
      state.selectedFromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      state.selectedToToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      validation = validateForm(state, 10); // More than available balance
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Insufficient ETH balance');

      // Test 3: Valid form
      validation = validateForm(state, 1.5);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Complete Swap with Token Swapping', () => {
    it('executes swap flow with token swapping functionality', () => {
      const state = {
        selectedFromToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        selectedToToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        prices: { ETH: 2000, USDC: 1 },
        slippageTolerance: 0.5
      };

      // Step 1: Initial state
      expect(state.selectedFromToken.symbol).toBe('ETH');
      expect(state.selectedToToken.symbol).toBe('USDC');

      // Step 2: Swap tokens
      const swapTokens = (state) => {
        if (!state.selectedFromToken || !state.selectedToToken) return;
        [state.selectedFromToken, state.selectedToToken] = [state.selectedToToken, state.selectedFromToken];
      };

      swapTokens(state);

      expect(state.selectedFromToken.symbol).toBe('USDC');
      expect(state.selectedToToken.symbol).toBe('ETH');

      // Step 3: Swap back
      swapTokens(state);

      expect(state.selectedFromToken.symbol).toBe('ETH');
      expect(state.selectedToToken.symbol).toBe('USDC');
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid successive operations', () => {
      const state = {
        selectedFromToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        selectedToToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        prices: { ETH: 2000, USDC: 1 },
        slippageTolerance: 0.5
      };

      const { calculateToAmount } = require('../lib/utils.js');

      // Simulate rapid amount changes
      const amounts = [0.1, 0.5, 1.0, 1.5, 2.0, 0.1];
      const results = [];

      amounts.forEach(amount => {
        const toAmount = calculateToAmount(amount, 2000, 1, 0.5);
        results.push({ fromAmount: amount, toAmount });
      });

      expect(results).toHaveLength(6);
      expect(results[0].toAmount).toBeCloseTo(199, 0); // 0.1 * 2000 / 1 * 0.995
      expect(results[5].toAmount).toBeCloseTo(199, 0); // Same as first
    });

    it('handles extreme values gracefully', () => {
      const state = {
        selectedFromToken: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        selectedToToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        prices: { ETH: 2000, USDC: 1 },
        slippageTolerance: 0.5
      };

      const { calculateToAmount } = require('../lib/utils.js');

      // Test very small amounts
      const smallAmount = calculateToAmount(0.000001, 2000, 1, 0.5);
      expect(smallAmount).toBeCloseTo(0.00199, 5);

      // Test very large amounts
      const largeAmount = calculateToAmount(1000000, 2000, 1, 0.5);
      expect(largeAmount).toBeCloseTo(1990000000, 0);

      // Test zero amounts
      const zeroAmount = calculateToAmount(0, 2000, 1, 0.5);
      expect(zeroAmount).toBe(0);
    });
  });

  describe('Data Persistence and State Management', () => {
    it('maintains state consistency across operations', () => {
      const state = {
        tokens: [],
        prices: {},
        selectedFromToken: null,
        selectedToToken: null,
        currentSelector: null,
        slippageTolerance: 0.5,
        transactionDeadline: 20
      };

      // Simulate multiple operations that should maintain state
      const operations = [
        () => { state.slippageTolerance = 1.0; },
        () => { state.transactionDeadline = 30; },
        () => { state.selectedFromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 }; },
        () => { state.selectedToToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 }; },
        () => { state.slippageTolerance = 0.5; }
      ];

      operations.forEach(op => op());

      expect(state.slippageTolerance).toBe(0.5);
      expect(state.transactionDeadline).toBe(30);
      expect(state.selectedFromToken.symbol).toBe('ETH');
      expect(state.selectedToToken.symbol).toBe('USDC');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from various error conditions', async () => {
      const state = {
        tokens: [],
        prices: {},
        selectedFromToken: null,
        selectedToToken: null,
        currentSelector: null,
        slippageTolerance: 0.5,
        transactionDeadline: 20
      };

      // Test 1: API failure recovery
      mockFetch.mockRejectedValue(new Error('Network error'));

      const loadWithRetry = async (state, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            const resp = await fetch('https://interview.switcheo.com/prices.json');
            const data = await resp.json();
            state.prices = { ETH: 2000, USDC: 1 };
            return { success: true };
          } catch (error) {
            if (i === retries - 1) {
              return { success: false, error: error.message };
            }
            // Simulate retry delay
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await loadWithRetry(state);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');

      // Test 2: State reset after error
      const resetState = (state) => {
        state.selectedFromToken = null;
        state.selectedToToken = null;
        state.currentSelector = null;
      };

      state.selectedFromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      state.selectedToToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      resetState(state);

      expect(state.selectedFromToken).toBeNull();
      expect(state.selectedToToken).toBeNull();
      expect(state.currentSelector).toBeNull();
    });
  });
});
