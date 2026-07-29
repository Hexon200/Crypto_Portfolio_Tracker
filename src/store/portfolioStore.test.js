import { beforeEach, describe, expect, it } from 'vitest'
import { usePortfolioStore } from './portfolioStore.js'

describe('portfolioStore', () => {
  beforeEach(() => usePortfolioStore.setState({ holdings: [] }))

  it('adds, updates, removes, and persists holdings', () => {
    usePortfolioStore.getState().addHolding({ id: 'h1', coingeckoId: 'bitcoin', symbol: 'BTC', amount: 0.5, avgBuyPrice: 50000, addedAt: 1 })
    expect(usePortfolioStore.getState().holdings).toHaveLength(1)
    usePortfolioStore.getState().updateHolding('h1', { amount: 0.75 })
    expect(usePortfolioStore.getState().holdings[0].amount).toBe(0.75)
    expect(localStorage.getItem('crypto-portfolio-v1')).toContain('bitcoin')
    usePortfolioStore.getState().removeHolding('h1')
    expect(usePortfolioStore.getState().holdings).toEqual([])
  })
})
