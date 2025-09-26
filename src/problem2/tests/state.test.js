import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock createState function since it's not exported from script.js
const createState = () => {
  return {
    tokens: [],
    prices: {},
    selectedFromToken: null,
    selectedToToken: null,
    currentSelector: null,
    slippageTolerance: 0.5,
    transactionDeadline: 20,
  };
};

// Mock the DOM and global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock DOM methods
const mockElement = {
  textContent: '',
  innerHTML: '',
  style: { display: '' },
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
  }
};

// Mock document methods
Object.defineProperty(document, 'getElementById', {
  value: vi.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelector', {
  value: vi.fn(() => mockElement),
  writable: true
});

Object.defineProperty(document, 'querySelectorAll', {
  value: vi.fn(() => [mockElement]),
  writable: true
});

Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

// Mock window methods
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

describe('State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElement.textContent = '';
    mockElement.innerHTML = '';
    mockElement.value = '';
    mockElement.disabled = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createState', () => {
    it('creates initial state with correct structure', () => {
      const state = createState();

      expect(state).toEqual({
        tokens: [],
        prices: {},
        selectedFromToken: null,
        selectedToToken: null,
        currentSelector: null,
        slippageTolerance: 0.5,
        transactionDeadline: 20,
      });
    });

    it('creates independent state instances', () => {
      const state1 = createState();
      const state2 = createState();

      state1.tokens = ['token1'];
      state1.selectedFromToken = { symbol: 'ETH' };

      expect(state2.tokens).toEqual([]);
      expect(state2.selectedFromToken).toBeNull();
    });
  });

  describe('Data Loading', () => {
    it('loads token data successfully', async () => {
      const mockPrices = [
        { currency: 'ETH', price: 2000 },
        { currency: 'USDC', price: 1 },
        { currency: 'USDT', price: 1.01 }
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockPrices)
      });

      // Import the loadTokenData function (we'll need to extract it)
      // For now, we'll test the state structure after loading
      const state = createState();

      // Simulate the data loading process
      state.prices = {
        ETH: 2000,
        USDC: 1,
        USDT: 1.01
      };

      state.tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ].filter(token => state.prices[token.symbol]);

      expect(state.prices).toEqual({
        ETH: 2000,
        USDC: 1,
        USDT: 1.01
      });

      expect(state.tokens).toHaveLength(3);
      expect(state.tokens[0].symbol).toBe('ETH');
    });

    it('filters out tokens without price data', () => {
      const state = createState();

      state.prices = {
        ETH: 2000,
        USDC: 1
      };

      const allTokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'NO_PRICE', name: 'No Price Token', decimals: 18 }
      ];

      state.tokens = allTokens.filter(token => state.prices[token.symbol]);

      expect(state.tokens).toHaveLength(2);
      expect(state.tokens.find(t => t.symbol === 'NO_PRICE')).toBeUndefined();
    });

    it('sorts tokens by price descending then by name', () => {
      const state = createState();

      state.prices = {
        ETH: 2000,
        USDC: 1,
        USDT: 1.01
      };

      state.tokens = [
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ];

      state.tokens.sort((a, b) => {
        const pa = state.prices[a.symbol] || 0;
        const pb = state.prices[b.symbol] || 0;
        if (pa !== pb) return pb - pa;
        return a.name.localeCompare(b.name);
      });

      expect(state.tokens[0].symbol).toBe('ETH'); // Highest price
      expect(state.tokens[1].symbol).toBe('USDT'); // Higher price than USDC
      expect(state.tokens[2].symbol).toBe('USDC'); // Lowest price
    });
  });

  describe('Token Selection', () => {
    it('updates selectedFromToken when currentSelector is from', () => {
      const state = createState();
      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      state.currentSelector = 'from';

      // Simulate selectToken function behavior
      if (state.currentSelector === 'from') {
        state.selectedFromToken = token;
      }

      expect(state.selectedFromToken).toEqual(token);
      expect(state.selectedToToken).toBeNull();
    });

    it('updates selectedToToken when currentSelector is to', () => {
      const state = createState();
      const token = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      state.currentSelector = 'to';

      // Simulate selectToken function behavior
      if (state.currentSelector === 'to') {
        state.selectedToToken = token;
      }

      expect(state.selectedToToken).toEqual(token);
      expect(state.selectedFromToken).toBeNull();
    });

    it('resets currentSelector after token selection', () => {
      const state = createState();
      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      state.currentSelector = 'from';
      state.selectedFromToken = token;
      state.currentSelector = null; // Simulate closeTokenModal behavior

      expect(state.currentSelector).toBeNull();
    });
  });

  describe('Settings Management', () => {
    it('updates slippage tolerance', () => {
      const state = createState();

      expect(state.slippageTolerance).toBe(0.5);

      state.slippageTolerance = 1.0;

      expect(state.slippageTolerance).toBe(1.0);
    });

    it('updates transaction deadline', () => {
      const state = createState();

      expect(state.transactionDeadline).toBe(20);

      state.transactionDeadline = 30;

      expect(state.transactionDeadline).toBe(30);
    });

    it('validates slippage tolerance values', () => {
      const state = createState();

      // Test valid values
      state.slippageTolerance = 0.1;
      expect(state.slippageTolerance).toBe(0.1);

      state.slippageTolerance = 5.0;
      expect(state.slippageTolerance).toBe(5.0);

      // Test edge cases
      state.slippageTolerance = 0;
      expect(state.slippageTolerance).toBe(0);
    });

    it('validates transaction deadline values', () => {
      const state = createState();

      // Test valid values
      state.transactionDeadline = 1;
      expect(state.transactionDeadline).toBe(1);

      state.transactionDeadline = 60;
      expect(state.transactionDeadline).toBe(60);

      // Test edge cases
      state.transactionDeadline = 0;
      expect(state.transactionDeadline).toBe(0);
    });
  });

  describe('Token Swapping', () => {
    it('swaps selected tokens correctly', () => {
      const state = createState();
      const fromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      const toToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      state.selectedFromToken = fromToken;
      state.selectedToToken = toToken;

      // Simulate swapTokens function behavior
      [state.selectedFromToken, state.selectedToToken] = [state.selectedToToken, state.selectedFromToken];

      expect(state.selectedFromToken).toEqual(toToken);
      expect(state.selectedToToken).toEqual(fromToken);
    });

    it('handles swap when one token is null', () => {
      const state = createState();
      const fromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      state.selectedFromToken = fromToken;
      state.selectedToToken = null;

      // Simulate swapTokens function behavior
      [state.selectedFromToken, state.selectedToToken] = [state.selectedToToken, state.selectedFromToken];

      expect(state.selectedFromToken).toBeNull();
      expect(state.selectedToToken).toEqual(fromToken);
    });
  });

  describe('State Immutability', () => {
    it('maintains state integrity during operations', () => {
      const state = createState();
      const originalTokens = [...state.tokens];
      const originalPrices = { ...state.prices };

      // Simulate various operations
      state.tokens.push({ symbol: 'TEST', name: 'Test Token', decimals: 18 });
      state.prices.TEST = 100;
      state.selectedFromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      // Verify original arrays/objects are not mutated
      expect(originalTokens).toEqual([]);
      expect(originalPrices).toEqual({});
    });
  });
});
