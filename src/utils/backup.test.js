import { expect, it } from 'vitest'
import { makeBackup, parseBackup, planRestore, persistRestore } from './backup.js'
const tx = { id: 'buy1', coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'buy', amount: 2, price: 100, fee: 1, date: '2026-01-01T00:00:00.000Z' }
const empty = () => ({ transactions: [], alerts: [], watchlist: [] })
const data = () => ({ transactions: [tx], alerts: [{ id: 'a', coingeckoId: 'bitcoin', symbol: 'BTC', condition: 'above', targetPrice: 200, enabled: true, triggeredAt: null }], watchlist: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' }] })
it('roundtrips records and reconstructs holdings with fees', () => {
 const backup = parseBackup(JSON.stringify(makeBackup(data())))
 const plan = planRestore(empty(), backup)
 expect(plan.holdings[0]).toMatchObject({ amount: 2, avgBuyPrice: 100.5 })
 expect(plan.stats.transactions.added).toBe(1)
 expect(plan.alerts).toEqual(data().alerts)
 expect(plan.watchlist).toEqual(data().watchlist)
})
it('is idempotent and preserves current alert settings', () => {
 const current = data(); current.alerts[0].enabled = false
 const plan = planRestore(current, makeBackup(data()))
 expect(plan.transactions).toHaveLength(1)
 expect(plan.stats.transactions).toEqual({ added: 0, skipped: 1 })
 expect(plan.alerts[0].enabled).toBe(false)
})
it('rejects conflicts without modifying current data', () => {
 const current = data(), before = JSON.stringify(current)
 const incoming = data(); incoming.transactions = [{ ...tx, amount: 3 }]
 expect(() => planRestore(current, makeBackup(incoming))).toThrow('different values')
 expect(JSON.stringify(current)).toBe(before)
})
it('rejects invalid, oversized, unsupported and unsafe ledger backups', () => {
 expect(() => parseBackup('invalid')).toThrow('JSON')
 expect(() => parseBackup(' '.repeat(5 * 1024 * 1024 + 1))).toThrow('5 MB')
 expect(() => parseBackup(JSON.stringify({ ...makeBackup(empty()), version: 2 }))).toThrow('version 1')
 expect(() => makeBackup({ ...data(), transactions: [{ ...tx, type: 'sell' }] })).toThrow('Cannot sell')
 expect(() => makeBackup({ ...data(), transactions: [tx, tx] })).toThrow('unique')
 expect(() => makeBackup({ ...data(), alerts: [{ ...data().alerts[0], targetPrice: '200' }] })).toThrow('alert')
})
it('rolls back earlier storage writes if a later write fails', () => {
 const records = new Map([['crypto-portfolio-v1', 'old portfolio'], ['crypto-alerts-v1', 'old alerts']])
 let calls = 0
 const storage = { getItem: k => records.get(k) ?? null, setItem: (k, v) => { if (++calls === 2) throw new Error('quota'); records.set(k, v) }, removeItem: k => records.delete(k) }
 expect(() => persistRestore(storage, planRestore(empty(), makeBackup(data())))).toThrow('existing data was kept')
 expect(records.get('crypto-portfolio-v1')).toBe('old portfolio')
 expect(records.get('crypto-alerts-v1')).toBe('old alerts')
 expect(records.has('coinpulse-watchlist-v1')).toBe(false)
})
