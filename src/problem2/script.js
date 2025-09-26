// Ensure CSS is loaded when using Vite bundling as well as via link tag
import './style.css';

// Currency Swap Application
class CurrencySwap {
  constructor() {
    this.tokens = [];
    this.prices = {};
    this.selectedFromToken = null;
    this.selectedToToken = null;
    this.currentSelector = null;
    this.slippageTolerance = 0.5;
    this.transactionDeadline = 20;

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadTokenData();
    this.updateUI();
  }

  bindEvents() {
    // Token selector events
    document.getElementById('from-token-selector').addEventListener('click', () => {
      this.currentSelector = 'from';
      this.openTokenModal();
    });

    document.getElementById('to-token-selector').addEventListener('click', () => {
      this.currentSelector = 'to';
      this.openTokenModal();
    });

    // Amount input events
    document.getElementById('from-amount').addEventListener('input', (e) => {
      this.handleAmountChange(e.target.value, 'from');
    });

    // Swap tokens button
    document.getElementById('swap-tokens-btn').addEventListener('click', () => {
      this.swapTokens();
    });

    // MAX button
    document.getElementById('max-button').addEventListener('click', () => {
      this.setMaxAmount();
    });

    // Form submission
    document.getElementById('swap-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSwapSubmission();
    });

    // Modal events
    document.getElementById('close-modal').addEventListener('click', () => {
      this.closeTokenModal();
    });

