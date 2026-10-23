import { expect, it } from 'vitest'
import { exportTransactions, parseTransactions } from './transactionCsv.js'
it('round-trips quoted names, commas, dates, and decimal fees', () => {
  const rows = [{ id: 'a', coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin, "coin"', type: 'buy', amount: 0.25, price: 100, fee: 0.5, date: '2026-01-01T12:00:00.000Z' }]
  expect(parseTransactions(exportTransactions(rows))).toEqual(rows)
})
it('rejects incorrect columns and truncated quoted fields', () => {
  expect(() => parseTransactions('name,amount\nBTC,1')).toThrow('format')
  expect(() => parseTransactions('"unterminated')).toThrow('unclosed')
})
