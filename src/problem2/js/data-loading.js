// API calls and data management

import { formatCurrency, calculateTotalVolume } from '../lib/utils.js';
import { setText, showLoadingState, renderTokenList } from './dom-helpers.js';

// Mock token data
const MOCK_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
  { symbol: 'SWTH', name: 'Switcheo Token', decimals: 8 },
];

// Mock price data
const MOCK_PRICES = {
  ETH: 2000 + Math.random() * 1000,
  USDC: 1,
  USDT: 1,
  WBTC: 30000 + Math.random() * 10000,
  SWTH: 0.1 + Math.random() * 0.5,
};

// Data loading functions
export async function loadTokenData(state) {
  try {
    showLoadingState();

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Load tokens
    state.tokens = MOCK_TOKENS;

    // Load prices
    state.prices = MOCK_PRICES;

    // Update UI
    renderTokenList(state, null, (token) => {
      // Import selectToken dynamically to avoid circular dependencies
      import('./modals.js').then(({ selectToken }) => {
        selectToken(state, token);
      });
    });

    // Update volume display
    updateVolumeDisplay();

  } catch (error) {
    console.error('Failed to load token data:', error);
    setText('token-list', `
      <div class="loading-tokens">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Failed to load tokens</span>
      </div>
    `);
  }
}

export function updateVolumeDisplay() {
  const volume = calculateTotalVolume();
  setText('total-volume', formatCurrency(volume));
}

// Search functionality
export function searchTokens(state, searchTerm) {
  if (!searchTerm?.trim()) {
    return state.tokens;
  }

  const query = searchTerm.toLowerCase();
  return state.tokens.filter((token) => {
    const symbolMatch = token.symbol.toLowerCase() === query;
    const nameMatch = token.name.toLowerCase().includes(query) &&
                     token.symbol.toLowerCase() !== query;
    return symbolMatch || nameMatch;
  });
}

// Price updates (simulated)
export function updatePrices(state) {
  // Simulate price fluctuations
  Object.keys(state.prices).forEach(symbol => {
    if (symbol !== 'USDC' && symbol !== 'USDT') {
      const currentPrice = state.prices[symbol];
      const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% fluctuation
      state.prices[symbol] = currentPrice * (1 + fluctuation);
    }
  });

  // Update token list with new prices
  renderTokenList(state, null, (token) => {
    window.selectToken?.(token);
  });
}

// Network status
export function checkNetworkStatus() {
  return navigator.onLine;
}

// Error handling
export function handleDataError(error, context) {
  console.error(`Data error in ${context}:`, error);

  // Show user-friendly error message
  const errorMessage = context === 'load' ?
    'Failed to load token data. Please check your connection.' :
    'An error occurred. Please try again.';

  setText('token-list', `
    <div class="loading-tokens">
      <i class="fas fa-exclamation-triangle"></i>
      <span>${errorMessage}</span>
    </div>
  `);
}
