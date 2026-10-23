import { expect, it } from 'vitest'
import { calculateLedger, openingTransactions } from './ledger.js'
const tx = (id, type, amount, price, fee = 0, day = 1) => ({ id, type, coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', amount, price, fee, date: `2026-01-${String(day).padStart(2, '0')}T12:00:00.000Z` })
it('includes buy fees in average cost and sell fees in realized profit', () => {
  const ledger = calculateLedger([tx('a', 'buy', 2, 100, 10), tx('b', 'buy', 1, 200, 5, 2), tx('c', 'sell', 1, 180, 2, 3)])
  expect(ledger.holdings[0].amount).toBe(2)
  expect(ledger.holdings[0].avgBuyPrice).toBeCloseTo(415 / 3)
  expect(ledger.realized).toBeCloseTo(178 - 415 / 3)
  expect(ledger.fees).toBe(17)
})
it('sorts backdated transactions and rejects sales before purchases', () => {
  expect(calculateLedger([tx('sale', 'sell', 1, 150, 0, 2), tx('buy', 'buy', 1, 100)]).realized).toBe(50)
  expect(() => calculateLedger([tx('sale', 'sell', 1, 150), tx('buy', 'buy', 1, 100, 0, 2)])).toThrow('only 0 available')
})
it('closes fractional balances and supports a new position after a full sale', () => {
  const rows = [tx('a', 'buy', 0.1, 100), tx('b', 'buy', 0.2, 100), tx('c', 'sell', 0.3, 110, 0, 2)]
  expect(calculateLedger(rows).holdings).toEqual([])
  expect(calculateLedger([...rows, tx('d', 'buy', 1, 200, 0, 3)]).holdings[0].avgBuyPrice).toBe(200)
})
it('preserves old holdings as opening balances without inventing past sales', () => {
  const old = [{ id: 'a', coingeckoId: 'bitcoin', symbol: 'BTC', amount: 2, avgBuyPrice: 100, addedAt: 1000 }]
  const records = openingTransactions(old)
  expect(records[0].type).toBe('opening')
  expect(calculateLedger(records)).toMatchObject({ cost: 200, realized: 0 })
})
it('rejects invalid numeric values and duplicate IDs', () => {
  expect(() => calculateLedger([tx('a', 'buy', Infinity, 1)])).toThrow('Quantity')
  expect(() => calculateLedger([tx('a', 'buy', 0, 1)])).toThrow('Quantity')
  expect(() => calculateLedger([tx('a', 'buy', 1, 1), tx('a', 'buy', 1, 1)])).toThrow('unique')
})