    document.getElementById('token-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('token-modal')) {
        this.closeTokenModal();
      }
    });

    // Settings events
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettingsModal();
    });

    document.getElementById('close-settings-modal').addEventListener('click', () => {
      this.closeSettingsModal();
    });

    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('settings-modal')) {
        this.closeSettingsModal();
      }
    });

    // Search functionality
    document.getElementById('token-search').addEventListener('input', (e) => {
      this.filterTokens(e.target.value);
    });

    // Settings functionality
    document.querySelectorAll('.slippage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setSlippageTolerance(parseFloat(btn.dataset.value));
      });
    });

    document.getElementById('custom-slippage').addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && value > 0) {
        this.setSlippageTolerance(value);
      }
    });

    document.getElementById('deadline').addEventListener('input', (e) => {
      this.transactionDeadline = parseInt(e.target.value) || 20;
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTokenModal();
        this.closeSettingsModal();
      }
    });
  }

  async loadTokenData() {
    try {
      // Show loading state
      this.showLoadingState();

      // Load token prices
      const pricesResponse = await fetch('https://interview.switcheo.com/prices.json');
      const pricesData = await pricesResponse.json();

      // Process prices data
      this.prices = {};
      pricesData.forEach(item => {
        if (item.price && item.price > 0) {
          this.prices[item.currency] = item.price;
        }
      });

      // Define popular tokens with additional metadata
      this.tokens = [
        { symbol: 'SWTH', name: 'Switcheo Token', decimals: 8 },
        { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
        { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
        { symbol: 'ZIL', name: 'Zilliqa', decimals: 12 },
        { symbol: 'bNEO', name: 'Wrapped Neo', decimals: 8 },
        { symbol: 'BUSD', name: 'Binance USD', decimals: 18 },
        { symbol: 'iUSD', name: 'iZiSwap USD', decimals: 18 },
        { symbol: 'USC', name: 'USC Token', decimals: 18 },
        { symbol: 'WETH', name: 'Wrapped Ethereum', decimals: 18 },
        { symbol: 'LUNA', name: 'Terra Luna', decimals: 6 },
        { symbol: 'ATOM', name: 'Cosmos', decimals: 6 },
        { symbol: 'OSMO', name: 'Osmosis', decimals: 6 },
        { symbol: 'STARS', name: 'Stargaze', decimals: 6 },
        { symbol: 'HUAHUA', name: 'Chihuahua', decimals: 6 },
        { symbol: 'CRO', name: 'Crypto.com Coin', decimals: 8 },
        { symbol: 'EVMOS', name: 'Evmos', decimals: 18 },
        { symbol: 'OKB', name: 'OKB', decimals: 18 },
        { symbol: 'OKT', name: 'OKExChain Token', decimals: 18 },
        { symbol: 'STEVMOS', name: 'Stride Staked EVMOS', decimals: 18 },
        { symbol: 'STEVMOS', name: 'Stride Staked EVMOS', decimals: 18 },
        { symbol: 'STOSMO', name: 'Stride Staked OSMO', decimals: 6 },
        { symbol: 'STATOM', name: 'Stride Staked ATOM', decimals: 6 },
        { symbol: 'STLUNA', name: 'Stride Staked LUNA', decimals: 6 },
        { symbol: 'STTSTARS', name: 'Stride Staked STARS', decimals: 6 },
        { symbol: 'SWTH', name: 'Switcheo Token', decimals: 8 },
        { symbol: 'USD', name: 'US Dollar', decimals: 2 },
        { symbol: 'TMAC', name: 'TMAC Token', decimals: 18 },
        { symbol: 'USDCDH', name: 'USDC Demex Hub', decimals: 6 }
      ].filter(token => this.prices[token.symbol]); // Only include tokens with prices

      // Sort tokens by price (descending) and name
      this.tokens.sort((a, b) => {
        const priceA = this.prices[a.symbol] || 0;
        const priceB = this.prices[b.symbol] || 0;
        if (priceA !== priceB) {
          return priceB - priceA; // Sort by price descending
        }
        return a.name.localeCompare(b.name); // Then by name
      });

      // Update volume display (mock data)
      const totalVolume = this.calculateTotalVolume();
      document.getElementById('total-volume').textContent = this.formatCurrency(totalVolume);

      console.log(`Loaded ${this.tokens.length} tokens with prices`);

    } catch (error) {
      console.error('Error loading token data:', error);
      this.showError('Failed to load token data. Please refresh the page.');
    }
  }

  calculateTotalVolume() {
    // Mock calculation for 24h volume
    const baseVolume = 125000000; // $125M base
    const randomMultiplier = 0.8 + Math.random() * 0.4; // 0.8x to 1.2x
    return baseVolume * randomMultiplier;
  }

  showLoadingState() {
    document.getElementById('token-list').innerHTML = `
      <div class="loading-tokens">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Loading tokens...</span>
      </div>
    `;
  }

  openTokenModal() {
    document.getElementById('token-modal').style.display = 'flex';
    document.getElementById('token-search').value = '';
    this.renderTokenList();

    // Focus search input
    setTimeout(() => {
      document.getElementById('token-search').focus();
    }, 100);
  }

  closeTokenModal() {
    document.getElementById('token-modal').style.display = 'none';
    this.currentSelector = null;
  }

  openSettingsModal() {
    document.getElementById('settings-modal').style.display = 'flex';
    this.updateSettingsUI();
  }

  closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
  }

  updateSettingsUI() {
    // Update slippage buttons
    document.querySelectorAll('.slippage-btn').forEach(btn => {
      btn.classList.remove('active');
      if (parseFloat(btn.dataset.value) === this.slippageTolerance) {
        btn.classList.add('active');
      }
    });

    // Update custom slippage
    if (![0.1, 0.5, 1.0].includes(this.slippageTolerance)) {
      document.getElementById('custom-slippage').value = this.slippageTolerance;
    } else {
      document.getElementById('custom-slippage').value = '';
    }

    // Update deadline
    document.getElementById('deadline').value = this.transactionDeadline;
  }

  setSlippageTolerance(value) {
    this.slippageTolerance = value;
    this.updateSettingsUI();
  }

  renderTokenList(filteredTokens = null) {
    const tokens = filteredTokens || this.tokens;
    const tokenListEl = document.getElementById('token-list');

    if (tokens.length === 0) {
      tokenListEl.innerHTML = `
        <div class="loading-tokens">
          <i class="fas fa-search"></i>
          <span>No tokens found</span>
        </div>
      `;
      return;
    }

    tokenListEl.innerHTML = tokens.map(token => {
      const price = this.prices[token.symbol] || 0;
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
          <div class="token-item-price">
            ${price > 0 ? this.formatCurrency(price) : 'N/A'}
          </div>
        </div>
      `;
    }).join('');

    // Add click handlers
    tokenListEl.querySelectorAll('.token-item').forEach(item => {
      item.addEventListener('click', () => {
        const symbol = item.dataset.symbol;
        const token = tokens.find(t => t.symbol === symbol);
        this.selectToken(token);
      });
    });
  }

  filterTokens(searchTerm) {
    if (!searchTerm.trim()) {
      this.renderTokenList();
      return;
    }

    const filtered = this.tokens.filter(token =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.renderTokenList(filtered);
  }

  selectToken(token) {
    if (this.currentSelector === 'from') {
      this.selectedFromToken = token;
      this.updateTokenDisplay('from', token);
    } else if (this.currentSelector === 'to') {
      this.selectedToToken = token;
      this.updateTokenDisplay('to', token);
    }

    this.closeTokenModal();
    this.updateSwapButton();
    this.calculateAmounts();
  }

  updateTokenDisplay(side, token) {
    const container = document.getElementById(`${side}-selected-token`);
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

    // Update balance display (mock data)
    const balance = this.getMockBalance(token.symbol);
    document.getElementById(`${side}-balance`).textContent =
      `Balance: ${this.formatNumber(balance, token.decimals)}`;
  }

  getMockBalance(symbol) {
    // Generate realistic mock balances
    const balances = {
      'ETH': 1.5 + Math.random() * 3,
      'USDC': 1000 + Math.random() * 5000,
      'USDT': 800 + Math.random() * 4000,
      'WBTC': 0.05 + Math.random() * 0.2,
      'SWTH': 10000 + Math.random() * 50000
    };

    return balances[symbol] || (Math.random() * 1000);
  }

  handleAmountChange(value, side) {
    // Validate input
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    if (side === 'from') {
      this.calculateAmounts();
      this.validateAmount(value);
    }
  }

  calculateAmounts() {
    const fromAmount = parseFloat(document.getElementById('from-amount').value) || 0;

    if (!this.selectedFromToken || !this.selectedToToken || fromAmount <= 0) {
      document.getElementById('to-amount').value = '';
      document.getElementById('from-usd-value').textContent = '~$0.00';
      document.getElementById('to-usd-value').textContent = '~$0.00';
      document.getElementById('price-info').style.display = 'none';
      return;
    }

    const fromPrice = this.prices[this.selectedFromToken.symbol] || 0;
    const toPrice = this.prices[this.selectedToToken.symbol] || 0;

    if (fromPrice === 0 || toPrice === 0) {
      this.showError('Price data unavailable for selected tokens');
      return;
    }

    // Calculate amounts
    const fromUsdValue = fromAmount * fromPrice;
    const toAmount = fromUsdValue / toPrice;

    // Apply slippage for more realistic calculation
    const slippageMultiplier = 1 - (this.slippageTolerance / 100);
    const finalToAmount = toAmount * slippageMultiplier;

    // Update UI
    document.getElementById('to-amount').value = this.formatNumber(finalToAmount, this.selectedToToken.decimals);
    document.getElementById('from-usd-value').textContent = `~${this.formatCurrency(fromUsdValue)}`;
    document.getElementById('to-usd-value').textContent = `~${this.formatCurrency(finalToAmount * toPrice)}`;

    // Update exchange rate and price info
    this.updatePriceInfo(fromAmount, finalToAmount);

    this.hideError();
  }

  updatePriceInfo(fromAmount, toAmount) {
    if (fromAmount <= 0 || toAmount <= 0) return;

    const rate = toAmount / fromAmount;
    document.getElementById('exchange-rate').textContent =
      `1 ${this.selectedFromToken.symbol} = ${this.formatNumber(rate, 6)} ${this.selectedToToken.symbol}`;

    // Calculate price impact (mock calculation)
    const priceImpact = Math.min(0.1 + (fromAmount * 0.001), 5); // Mock impact
    const impactEl = document.getElementById('price-impact');
    impactEl.textContent = `${priceImpact.toFixed(2)}%`;

    // Set impact color
    impactEl.className = priceImpact < 1 ? 'impact-low' :
                        priceImpact < 3 ? 'impact-medium' : 'impact-high';

    // Update network fee (mock)
    const networkFee = 2.50 + Math.random() * 2; // $2.50 - $4.50
    document.getElementById('network-fee').textContent = `~${this.formatCurrency(networkFee)}`;

    document.getElementById('price-info').style.display = 'block';
  }

  validateAmount(amount) {
    const numAmount = parseFloat(amount);

    if (!this.selectedFromToken || isNaN(numAmount) || numAmount <= 0) {
      this.hideError();
      return true;
    }

    const balance = this.getMockBalance(this.selectedFromToken.symbol);

    if (numAmount > balance) {
      this.showError(`Insufficient ${this.selectedFromToken.symbol} balance`);
      return false;
    }

    const minAmount = 0.001;
    if (numAmount < minAmount) {
      this.showError(`Minimum amount is ${minAmount} ${this.selectedFromToken.symbol}`);
      return false;
    }

    this.hideError();
    return true;
  }

  setMaxAmount() {
    if (!this.selectedFromToken) {
      this.showError('Please select a token first');
      return;
    }

    const balance = this.getMockBalance(this.selectedFromToken.symbol);
    document.getElementById('from-amount').value = this.formatNumber(balance, this.selectedFromToken.decimals);
    this.calculateAmounts();
  }

  swapTokens() {
    if (!this.selectedFromToken || !this.selectedToToken) return;

    // Swap the tokens
    [this.selectedFromToken, this.selectedToToken] = [this.selectedToToken, this.selectedFromToken];

    // Update displays
    this.updateTokenDisplay('from', this.selectedFromToken);
    this.updateTokenDisplay('to', this.selectedToToken);

    // Clear amounts and recalculate
    document.getElementById('from-amount').value = '';
    document.getElementById('to-amount').value = '';
    this.calculateAmounts();
  }

  updateSwapButton() {
    const button = document.getElementById('swap-button');
    const buttonText = button.querySelector('.button-text');

    if (!this.selectedFromToken || !this.selectedToToken) {
      button.disabled = true;
      buttonText.textContent = 'Select tokens to continue';
      return;
    }

    const fromAmount = parseFloat(document.getElementById('from-amount').value) || 0;

    if (fromAmount <= 0) {
      button.disabled = true;
      buttonText.textContent = 'Enter amount';
      return;
    }

    if (!this.validateAmount(fromAmount)) {
      button.disabled = true;
      buttonText.textContent = 'Invalid amount';
      return;
    }

    button.disabled = false;
    buttonText.textContent = 'Confirm Swap';
  }

  updateUI() {
    // Update swap button state when amounts change
    const fromAmountInput = document.getElementById('from-amount');
    fromAmountInput.addEventListener('input', () => {
      setTimeout(() => this.updateSwapButton(), 100);
    });
  }

  async handleSwapSubmission() {
    if (!this.selectedFromToken || !this.selectedToToken) return;

    const button = document.getElementById('swap-button');
    const buttonText = button.querySelector('.button-text');
    const loadingSpinner = button.querySelector('.loading-spinner');

    // Show loading state
    button.disabled = true;
    buttonText.textContent = 'Processing Swap...';
    loadingSpinner.style.display = 'block';

    try {
      // Simulate API call
      await this.simulateSwapTransaction();

      // Show success message
      this.showSwapSuccess();

    } catch (error) {
      console.error('Swap failed:', error);
      this.showError('Swap failed. Please try again.');

      // Reset button
      button.disabled = false;
      buttonText.textContent = 'Confirm Swap';
      loadingSpinner.style.display = 'none';
    }
  }

  async simulateSwapTransaction() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
  }

  showSwapSuccess() {
    // Generate mock transaction hash
    const txHash = '0x' + Array.from({length: 64}, () =>
      Math.floor(Math.random() * 16).toString(16)).join('');

    document.getElementById('tx-hash').textContent =
      txHash.substring(0, 10) + '...' + txHash.substring(54);

    document.getElementById('success-message').style.display = 'flex';

    // Hide success message after 5 seconds and reset form
    setTimeout(() => {
      this.resetForm();
      document.getElementById('success-message').style.display = 'none';
    }, 5000);
  }

  resetForm() {
    document.getElementById('from-amount').value = '';
    document.getElementById('to-amount').value = '';
    document.getElementById('from-usd-value').textContent = '~$0.00';
    document.getElementById('to-usd-value').textContent = '~$0.00';
    document.getElementById('price-info').style.display = 'none';

    const button = document.getElementById('swap-button');
    button.disabled = true;
    button.querySelector('.button-text').textContent = 'Select tokens to continue';
    button.querySelector('.loading-spinner').style.display = 'none';

    this.hideError();
  }

  showError(message) {
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorText.textContent = message;
    errorEl.style.display = 'flex';
  }

  hideError() {
    document.getElementById('error-message').style.display = 'none';
  }

  formatCurrency(amount, currency = 'USD') {
    if (amount === 0) return '$0.00';

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 6 : 2
    }).format(amount);
  }

  formatNumber(number, maxDecimals = 6) {
    if (number === 0) return '0';

    // For very small numbers, use more decimals
    if (number < 0.001 && number > 0) {
      return number.toFixed(8).replace(/\.?0+$/, '');
    }

    // For regular numbers, limit decimals
    const decimals = Math.min(maxDecimals,
      number < 1 ? 6 :
      number < 100 ? 4 : 2
    );

    return parseFloat(number.toFixed(decimals)).toLocaleString('en-US', {
      maximumFractionDigits: decimals
    });
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new CurrencySwap();
});

// Add some additional utility functions for enhanced user experience

// Service Worker registration for offline functionality
// Avoid registering in dev to prevent HMR conflicts
if ('serviceWorker' in navigator && !(import.meta && import.meta.env && import.meta.env.DEV)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Handle online/offline status
window.addEventListener('online', () => {
  document.body.classList.remove('offline');
  console.log('Back online');
});

window.addEventListener('offline', () => {
  document.body.classList.add('offline');
  console.log('Gone offline');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.getElementById('token-search');
    if (searchInput && searchInput.offsetParent !== null) {
      searchInput.focus();
    }
  }

  // Escape to clear inputs
  if (e.key === 'Escape') {
    const fromAmount = document.getElementById('from-amount');
    const toAmount = document.getElementById('to-amount');

    if (document.activeElement === fromAmount) {
      fromAmount.value = '';
      fromAmount.dispatchEvent(new Event('input'));
    }
  }
});

// Add performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log(`Page load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
    }, 0);
  });
}
