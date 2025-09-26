// Event binding and handling

import { $, setText, renderTokenList } from './dom-helpers.js';
import { openTokenModal, closeTokenModal, openSettingsModal, closeSettingsModal, selectToken, filterTokens } from './modals.js';
import { setMaxAmount, swapTokens, renderAmounts, updateSwapButton, showSwapSuccess } from './actions.js';
import { validateAmount, showError, hideError, validateInputFormat, sanitizeInput } from './validation.js';
import { updateSlippageTolerance, updateTransactionDeadline } from './state.js';

// Event binding function
export function bindEvents(state) {
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
    const value = sanitizeInput(e.target.value);
    e.target.value = value;

    if (value && !validateInputFormat(value)) {
      showError('Please enter a valid number');
      return;
    }

    hideError();
    renderAmounts(state);
    updateSwapButton(state);
  });

  // Token search
  $('token-search')?.addEventListener('input', (e) => {
    const filtered = filterTokens(state, e.target.value);
    renderTokenList(state, filtered, (token) => selectToken(state, token));
  });

  // Swap tokens
  $('swap-tokens-btn')?.addEventListener('click', () => swapTokens(state));

  // MAX button
  $('max-button')?.addEventListener('click', () => setMaxAmount(state));

  // Submit form
  $('swap-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSwapSubmission(state);
  });

  // Modal events
  $('close-modal')?.addEventListener('click', () => closeTokenModal(state));
  $('token-modal')?.addEventListener('click', (e) => {
    if (e.target === $('token-modal')) closeTokenModal(state);
  });

  $('settings-btn')?.addEventListener('click', () => openSettingsModal(state));
  $('close-settings-modal')?.addEventListener('click', () => closeSettingsModal());

  // Settings events
  document.querySelectorAll('.slippage-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = parseFloat(btn.dataset.value);
      updateSlippageTolerance(state, value);
      updateSettingsUI(state);
    });
  });

  $('custom-slippage')?.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 50) {
      updateSlippageTolerance(state, value);
      updateSettingsUI(state);
    }
  });

  $('deadline')?.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 60) {
      updateTransactionDeadline(state, value);
    }
  });

  // Global token selection (for modals)
  window.selectToken = (token) => selectToken(state, token);
}

// Swap submission handler
async function handleSwapSubmission(state) {
  const fromAmount = parseFloat($('from-amount').value);
  const validation = validateAmount(state, fromAmount);

  if (!validation.valid) {
    showError(validation.error);
    return;
  }

  // Show loading state
  const btn = $('swap-button');
  const buttonText = btn.querySelector('.button-text');
  const spinner = btn.querySelector('.loading-spinner');

  btn.disabled = true;
  buttonText.textContent = 'Swapping...';
  spinner.style.display = 'block';

  try {
    // Simulate swap delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Show success
    showSwapSuccess(state);

  } catch (error) {
    showError('Swap failed. Please try again.');
  } finally {
    // Reset button
    btn.disabled = false;
    buttonText.textContent = 'Swap';
    spinner.style.display = 'none';
  }
}

// Settings UI update
function updateSettingsUI(state) {
  document.querySelectorAll('.slippage-btn').forEach((btn) => {
    btn.classList.toggle('active', parseFloat(btn.dataset.value) === state.slippageTolerance);
  });

  const deadlineInput = $('deadline');
  if (deadlineInput) deadlineInput.value = state.transactionDeadline;
}

// These functions will be imported dynamically to avoid circular dependencies
