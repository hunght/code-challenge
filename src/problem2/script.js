import { formatCurrency, formatNumber, calculateToAmount, calculateTotalVolume, getMockBalance } from './lib/utils.js';

// -------------------------------
// Functional Currency Swap App
// -------------------------------

// State factory
function createState() {
  return {
    tokens: [],
    prices: {},
    selectedFromToken: null,
    selectedToToken: null,
    currentSelector: null,
    slippageTolerance: 0.5,
    transactionDeadline: 20,
  };
}

// -------------------------------
// DOM helpers
// -------------------------------
const $ = (id) => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.textContent = text; };
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const show = (id) => { const el = $(id); if (el) el.style.display = ''; };
const hide = (id) => { const el = $(id); if (el) el.style.display = 'none'; };

// -------------------------------
// Utils are imported from ./lib/utils.js
// -------------------------------

function showLoadingState() {
  setHTML('token-list', `
    <div class="loading-tokens">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading tokens...</span>
    </div>
  `);
}

function renderTokenList(state, list = null) {
  const tokens = list || state.tokens;
  if (!tokens.length) {
    setHTML('token-list', `
      <div class="loading-tokens">
        <i class="fas fa-search"></i>
        <span>No tokens found</span>
      </div>
    `);
    return;
  }

  const html = tokens
    .map((token) => {
      const price = state.prices[token.symbol] || 0;
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
          <div class="token-item-price">${price > 0 ? formatCurrency(price) : 'N/A'}</div>
        </div>
      `;
    })
    .join('');

  setHTML('token-list', html);

  // Wire up clicks
  Array.from(document.querySelectorAll('.token-item')).forEach((item) => {
    item.addEventListener('click', () => {
      const symbol = item.getAttribute('data-symbol');
      const token = tokens.find((t) => t.symbol === symbol);
      selectToken(state, token);
    });
  });
}

function updateTokenDisplay(state, side, token) {
  const container = $(`${side}-selected-token`);
  const iconUrl = `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${token.symbol}.svg`;
  if (!container) return;

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

  // Balance (mock)
  const bal = getMockBalance(token.symbol);
  setText(`${side}-balance`, `Balance: ${formatNumber(bal, token.decimals)}`);
}

function updateExchangeInfo(state, fromAmount, toAmount) {
  if (fromAmount <= 0 || toAmount <= 0) return;

  const rate = toAmount / fromAmount;
  setText(
    'exchange-rate',
    `1 ${state.selectedFromToken.symbol} = ${formatNumber(rate, 6)} ${state.selectedToToken.symbol}`
  );

  const priceImpact = Math.min(0.1 + fromAmount * 0.001, 5);
  const impactEl = $('price-impact');
  if (impactEl) {
    impactEl.textContent = `${priceImpact.toFixed(2)}%`;
    impactEl.className = priceImpact < 1 ? 'impact-low' : priceImpact < 3 ? 'impact-medium' : 'impact-high';
  }

  const fee = 2.5 + Math.random() * 2;
  setText('network-fee', `~${formatCurrency(fee)}`);
  show('price-info');
}

function renderAmounts(state) {
  const fromAmount = parseFloat($('from-amount').value) || 0;

  if (!state.selectedFromToken || !state.selectedToToken || fromAmount <= 0) {
    $('to-amount').value = '';
    setText('from-usd-value', '~$0.00');
    setText('to-usd-value', '~$0.00');
    hide('price-info');
    return;
  }

  const fromPrice = state.prices[state.selectedFromToken.symbol] || 0;
  const toPrice = state.prices[state.selectedToToken.symbol] || 0;

  if (fromPrice === 0 || toPrice === 0) {
    showError('Price data unavailable for selected tokens');
    return;
  }

  const toAmount = calculateToAmount(fromAmount, fromPrice, toPrice, state.slippageTolerance);
  $('to-amount').value = formatNumber(toAmount, state.selectedToToken.decimals);

  const fromUsd = fromAmount * fromPrice;
  setText('from-usd-value', `~${formatCurrency(fromUsd)}`);
  setText('to-usd-value', `~${formatCurrency(toAmount * toPrice)}`);

  updateExchangeInfo(state, fromAmount, toAmount);
  hideError();
}

function updateSwapButton(state) {
  const btn = $('swap-button');
  if (!btn) return;
  const label = btn.querySelector('.button-text');

  if (!state.selectedFromToken || !state.selectedToToken) {
    btn.disabled = true;
    if (label) label.textContent = 'Select tokens to continue';
    return;
  }

  const amount = parseFloat($('from-amount').value) || 0;
  if (amount <= 0) {
    btn.disabled = true;
    if (label) label.textContent = 'Enter amount';
    return;
  }

  if (!validateAmount(state, amount)) {
    btn.disabled = true;
    if (label) label.textContent = 'Invalid amount';
    return;
  }

  btn.disabled = false;
  if (label) label.textContent = 'Confirm Swap';
}

// -------------------------------
// Validation
// -------------------------------
function validateAmount(state, amount) {
  const num = parseFloat(amount);
  if (!state.selectedFromToken || isNaN(num) || num <= 0) {
    hideError();
    return true;
  }

  const bal = getMockBalance(state.selectedFromToken.symbol);
  if (num > bal) {
    showError(`Insufficient ${state.selectedFromToken.symbol} balance`);
    return false;
  }

  const min = 0.001;
  if (num < min) {
    showError(`Minimum amount is ${min} ${state.selectedFromToken.symbol}`);
    return false;
  }

  hideError();
  return true;
}

function showError(message) {
  setText('error-text', message);
  const el = $('error-message');
  if (el) el.style.display = 'flex';
}

function hideError() {
  hide('error-message');
}

// -------------------------------
// Token modal + settings
// -------------------------------
function openTokenModal(state) {
  const overlay = $('token-modal');
  if (!overlay) return;
  overlay.style.display = 'flex';
  const input = $('token-search');
  if (input) input.value = '';
  renderTokenList(state);
  setTimeout(() => $('token-search')?.focus(), 100);
}

function closeTokenModal(state) {
  const overlay = $('token-modal');
  if (overlay) overlay.style.display = 'none';
  state.currentSelector = null;
}

function openSettingsModal(state) {
  const overlay = $('settings-modal');
  if (!overlay) return;
  overlay.style.display = 'flex';
  updateSettingsUI(state);
}

function closeSettingsModal() {
  const overlay = $('settings-modal');
  if (overlay) overlay.style.display = 'none';
}

function updateSettingsUI(state) {
  document.querySelectorAll('.slippage-btn').forEach((btn) => {
    btn.classList.toggle('active', parseFloat(btn.dataset.value) === state.slippageTolerance);
  });

  const custom = $('custom-slippage');
  if (custom) custom.value = [0.1, 0.5, 1.0].includes(state.slippageTolerance) ? '' : String(state.slippageTolerance);

  const deadline = $('deadline');
  if (deadline) deadline.value = state.transactionDeadline;
}

function setSlippageTolerance(state, value) {
  state.slippageTolerance = value;
  updateSettingsUI(state);
  renderAmounts(state);
}

// -------------------------------
// Actions
// -------------------------------
function selectToken(state, token) {
  if (state.currentSelector === 'from') {
    state.selectedFromToken = token;
    updateTokenDisplay(state, 'from', token);
  } else if (state.currentSelector === 'to') {
    state.selectedToToken = token;
    updateTokenDisplay(state, 'to', token);
  }
  closeTokenModal(state);
  updateSwapButton(state);
  renderAmounts(state);
}

function setMaxAmount(state) {
  if (!state.selectedFromToken) {
    showError('Please select a token first');
    return;
  }
  const bal = getMockBalance(state.selectedFromToken.symbol);
  $('from-amount').value = formatNumber(bal, state.selectedFromToken.decimals);
  renderAmounts(state);
  updateSwapButton(state);
}

function swapTokens(state) {
  if (!state.selectedFromToken || !state.selectedToToken) return;
  [state.selectedFromToken, state.selectedToToken] = [state.selectedToToken, state.selectedFromToken];
  updateTokenDisplay(state, 'from', state.selectedFromToken);
  updateTokenDisplay(state, 'to', state.selectedToToken);
  $('from-amount').value = '';
  $('to-amount').value = '';
  renderAmounts(state);
  updateSwapButton(state);
}

async function handleSwapSubmission(state) {
  if (!state.selectedFromToken || !state.selectedToToken) return;
  const btn = $('swap-button');
  const label = btn?.querySelector('.button-text');
  const spinner = btn?.querySelector('.loading-spinner');

  if (btn) btn.disabled = true;
  if (label) label.textContent = 'Processing Swap...';
  if (spinner) spinner.style.display = 'block';

  try {
    await simulateSwapTransaction();
    showSwapSuccess(state);
  } catch (e) {
    console.error('Swap failed:', e);
    showError('Swap failed. Please try again.');
    if (btn) btn.disabled = false;
    if (label) label.textContent = 'Confirm Swap';
    if (spinner) spinner.style.display = 'none';
  }
}

function resetForm(state) {
  $('from-amount').value = '';
  $('to-amount').value = '';
  setText('from-usd-value', '~$0.00');
  setText('to-usd-value', '~$0.00');
  hide('price-info');

  const btn = $('swap-button');
  if (btn) {
    btn.disabled = true;
    const label = btn.querySelector('.button-text');
    const spinner = btn.querySelector('.loading-spinner');
    if (label) label.textContent = 'Select tokens to continue';
    if (spinner) spinner.style.display = 'none';
  }
  hideError();
}

function showSwapSuccess(state) {
  // Mock tx hash
  const txHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  setText('tx-hash', txHash.substring(0, 10) + '...' + txHash.substring(54));
  const overlay = $('success-message');
  if (overlay) overlay.style.display = 'flex';
  setTimeout(() => {
    resetForm(state);
    if (overlay) overlay.style.display = 'none';
  }, 5000);
}

async function simulateSwapTransaction() {
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 3000));
  if (Math.random() < 0.1) throw new Error('Network error');
}

// -------------------------------
// Data loading
// -------------------------------
async function loadTokenData(state) {
  try {
    showLoadingState();
    const resp = await fetch('https://interview.switcheo.com/prices.json');
    const data = await resp.json();

    state.prices = {};
    data.forEach((item) => {
      if (item.price && item.price > 0) state.prices[item.currency] = item.price;
    });

    state.tokens = [
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
      { symbol: 'USDCDH', name: 'USDC Demex Hub', decimals: 6 },
    ].filter((t) => state.prices[t.symbol]);

    state.tokens.sort((a, b) => {
      const pa = state.prices[a.symbol] || 0;
      const pb = state.prices[b.symbol] || 0;
      if (pa !== pb) return pb - pa;
      return a.name.localeCompare(b.name);
    });

    const vol = calculateTotalVolume();
    setText('total-volume', formatCurrency(vol));
  } catch (e) {
    console.error('Error loading token data:', e);
    showError('Failed to load token data. Please refresh the page.');
  }
}

// -------------------------------
// Event wiring
// -------------------------------
function bindEvents(state) {
  // Token selectors
  $('from-token-selector')?.addEventListener('click', () => {
    state.currentSelector = 'from';
    openTokenModal(state);
  });
  $('to-token-selector')?.addEventListener('click', () => {
    state.currentSelector = 'to';
    openTokenModal(state);
  });

  // Amount input
  $('from-amount')?.addEventListener('input', (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) return; // allow only decimals
    renderAmounts(state);
    validateAmount(state, value);
    // debounce-ish swap button update
    setTimeout(() => updateSwapButton(state), 100);
  });

  // Swap tokens
  $('swap-tokens-btn')?.addEventListener('click', () => swapTokens(state));

  // MAX
  $('max-button')?.addEventListener('click', () => setMaxAmount(state));

  // Submit
  $('swap-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSwapSubmission(state);
  });

  // Modals
  $('close-modal')?.addEventListener('click', () => closeTokenModal(state));
  $('token-modal')?.addEventListener('click', (e) => {
    if (e.target === $('token-modal')) closeTokenModal(state);
  });

  $('settings-btn')?.addEventListener('click', () => openSettingsModal(state));
  $('close-settings-modal')?.addEventListener('click', () => closeSettingsModal());
  $('settings-modal')?.addEventListener('click', (e) => {
    if (e.target === $('settings-modal')) closeSettingsModal();
  });

  // Search
  $('token-search')?.addEventListener('input', (e) => filterTokens(state, e.target.value));

  // Settings
  document.querySelectorAll('.slippage-btn').forEach((btn) => {
    btn.addEventListener('click', () => setSlippageTolerance(state, parseFloat(btn.dataset.value)));
  });

  $('custom-slippage')?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) setSlippageTolerance(state, val);
  });

  $('deadline')?.addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    state.transactionDeadline = Number.isFinite(v) ? v : 20;
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTokenModal(state);
      closeSettingsModal();
    }
  });

  // Shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const search = $('token-search');
      if (search && search.offsetParent !== null) search.focus();
    }
    if (e.key === 'Escape') {
      const from = $('from-amount');
      if (document.activeElement === from) {
        from.value = '';
        from.dispatchEvent(new Event('input'));
      }
    }
  });

  // Online/offline
  window.addEventListener('online', () => document.body.classList.remove('offline'));
  window.addEventListener('offline', () => document.body.classList.add('offline'));
}

function filterTokens(state, term) {
  if (!term?.trim()) {
    renderTokenList(state);
    return;
  }
  const q = term.toLowerCase();
  const filtered = state.tokens.filter(
    (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  );
  renderTokenList(state, filtered);
}

// -------------------------------
// App init
// -------------------------------
async function init() {
  const state = createState();
  bindEvents(state);
  await loadTokenData(state);
  renderTokenList(state);
  updateSettingsUI(state);
  updateSwapButton(state);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});

// -------------------------------
// Service Worker (avoid in dev)
// -------------------------------
if ('serviceWorker' in navigator && !(import.meta && import.meta.env && import.meta.env.DEV)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => console.log('SW registered: ', reg))
      .catch((err) => console.log('SW registration failed: ', err));
  });
}

// -------------------------------
// Performance monitoring
// -------------------------------
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) console.log(`Page load time: ${nav.loadEventEnd - nav.loadEventStart}ms`);
    }, 0);
  });
}
