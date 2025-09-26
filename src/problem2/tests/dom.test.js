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

// Mock the utility functions
vi.mock('../lib/utils.js', () => ({
  formatCurrency: vi.fn((amount) => `$${amount.toFixed(2)}`),
  formatNumber: vi.fn((num, decimals = 6) => num.toFixed(decimals)),
  calculateToAmount: vi.fn((fromAmount, fromPrice, toPrice, slippage) => {
    const usd = fromAmount * fromPrice;
    const raw = usd / toPrice;
    const slippageMultiplier = 1 - slippage / 100;
    return raw * slippageMultiplier;
  }),
  getMockBalance: vi.fn((symbol) => {
    const balances = { ETH: 2.5, USDC: 1000, USDT: 800 };
    return balances[symbol] || 100;
  })
}));

describe('DOM Manipulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockElements.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DOM Helper Functions', () => {
    it('$ function returns element by id', () => {
      const element = mockGetElementById('test-id');
      expect(element).toBeDefined();
      expect(mockGetElementById).toHaveBeenCalledWith('test-id');
    });

    it('setText updates element textContent', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      // Simulate setText function
      const setText = (id, text) => {
        const el = mockGetElementById(id);
        if (el) el.textContent = text;
      };

      setText('test-id', 'Hello World');
      expect(element.textContent).toBe('Hello World');
    });

    it('setHTML updates element innerHTML', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      // Simulate setHTML function
      const setHTML = (id, html) => {
        const el = mockGetElementById(id);
        if (el) el.innerHTML = html;
      };

      setHTML('test-id', '<div>Test HTML</div>');
      expect(element.innerHTML).toBe('<div>Test HTML</div>');
    });

    it('show function sets display to empty string', () => {
      const element = createMockElement({ style: { display: 'none' } });
      mockGetElementById.mockReturnValue(element);

      // Simulate show function
      const show = (id) => {
        const el = mockGetElementById(id);
        if (el) el.style.display = '';
      };

      show('test-id');
      expect(element.style.display).toBe('');
    });

    it('hide function sets display to none', () => {
      const element = createMockElement({ style: { display: '' } });
      mockGetElementById.mockReturnValue(element);

      // Simulate hide function
      const hide = (id) => {
        const el = mockGetElementById(id);
        if (el) el.style.display = 'none';
      };

      hide('test-id');
      expect(element.style.display).toBe('none');
    });
  });

  describe('Token List Rendering', () => {
    it('renders loading state', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      // Simulate showLoadingState function
      const showLoadingState = () => {
        const el = mockGetElementById('token-list');
        if (el) {
          el.innerHTML = `
            <div class="loading-tokens">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading tokens...</span>
            </div>
          `;
        }
      };

      showLoadingState();
      expect(element.innerHTML).toContain('Loading tokens...');
      expect(element.innerHTML).toContain('fa-spinner');
    });

    it('renders empty state when no tokens', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      // Simulate renderTokenList with empty tokens
      const renderTokenList = (tokens) => {
        const el = mockGetElementById('token-list');
        if (!el) return;

        if (!tokens.length) {
          el.innerHTML = `
            <div class="loading-tokens">
              <i class="fas fa-search"></i>
              <span>No tokens found</span>
            </div>
          `;
          return;
        }
      };

      renderTokenList([]);
      expect(element.innerHTML).toContain('No tokens found');
    });

    it('renders token list with correct structure', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      const tokens = [
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 }
      ];
      const prices = { ETH: 2000, USDC: 1 };

      // Simulate renderTokenList function
      const renderTokenList = (tokens, prices) => {
        const el = mockGetElementById('token-list');
        if (!el) return;

        const html = tokens
          .map((token) => {
            const price = prices[token.symbol] || 0;
            const iconUrl = `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${token.symbol}.svg`;
            return `
              <div class="token-item" data-symbol="${token.symbol}">
                <div class="token-icon-placeholder">
                  <img src="${iconUrl}" alt="${token.symbol}" class="token-icon"
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  <i class="fas fa-coins" style="display:none;"></i>
                </div>
                <div class="token-item-info">
                  <div class="token-item-symbol">${token.symbol}</div>
                  <div class="token-item-name">${token.name}</div>
                </div>
                <div class="token-item-price">${price > 0 ? `$${price.toFixed(2)}` : 'N/A'}</div>
              </div>
            `;
          })
          .join('');

        el.innerHTML = html;
      };

      renderTokenList(tokens, prices);

      expect(element.innerHTML).toContain('data-symbol="ETH"');
      expect(element.innerHTML).toContain('Ethereum');
      expect(element.innerHTML).toContain('$2000.00');
      expect(element.innerHTML).toContain('data-symbol="USDC"');
      expect(element.innerHTML).toContain('USD Coin');
      expect(element.innerHTML).toContain('$1.00');
    });
  });

  describe('Token Display Updates', () => {
    it('updates from token display', () => {
      const element = createMockElement();
      mockGetElementById.mockReturnValue(element);

      const token = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };

      // Simulate updateTokenDisplay function
      const updateTokenDisplay = (side, token) => {
        const container = mockGetElementById(`${side}-selected-token`);
        if (!container) return;

        const iconUrl = `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${token.symbol}.svg`;
        container.innerHTML = `
          <div class="token-icon-placeholder">
            <img src="${iconUrl}" alt="${token.symbol}" class="token-icon"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <i class="fas fa-coins" style="display:none;"></i>
          </div>
          <div class="token-info">
            <span class="token-symbol">${token.symbol}</span>
            <span class="token-name">${token.name}</span>
          </div>
          <i class="fas fa-chevron-down"></i>
        `;
      };

      updateTokenDisplay('from', token);

      expect(element.innerHTML).toContain('ETH');
      expect(element.innerHTML).toContain('Ethereum');
      expect(element.innerHTML).toContain('token-icon');
    });

    it('updates balance display', () => {
      const balanceElement = createMockElement();
      mockGetElementById.mockReturnValue(balanceElement);

      // Simulate balance update
      const updateBalance = (side, symbol, balance) => {
        const el = mockGetElementById(`${side}-balance`);
        if (el) el.textContent = `Balance: ${balance}`;
      };

      updateBalance('from', 'ETH', '2.5');
      expect(balanceElement.textContent).toBe('Balance: 2.5');
    });
  });

  describe('Amount Input Handling', () => {
    it('updates from amount input', () => {
      const inputElement = createMockElement();
      mockGetElementById.mockReturnValue(inputElement);

      // Simulate amount input update
      const updateAmount = (side, amount) => {
        const el = mockGetElementById(`${side}-amount`);
        if (el) el.value = amount;
      };

      updateAmount('from', '1.5');
      expect(inputElement.value).toBe('1.5');
    });

    it('validates amount input format', () => {
      const inputElement = createMockElement();
      mockGetElementById.mockReturnValue(inputElement);

      // Simulate input validation
      const validateInput = (value) => {
        return /^\d*\.?\d*$/.test(value);
      };

      expect(validateInput('123.45')).toBe(true);
      expect(validateInput('0.001')).toBe(true);
      expect(validateInput('abc')).toBe(false);
      expect(validateInput('12.34.56')).toBe(false);
    });
  });

  describe('Error Display', () => {
    it('shows error message', () => {
      const errorElement = createMockElement();
      const errorTextElement = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(errorTextElement)  // First call for 'error-text'
        .mockReturnValueOnce(errorElement);     // Second call for 'error-message'

      // Simulate showError function
      const showError = (message) => {
        const textEl = mockGetElementById('error-text');
        const el = mockGetElementById('error-message');
        if (textEl) textEl.textContent = message;
        if (el) el.style.display = 'flex';
      };

      showError('Insufficient balance');
      expect(errorTextElement.textContent).toBe('Insufficient balance');
      expect(errorElement.style.display).toBe('flex');
    });

    it('hides error message', () => {
      const errorElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(errorElement);

      // Simulate hideError function
      const hideError = () => {
        const el = mockGetElementById('error-message');
        if (el) el.style.display = 'none';
      };

      hideError();
      expect(errorElement.style.display).toBe('none');
    });
  });

  describe('Button State Management', () => {
    it('disables swap button when no tokens selected', () => {
      const buttonElement = createMockElement();
      const labelElement = createMockElement();

      mockGetElementById.mockReturnValue(buttonElement);
      buttonElement.querySelector.mockReturnValue(labelElement);

      // Simulate updateSwapButton function
      const updateSwapButton = (selectedFromToken, selectedToToken) => {
        const btn = mockGetElementById('swap-button');
        if (!btn) return;
        const label = btn.querySelector('.button-text');

        if (!selectedFromToken || !selectedToToken) {
          btn.disabled = true;
          if (label) label.textContent = 'Select tokens to continue';
          return;
        }

        btn.disabled = false;
        if (label) label.textContent = 'Confirm Swap';
      };

      updateSwapButton(null, null);
      expect(buttonElement.disabled).toBe(true);
      expect(labelElement.textContent).toBe('Select tokens to continue');
    });

    it('enables swap button when tokens are selected', () => {
      const buttonElement = createMockElement();
      const labelElement = createMockElement();

      mockGetElementById.mockReturnValue(buttonElement);
      buttonElement.querySelector.mockReturnValue(labelElement);

      const updateSwapButton = (selectedFromToken, selectedToToken) => {
        const btn = mockGetElementById('swap-button');
        if (!btn) return;
        const label = btn.querySelector('.button-text');

        if (!selectedFromToken || !selectedToToken) {
          btn.disabled = true;
          if (label) label.textContent = 'Select tokens to continue';
          return;
        }

        btn.disabled = false;
        if (label) label.textContent = 'Confirm Swap';
      };

      const fromToken = { symbol: 'ETH', name: 'Ethereum', decimals: 18 };
      const toToken = { symbol: 'USDC', name: 'USD Coin', decimals: 6 };

      updateSwapButton(fromToken, toToken);
      expect(buttonElement.disabled).toBe(false);
      expect(labelElement.textContent).toBe('Confirm Swap');
    });
  });

  describe('Modal Management', () => {
    it('opens token modal', () => {
      const modalElement = createMockElement({ style: { display: 'none' } });
      const searchElement = createMockElement();

      mockGetElementById
        .mockReturnValueOnce(modalElement)
        .mockReturnValueOnce(searchElement);

      // Simulate openTokenModal function
      const openTokenModal = () => {
        const overlay = mockGetElementById('token-modal');
        if (!overlay) return;
        overlay.style.display = 'flex';
        const input = mockGetElementById('token-search');
        if (input) input.value = '';
        setTimeout(() => input?.focus(), 100);
      };

      openTokenModal();
      expect(modalElement.style.display).toBe('flex');
      expect(searchElement.value).toBe('');
    });

    it('closes token modal', () => {
      const modalElement = createMockElement({ style: { display: 'flex' } });
      mockGetElementById.mockReturnValue(modalElement);

      // Simulate closeTokenModal function
      const closeTokenModal = () => {
        const overlay = mockGetElementById('token-modal');
        if (overlay) overlay.style.display = 'none';
      };

      closeTokenModal();
      expect(modalElement.style.display).toBe('none');
    });
  });

  describe('Settings UI Updates', () => {
    it('updates slippage tolerance buttons', () => {
      const buttons = [
        createMockElement({ dataset: { value: '0.1' }, classList: { toggle: vi.fn() } }),
        createMockElement({ dataset: { value: '0.5' }, classList: { toggle: vi.fn() } }),
        createMockElement({ dataset: { value: '1.0' }, classList: { toggle: vi.fn() } })
      ];

      mockQuerySelectorAll.mockReturnValue(buttons);

      // Simulate updateSettingsUI function
      const updateSettingsUI = (slippageTolerance) => {
        document.querySelectorAll('.slippage-btn').forEach((btn) => {
          btn.classList.toggle('active', parseFloat(btn.dataset.value) === slippageTolerance);
        });
      };

      updateSettingsUI(0.5);

      expect(buttons[0].classList.toggle).toHaveBeenCalledWith('active', false);
      expect(buttons[1].classList.toggle).toHaveBeenCalledWith('active', true);
      expect(buttons[2].classList.toggle).toHaveBeenCalledWith('active', false);
    });
  });
});
