// Form validation and error handling

import { getMockBalance } from '../lib/utils.js';
import { setText, hide } from './dom-helpers.js';

// Validation functions
export function validateAmount(state, amount) {
  const num = parseFloat(amount);
  if (!state.selectedFromToken || isNaN(num) || num <= 0) {
    return { valid: true, error: null };
  }

  const balance = getMockBalance(state.selectedFromToken.symbol);
  if (num > balance) {
    return {
      valid: false,
      error: `Insufficient ${state.selectedFromToken.symbol} balance`
    };
  }

  const min = 0.001;
  if (num < min) {
    return {
      valid: false,
      error: `Minimum amount is ${min} ${state.selectedFromToken.symbol}`
    };
  }

  return { valid: true, error: null };
}

export function validateFormState(state) {
  const errors = [];

  if (!state.selectedFromToken) {
    errors.push('Please select a token to swap from');
  }

  if (!state.selectedToToken) {
    errors.push('Please select a token to swap to');
  }

  const fromAmount = parseFloat(document.getElementById('from-amount')?.value || '0');
  if (fromAmount <= 0) {
    errors.push('Please enter an amount to swap');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Error display functions
export function showError(message) {
  setText('error-text', message);
  const errorEl = document.getElementById('error-message');
  if (errorEl) errorEl.style.display = 'flex';
}

export function hideError() {
  hide('error-message');
}

// Input validation
export function validateInputFormat(value) {
  return /^\d*\.?\d*$/.test(value);
}

export function sanitizeInput(value) {
  return value.replace(/[^0-9.]/g, '');
}
