// Pure utility functions for the Currency Swap app

export function formatCurrency(amount, currency = 'USD') {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: amount < 1 ? 6 : 2,
  }).format(amount);
}

export function formatNumber(number, maxDecimals = 6) {
  if (!number) return '0';
  if (number < 0.001 && number > 0) {
    return number.toFixed(8).replace(/\.?0+$/, '');
  }
  const decimals = Math.min(maxDecimals, number < 1 ? 6 : number < 100 ? 4 : 2);
  return parseFloat(number.toFixed(decimals)).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
}

export function calculateToAmount(fromAmount, fromPrice, toPrice, slippagePct) {
  if (!fromAmount || !fromPrice || !toPrice) return 0;
  const usd = fromAmount * fromPrice;
  const raw = usd / toPrice;
  const slippage = 1 - slippagePct / 100;
  return raw * slippage;
}

export function calculateTotalVolume() {
  const base = 125_000_000; // $125M base
  const mult = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x
  return base * mult;
}

export function getMockBalance(symbol) {
  const balances = {
    ETH: 1.5 + Math.random() * 3,
    USDC: 1000 + Math.random() * 5000,
    USDT: 800 + Math.random() * 4000,
    WBTC: 0.05 + Math.random() * 0.2,
    SWTH: 10000 + Math.random() * 50000,
  };
  return balances[symbol] || Math.random() * 1000;
}
