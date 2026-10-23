export function positionPerformance(holding, ticker) {
  const cost = holding.amount * holding.avgBuyPrice
  const price = ticker?.price
  if (!Number.isFinite(price) || price < 0) return { cost, value: null, pnl: null, returnPct: null, dayChange: null }
  const value = price * holding.amount
  const pnl = value - cost
  const change = ticker?.change24h
  return {
    cost, value, pnl,
    returnPct: cost > 0 ? pnl / cost * 100 : null,
    dayChange: Number.isFinite(change) && change > -100 ? value - value / (1 + change / 100) : null,
  }
}

export function rankMovers(coins, timeframe, direction) {
  const key = timeframe === '7d' ? 'change7d' : 'change24h'
  return coins.filter((coin) => Number.isFinite(coin[key]) && (direction === 'up' ? coin[key] > 0 : coin[key] < 0))
    .sort((a, b) => direction === 'up' ? b[key] - a[key] : a[key] - b[key]).slice(0, 5)
}
