// State management and factory

// State factory
export function createState() {
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

// State update helpers
export function updateSelectedToken(state, side, token) {
  state[`selected${side.charAt(0).toUpperCase() + side.slice(1)}Token`] = token;
}

export function getSelectedToken(state, side) {
  return state[`selected${side.charAt(0).toUpperCase() + side.slice(1)}Token`];
}

export function setCurrentSelector(state, selector) {
  state.currentSelector = selector;
}

export function clearCurrentSelector(state) {
  state.currentSelector = null;
}

export function updateSlippageTolerance(state, value) {
  state.slippageTolerance = value;
}

export function updateTransactionDeadline(state, value) {
  state.transactionDeadline = value;
}

export function swapSelectedTokens(state) {
  if (!state.selectedFromToken || !state.selectedToToken) return;
  [state.selectedFromToken, state.selectedToToken] = [state.selectedToToken, state.selectedFromToken];
}

export function resetState(state) {
  state.selectedFromToken = null;
  state.selectedToToken = null;
  state.currentSelector = null;
}
