import { beforeEach, expect, it } from 'vitest'
import { usePortfolioStore } from './portfolioStore.js'
const buy = { id: 'buy', coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'buy', amount: 1, price: 100, fee: 1, date: '2026-01-01T12:00:00.000Z' }
const sell = { ...buy, id: 'sell', type: 'sell', price: 150, date: '2026-01-02T12:00:00.000Z' }
beforeEach(() => usePortfolioStore.setState({ holdings: [], transactions: null }))
it('updates holdings, persists history, and rejects removal that invalidates a sale', () => {
  const store = usePortfolioStore.getState()
  store.addTransaction(buy); store.addTransaction(sell)
  expect(usePortfolioStore.getState().holdings).toEqual([])
  expect(() => store.removeTransaction('buy')).toThrow('only 0 available')
  expect(usePortfolioStore.getState().transactions).toHaveLength(2)
  expect(JSON.parse(localStorage.getItem('crypto-portfolio-v1')).state.transactions).toHaveLength(2)
})
it('imports atomically and skips exact duplicates', () => {
  const store = usePortfolioStore.getState()
  store.importTransactions([buy]); store.importTransactions([buy])
  expect(usePortfolioStore.getState().transactions).toHaveLength(1)
  expect(() => store.importTransactions([{ ...sell, amount: 2 }])).toThrow('only 1 available')
  expect(usePortfolioStore.getState().transactions).toHaveLength(1)
  expect(() => store.importTransactions([{ ...buy, price: 999 }])).toThrow('different values')
})
