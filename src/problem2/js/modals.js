// Modal interactions and UI

import { $, show, hide, setHTML, renderTokenList, updateTokenDisplay } from './dom-helpers.js';
import { updateSelectedToken, setCurrentSelector, clearCurrentSelector } from './state.js';

// Token modal functions
export function openTokenModal(state) {
  const overlay = $('token-modal');
  if (overlay) {
    overlay.style.display = 'flex';
    // Don't override the currentSelector - it's already set by the event handler
  }
}

export function closeTokenModal(state) {
  const overlay = $('token-modal');
  if (overlay) overlay.style.display = 'none';
  clearCurrentSelector(state);
}

// Settings modal functions
export function openSettingsModal(state) {
  const overlay = $('settings-modal');
  if (overlay) {
    overlay.style.display = 'flex';
    updateSettingsUI(state);
  }
}

export function closeSettingsModal() {
  const overlay = $('settings-modal');
  if (overlay) overlay.style.display = 'none';
}

export function updateSettingsUI(state) {
  document.querySelectorAll('.slippage-btn').forEach((btn) => {
    btn.classList.toggle('active', parseFloat(btn.dataset.value) === state.slippageTolerance);
  });

  const deadlineInput = $('deadline');
  if (deadlineInput) deadlineInput.value = state.transactionDeadline;
}

// Token selection
export function selectToken(state, token) {
  if (state.currentSelector === 'from') {
    updateSelectedToken(state, 'from', token);
    updateTokenDisplay(state, 'from', token);
  } else if (state.currentSelector === 'to') {
    updateSelectedToken(state, 'to', token);
    updateTokenDisplay(state, 'to', token);
  }

  closeTokenModal(state);

  // Import functions dynamically to avoid circular dependencies
  import('./actions.js').then(({ updateSwapButton, renderAmounts }) => {
    updateSwapButton(state);
    renderAmounts(state);
  });
}

// Token search and filtering
export function filterTokens(state, term) {
  if (!term?.trim()) {
    return state.tokens;
  }

  const query = term.toLowerCase();
  return state.tokens.filter((token) => {
    const symbolMatch = token.symbol.toLowerCase() === query;
    const nameMatch = token.name.toLowerCase().includes(query) &&
                     token.symbol.toLowerCase() !== query;
    return symbolMatch || nameMatch;
  });
}

// These functions will be imported dynamically to avoid circular dependencies
