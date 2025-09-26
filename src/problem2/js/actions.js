// User actions (swap, select, etc.)

import { $, setText, setHTML, show, hide, updateTokenDisplay } from './dom-helpers.js';
import { formatCurrency, formatNumber, calculateToAmount, getMockBalance } from '../lib/utils.js';
import { validateAmount, showError, hideError, validateFormState } from './validation.js';
import { swapSelectedTokens } from './state.js';

// Amount calculations and display
export function updateExchangeInfo(state, fromAmount, toAmount) {
  if (fromAmount <= 0 || toAmount <= 0) return;

  const fromPrice = state.prices[state.selectedFromToken.symbol] || 0;
  const toPrice = state.prices[state.selectedToToken.symbol] || 0;

  if (fromPrice && toPrice) {
    const rate = fromPrice / toPrice;
    setText('exchange-rate', `1 ${state.selectedFromToken.symbol} = ${formatNumber(rate, 6)} ${state.selectedToToken.symbol}`);

    const impact = Math.abs(1 - rate) * 100;
    const impactEl = $('price-impact');
    if (impactEl) {
      impactEl.textContent = `${impact.toFixed(2)}%`;
      impactEl.className = impact < 0.1 ? 'impact-low' : impact < 1 ? 'impact-medium' : 'impact-high';
    }
  }
}

export function renderAmounts(state) {
  const fromAmount = parseFloat($('from-amount').value) || 0;
  const fromPrice = state.prices[state.selectedFromToken?.symbol] || 0;
  const toPrice = state.prices[state.selectedToToken?.symbol] || 0;

  if (fromAmount > 0 && state.selectedFromToken && state.selectedToToken && fromPrice && toPrice) {
    const toAmount = calculateToAmount(fromAmount, fromPrice, toPrice, state.slippageTolerance);
    $('to-amount').value = formatNumber(toAmount, state.selectedToToken.decimals);

    // Update USD values
    const fromUsd = fromAmount * fromPrice;
    const toUsd = toAmount * toPrice;
    setText('from-usd-value', `~${formatCurrency(fromUsd)}`);
    setText('to-usd-value', `~${formatCurrency(toUsd)}`);

    // Update exchange info
    updateExchangeInfo(state, fromAmount, toAmount);
    show('price-info');
  } else {
    $('to-amount').value = '';
    setText('from-usd-value', '~$0.00');
    setText('to-usd-value', '~$0.00');
    hide('price-info');
  }
}

// Swap button management
export function updateSwapButton(state) {
  const btn = $('swap-button');
  if (!btn) return;

  const validation = validateFormState(state);
  const fromAmount = parseFloat($('from-amount').value) || 0;

  if (!state.selectedFromToken || !state.selectedToToken) {
    btn.disabled = true;
    btn.querySelector('.button-text').textContent = 'Select tokens to continue';
  } else if (fromAmount <= 0) {
    btn.disabled = true;
    btn.querySelector('.button-text').textContent = 'Enter an amount';
  } else if (!validation.valid) {
    btn.disabled = true;
    btn.querySelector('.button-text').textContent = validation.errors[0];
  } else {
    btn.disabled = false;
    btn.querySelector('.button-text').textContent = 'Swap';
  }
}

// Token actions
export function setMaxAmount(state) {
  if (!state.selectedFromToken) {
    showError('Please select a token first');
    return;
  }
  const bal = getMockBalance(state.selectedFromToken.symbol);
  $('from-amount').value = formatNumber(bal, state.selectedFromToken.decimals);
  renderAmounts(state);
  updateSwapButton(state);
}

export function swapTokens(state) {
  if (!state.selectedFromToken || !state.selectedToToken) return;

  swapSelectedTokens(state);
  updateTokenDisplay(state, 'from', state.selectedFromToken);
  updateTokenDisplay(state, 'to', state.selectedToToken);
  $('from-amount').value = '';
  $('to-amount').value = '';
  renderAmounts(state);
  updateSwapButton(state);
}

// Form reset
export function resetForm(state) {
  $('from-amount').value = '';
  $('to-amount').value = '';
  setText('from-usd-value', '~$0.00');
  setText('to-usd-value', '~$0.00');
  hide('price-info');
  hideError();
  updateSwapButton(state);
}

// Success display
export function showSwapSuccess(state) {
  // Mock tx hash
  const hash = '0x' + Math.random().toString(16).substring(2, 12) + '...' + Math.random().toString(16).substring(2, 12);
  setText('tx-hash', hash);
  show('success-message');

  // Reset form after delay
  setTimeout(() => {
    hide('success-message');
    resetForm(state);
  }, 3000);
}

// These functions will be imported dynamically to avoid circular dependencies
