// DOM manipulation utilities

// Import required utilities
import { formatCurrency, formatNumber, getMockBalance } from '../lib/utils.js';

// DOM selectors
export const $ = (id) => document.getElementById(id);

// DOM manipulation helpers
export const setText = (id, text) => {
  const el = $(id);
  if (el) el.textContent = text;
};

export const setHTML = (id, html) => {
  const el = $(id);
  if (el) el.innerHTML = html;
};

export const show = (id) => {
  const el = $(id);
  if (el) el.style.display = '';
};

export const hide = (id) => {
  const el = $(id);
  if (el) el.style.display = 'none';
};

// Token list rendering
export function showLoadingState() {
  setHTML('token-list', `
    <div class="loading-tokens">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Loading tokens...</span>
    </div>
  `);
}

export function renderTokenList(state, list = null, onTokenSelect) {
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
      onTokenSelect(token);
    });
  });
}

export function updateTokenDisplay(state, side, token) {
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

  // Update balance display
  const balance = getMockBalance(token.symbol);
  setText(`${side}-balance`, `Balance: ${formatNumber(balance, token.decimals)}`);
}

