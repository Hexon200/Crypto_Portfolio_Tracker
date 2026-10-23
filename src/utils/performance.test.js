import { describe, it, expect } from 'vitest'
import { positionPerformance, rankMovers } from './performance.js'
import { formatCurrency, formatPercent } from './format.js'

describe('portfolio performance', () => {
  const holding = { amount: 2, avgBuyPrice: 80 }
  it('uses the previous price for daily movement and purchase cost for returns', () => {
    expect(positionPerformance(holding, { price: 110, change24h: 10 })).toMatchObject({ value: 220, pnl: 60, returnPct: 37.5 })
    expect(positionPerformance(holding, { price: 110, change24h: 10 }).dayChange).toBeCloseTo(20)
  })
  it('does not invent losses for missing prices or returns for zero cost', () => {
    expect(positionPerformance(holding, undefined).pnl).toBeNull()
    expect(positionPerformance({ amount: 1, avgBuyPrice: 0 }, { price: 20 }).returnPct).toBeNull()
    expect(formatCurrency(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })
  it('separates gainers and losers and ranks the selected timeframe', () => {
    const coins = [{ id: 'a', change24h: 2, change7d: -8 }, { id: 'b', change24h: -4, change7d: 10 }, { id: 'c', change24h: null, change7d: 0 }]
    expect(rankMovers(coins, '24h', 'up').map((coin) => coin.id)).toEqual(['a'])
    expect(rankMovers(coins, '7d', 'down').map((coin) => coin.id)).toEqual(['a'])
    expect(rankMovers(coins, '7d', 'up').map((coin) => coin.id)).toEqual(['b'])
  })
})
