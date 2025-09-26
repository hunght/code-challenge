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

// Mock utility functions
vi.mock('../lib/utils.js', () => ({
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  formatNumber: vi.fn((num, decimals = 6) => num.toFixed(decimals)),
  getMockBalance: vi.fn((symbol) => {
    const balances = { ETH: 2.5, USDC: 1000, USDT: 800 };
    return balances[symbol] || 100;
  })
}));

describe('Modal Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Selection Modal', () => {
    it('opens token modal correctly', () => {
      const modalElement = createMockElement({ style: { display: 'none' } });
      const searchElement = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(modalElement)
        .mockReturnValueOnce(searchElement);

      const openTokenModal = (state) => {
        const overlay = mockGetElementById('token-modal');
        if (!overlay) return;
        overlay.style.display = 'flex';
        const input = mockGetElementById('token-search');
        if (input) input.value = '';
        // Simulate renderTokenList call
        setTimeout(() => input?.focus(), 100);
      };

      const state = { tokens: [], prices: {} };
      openTokenModal(state);

      expect(modalElement.style.display).toBe('flex');
      expect(searchElement.value).toBe('');
    });

    it('closes token modal correctly', () => {
      const modalElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(modalElement);

      const closeTokenModal = (state) => {
        const overlay = mockGetElementById('token-modal');
        if (overlay) overlay.style.display = 'none';
        state.currentSelector = null;
      };

      const state = { currentSelector: 'from' };
      closeTokenModal(state);

      expect(modalElement.style.display).toBe('none');
      expect(state.currentSelector).toBeNull();
    });

    it('handles modal overlay clicks', () => {
      const modalElement = createMockElement({ style: { display: 'flex' } });
      const closeButton = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(modalElement)
        .mockReturnValueOnce(closeButton);

      const handleModalClick = (event, state) => {
        if (event.target === modalElement) {
          const overlay = mockGetElementById('token-modal');
          if (overlay) overlay.style.display = 'none';
          state.currentSelector = null;
        }
      };

      const state = { currentSelector: 'from' };
      const mockEvent = { target: modalElement };

      handleModalClick(mockEvent, state);
      expect(modalElement.style.display).toBe('none');
      expect(state.currentSelector).toBeNull();
    });

  });

  describe('Settings Modal', () => {
    it('opens settings modal correctly', () => {
      const modalElement = createMockElement({ style: { display: 'none' } });
      mockGetElementById.mockReturnValue(modalElement);

      const openSettingsModal = (state) => {
        const overlay = mockGetElementById('settings-modal');
        if (!overlay) return;
        overlay.style.display = 'flex';
        // Simulate updateSettingsUI call
      };

      const state = { slippageTolerance: 0.5, transactionDeadline: 20 };
      openSettingsModal(state);

      expect(modalElement.style.display).toBe('flex');
    });

    it('closes settings modal correctly', () => {
      const modalElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(modalElement);

      const closeSettingsModal = () => {
        const overlay = mockGetElementById('settings-modal');
        if (overlay) overlay.style.display = 'none';
      };

      closeSettingsModal();
      expect(modalElement.style.display).toBe('none');
    });

    it('updates settings UI correctly', () => {
      const buttons = [
        createMockElement({ dataset: { value: '0.1' }, classList: { toggle: vi.fn() } }),
        createMockElement({ dataset: { value: '0.5' }, classList: { toggle: vi.fn() } }),
        createMockElement({ dataset: { value: '1.0' }, classList: { toggle: vi.fn() } })
      ];
      const customInput = createMockElement();
      const deadlineInput = createMockElement();

      mockQuerySelectorAll.mockReturnValue(buttons);
      mockGetElementById
        .mockReturnValueOnce(customInput)
        .mockReturnValueOnce(deadlineInput);

      const updateSettingsUI = (state) => {
        document.querySelectorAll('.slippage-btn').forEach((btn) => {
          btn.classList.toggle('active', parseFloat(btn.dataset.value) === state.slippageTolerance);
        });

        const custom = mockGetElementById('custom-slippage');
        if (custom) custom.value = [0.1, 0.5, 1.0].includes(state.slippageTolerance) ? '' : String(state.slippageTolerance);

        const deadline = mockGetElementById('deadline');
        if (deadline) deadline.value = state.transactionDeadline;
      };

      const state = { slippageTolerance: 0.5, transactionDeadline: 20 };
      updateSettingsUI(state);

      expect(buttons[0].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(buttons[1].classList.toggle).toHaveBeenCalledWith('active', true);
      expect(buttons[2].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(customInput.value).toBe('');
      expect(deadlineInput.value).toBe(20);
    });
  });

  describe('Token Selection Logic', () => {
    it('selects from token correctly', () => {
      const state = {
        currentSelector: 'from',
        selectedFromToken: null,
        selectedToToken: null
      };

      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      const selectToken = (state, token) => {
        if (state.currentSelector === 'from') {
          state.selectedFromToken = token;
        } else if (state.currentSelector === 'to') {
          state.selectedToToken = token;
        }
        // Simulate closeTokenModal call
        state.currentSelector = null;
      };

      selectToken(state, token);

      expect(state.selectedFromToken).toEqual(token);
      expect(state.selectedToToken).toBeNull();
      expect(state.currentSelector).toBeNull();
    });

    it('selects to token correctly', () => {
      const state = {
        currentSelector: 'to',
        selectedFromToken: null,
        selectedToToken: null
      };

      const token = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      const selectToken = (state, token) => {
        if (state.currentSelector === 'from') {
          state.selectedFromToken = token;
        } else if (state.currentSelector === 'to') {
          state.selectedToToken = token;
        }
        // Simulate closeTokenModal call
        state.currentSelector = null;
      };

      selectToken(state, token);

      expect(state.selectedToToken).toEqual(token);
      expect(state.selectedFromToken).toBeNull();
      expect(state.currentSelector).toBeNull();
    });

    it('handles token selection without current selector', () => {
      const state = {
        currentSelector: null,
        selectedFromToken: null,
        selectedToToken: null
      };

      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      const selectToken = (state, token) => {
        if (state.currentSelector === 'from') {
          state.selectedFromToken = token;
        } else if (state.currentSelector === 'to') {
          state.selectedToToken = token;
        }
        // Simulate closeTokenModal call
        state.currentSelector = null;
      };

      selectToken(state, token);

      expect(state.selectedFromToken).toBeNull();
      expect(state.selectedToToken).toBeNull();
    });
  });

  describe('Token Search and Filtering', () => {
    it('filters tokens by symbol', () => {
      const tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
      ];

      const filterTokens = (tokens, searchTerm) => {
        if (!searchTerm?.trim()) {
          return tokens;
        }
        const query = searchTerm.toLowerCase();
        return tokens.filter(
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

      const result1 = filterTokens(tokens, 'ETH');
      expect(result1).toHaveLength(1);
      expect(result1[0].symbol).toBe('ETH');

      const result2 = filterTokens(tokens, 'USD');
      expect(result2).toHaveLength(2);
      expect(result2.map(t => t.symbol)).toEqual(['USDC', 'USDT']);

      const result3 = filterTokens(tokens, 'Bitcoin');
      expect(result3).toHaveLength(1);
      expect(result3[0].symbol).toBe('WBTC');
    });

    it('filters tokens by name', () => {
      const tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ];

      const filterTokens = (tokens, searchTerm) => {
        if (!searchTerm?.trim()) {
          return tokens;
        }
        const query = searchTerm.toLowerCase();
        return tokens.filter(
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

      const result = filterTokens(tokens, 'coin');
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('USDC');
    });

    it('returns all tokens for empty search', () => {
      const tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ];

      const filterTokens = (tokens, searchTerm) => {
        if (!searchTerm?.trim()) {
          return tokens;
        }
        const query = searchTerm.toLowerCase();
        return tokens.filter(
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

      const result1 = filterTokens(tokens, '');
      expect(result1).toEqual(tokens);

      const result2 = filterTokens(tokens, null);
      expect(result2).toEqual(tokens);

      const result3 = filterTokens(tokens, '   ');
      expect(result3).toEqual(tokens);
    });

    it('handles case-insensitive search', () => {
      const tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ];

      const filterTokens = (tokens, searchTerm) => {
        if (!searchTerm?.trim()) {
          return tokens;
        }
        const query = searchTerm.toLowerCase();
        return tokens.filter(
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

      const result1 = filterTokens(tokens, 'eth');
      expect(result1).toHaveLength(1);
      expect(result1[0].symbol).toBe('ETH');

      const result2 = filterTokens(tokens, 'ETHEREUM');
      expect(result2).toHaveLength(1);
      expect(result2[0].symbol).toBe('ETH');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles escape key to close modals', () => {
      const tokenModal = createMockElement({ style: { display: 'flex' } });
      const settingsModal = createMockElement({ style: { display: 'flex' } });

      mockGetElementById
        .mockReturnValueOnce(tokenModal)
        .mockReturnValueOnce(settingsModal);

      const handleKeyDown = (event, state) => {
        if (event.key === 'Escape') {
          const tokenOverlay = mockGetElementById('token-modal');
          const settingsOverlay = mockGetElementById('settings-modal');
          if (tokenOverlay) tokenOverlay.style.display = 'none';
          if (settingsOverlay) settingsOverlay.style.display = 'none';
          state.currentSelector = null;
        }
      };

      const state = { currentSelector: 'from' };
      const mockEvent = { key: 'Escape' };

      handleKeyDown(mockEvent, state);

      expect(tokenModal.style.display).toBe('none');
      expect(settingsModal.style.display).toBe('none');
      expect(state.currentSelector).toBeNull();
    });

    it('handles Ctrl+K shortcut for search focus', () => {
      const searchElement = createMockElement();
      mockGetElementById.mockReturnValue(searchElement);

      const handleKeyDown = (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
          event.preventDefault();
          const search = mockGetElementById('token-search');
          if (search && search.offsetParent !== null) search.focus();
        }
      };

      const mockEvent = {
        ctrlKey: true,
        key: 'k',
        preventDefault: vi.fn()
      };

      handleKeyDown(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(searchElement.focus).toHaveBeenCalled();
    });
  });

  describe('Modal State Management', () => {
    it('tracks current selector state', () => {
      const state = { currentSelector: null };

      const setCurrentSelector = (selector) => {
        state.currentSelector = selector;
      };

      setCurrentSelector('from');
      expect(state.currentSelector).toBe('from');

      setCurrentSelector('to');
      expect(state.currentSelector).toBe('to');

      setCurrentSelector(null);
      expect(state.currentSelector).toBeNull();
    });

  });

  describe('Success Modal', () => {
    it('shows success message with transaction hash', () => {
      const successElement = createMockElement({ style: { display: 'none' } });
      const hashElement = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(hashElement)
        .mockReturnValueOnce(successElement);

      const showSwapSuccess = () => {
        // Mock tx hash
        const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const hashEl = mockGetElementById('tx-hash');
        if (hashEl) hashEl.textContent = txHash.substring(0, 10) + '...' + txHash.substring(54);

        const overlay = mockGetElementById('success-message');
        if (overlay) overlay.style.display = 'flex';
      };

      showSwapSuccess();

      expect(hashElement.textContent).toMatch(/^0x[a-f0-9]+\.\.\.[a-f0-9]+$/);
      expect(successElement.style.display).toBe('flex');
    });

    it('auto-hides success message after timeout', (done) => {
      const successElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(successElement);

      const showSwapSuccess = () => {
        const overlay = mockGetElementById('success-message');
        if (overlay) overlay.style.display = 'flex';
        setTimeout(() => {
          if (overlay) overlay.style.display = 'none';
          done();
        }, 100); // Shorter timeout for test
      };

      showSwapSuccess();
    });
  });
});
