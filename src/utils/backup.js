import { calculateLedger } from './ledger.js'

export const BACKUP_LIMIT = 5 * 1024 * 1024
const text = (value, label) => { if (typeof value !== 'string' || !value.trim() || value.length > 300) throw new Error(`Invalid ${label}.`); return value }
const list = (value, label) => { if (!Array.isArray(value) || value.length > 10000) throw new Error(`Invalid ${label}: maximum 10,000 entries.`); return value }
const identity = (item) => {
 text(item.coingeckoId, 'coin ID'); text(item.symbol, 'symbol')
 if (!/^(?:paprika:)?[a-z0-9][a-z0-9-]*$/i.test(item.coingeckoId)) throw new Error('Invalid coin ID.')
}
export function validateBackup(input) {
 if (!input || input.format !== 'coinpulse-backup' || input.version !== 1) throw new Error('Choose a supported Coinpulse backup (version 1).')
 if (typeof input.exportedAt !== 'string' || !Number.isFinite(Date.parse(input.exportedAt))) throw new Error('Invalid backup date.')
 const transactions = list(input.transactions, 'transactions').map(tx => {
  if (!tx || typeof tx !== 'object') throw new Error('Invalid transaction.')
  identity(tx); text(tx.id, 'transaction ID'); text(tx.date, 'transaction date')
  return { id: tx.id, coingeckoId: tx.coingeckoId, symbol: tx.symbol, name: tx.name ? text(tx.name, 'coin name') : tx.symbol, type: tx.type, amount: tx.amount, price: tx.price, fee: tx.fee, date: new Date(tx.date).toISOString() }
 })
 calculateLedger(transactions)
 const alerts = list(input.alerts, 'alerts').map(a => {
  if (!a || typeof a !== 'object') throw new Error('Invalid alert.')
  identity(a); text(a.id, 'alert ID')
  if (!['above', 'below'].includes(a.condition) || !Number.isFinite(a.targetPrice) || a.targetPrice <= 0 || typeof a.enabled !== 'boolean' || !(a.triggeredAt === null || (Number.isFinite(a.triggeredAt) && a.triggeredAt >= 0 && a.triggeredAt <= 8640000000000000))) throw new Error('Invalid alert settings.')
  return { id: a.id, coingeckoId: a.coingeckoId, symbol: a.symbol, condition: a.condition, targetPrice: a.targetPrice, enabled: a.enabled, triggeredAt: a.triggeredAt }
 })
 const watchlist = list(input.watchlist, 'watchlist').map(c => {
  if (!c || typeof c !== 'object') throw new Error('Invalid watchlist coin.')
  identity({ coingeckoId: c.id, symbol: c.symbol })
  return { id: c.id, symbol: c.symbol, name: text(c.name, 'coin name') }
 })
 for (const [label, items] of [['alerts', alerts], ['watchlist', watchlist]]) if (new Set(items.map(i => i.id)).size !== items.length) throw new Error(`Duplicate IDs inside backup ${label}.`)
 return { format: 'coinpulse-backup', version: 1, exportedAt: input.exportedAt, transactions, alerts, watchlist }
}
export function parseBackup(raw) {
 if (new Blob([raw]).size > BACKUP_LIMIT) throw new Error('Backup exceeds the 5 MB limit.')
 let input
 try { input = JSON.parse(raw.replace(/^\uFEFF/, '')) } catch { throw new Error('This file is not valid JSON.') }
 return validateBackup(input)
}
export function makeBackup(data) { return validateBackup({ ...data, format: 'coinpulse-backup', version: 1, exportedAt: new Date().toISOString() }) }
export function planRestore(current, backup) {
 const incoming = validateBackup(backup)
 const stats = {}, result = {}
 for (const key of ['transactions', 'alerts', 'watchlist']) {
  const byId = new Map(current[key].map(item => [item.id, item]))
  let added = 0, skipped = 0
  for (const item of incoming[key]) {
   const existing = byId.get(item.id)
   if (existing) {
    if (key === 'transactions' && (['coingeckoId', 'symbol', 'type', 'amount', 'price', 'fee'].some(field => existing[field] !== item[field]) || Date.parse(existing.date) !== Date.parse(item.date))) throw new Error(`Transaction ${item.id} already exists with different values. Nothing was restored.`)
    skipped++
   } else { byId.set(item.id, item); added++ }
  }
  result[key] = list([...byId.values()], key); stats[key] = { added, skipped }
 }
 const ledger = calculateLedger(result.transactions)
 return { ...result, holdings: ledger.holdings, stats }
}
// Persist all three records before updating the live stores. Roll back on quota errors.
export function persistRestore(storage, plan) {
 const entries = [ ['crypto-portfolio-v1', { transactions: plan.transactions, holdings: plan.holdings }], ['crypto-alerts-v1', { alerts: plan.alerts }], ['coinpulse-watchlist-v1', { coins: plan.watchlist }] ]
 const previous = entries.map(([key]) => storage.getItem(key))
 let written = 0
 try { for (const [key, state] of entries) { storage.setItem(key, JSON.stringify({ state, version: 0 })); written++ } }
 catch {
  for (let i = written - 1; i >= 0; i--) { if (previous[i] === null) storage.removeItem(entries[i][0]); else storage.setItem(entries[i][0], previous[i]) }
  throw new Error('Could not save the restore. Device storage may be full. Your existing data was kept.')
 }
}
