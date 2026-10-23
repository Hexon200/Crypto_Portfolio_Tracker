import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Plus, Download, Upload, Pencil, Trash2 } from 'lucide-react'
import { getTransactions, usePortfolioStore } from '../store/portfolioStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { calculateLedger } from '../utils/ledger.js'
import { exportTransactions, parseTransactions } from '../utils/transactionCsv.js'
import { formatCurrency } from '../utils/format.js'
import CoinSearch from '../components/CoinSearch.jsx'
import CoinIcon from '../components/CoinIcon.jsx'

function localDate(value = new Date()) {
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function Transactions() {
  const state = usePortfolioStore()
  const prices = usePriceStore((s) => s.prices)
  const transactions = useMemo(() => getTransactions(state), [state.transactions, state.holdings])
  const ledger = useMemo(() => calculateLedger(transactions), [transactions])
  const location = useLocation()
  const [coin, setCoin] = useState(location.state?.coin || null)
  const [type, setType] = useState('buy'), [amount, setAmount] = useState(''), [price, setPrice] = useState(''), [fee, setFee] = useState('0'), [date, setDate] = useState(localDate())
  const [editing, setEditing] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [filter, setFilter] = useState('all'), [search, setSearch] = useState('')
  const [pendingImport, setPendingImport] = useState(null), [deleting, setDeleting] = useState(null)
  const form = useRef(null), fileInput = useRef(null)
  useEffect(() => { if (location.state?.coin) setCoin(location.state.coin) }, [location.key, location.state])
  const complete = ledger.holdings.every((h) => Number.isFinite(prices[h.symbol]?.price))
  const unrealized = complete ? ledger.holdings.reduce((sum, h) => sum + h.amount * (prices[h.symbol].price - h.avgBuyPrice), 0) : null
  const rows = [...ledger.rows].reverse().filter((tx) => (filter === 'all' || tx.type === filter) && `${tx.name} ${tx.symbol}`.toLowerCase().includes(search.toLowerCase()))
  function reset() { setEditing(null); setCoin(null); setType('buy'); setAmount(''); setPrice(''); setFee('0'); setDate(localDate()); setError('') }
  function submit(event) {
    event.preventDefault(); setError(''); setMessage('')
    try {
      if (!coin) throw new Error('Select a coin first.')
      if (amount.trim() === '' || price.trim() === '' || fee.trim() === '') throw new Error('Enter quantity, price, and fee.')
      const original = transactions.find((item) => item.id === editing)
      const timestamp = original && localDate(original.date) === date ? original.date : !editing && date === localDate() ? new Date().toISOString() : new Date(date).toISOString()
      const tx = { id: editing || crypto.randomUUID(), coingeckoId: coin.id, symbol: coin.symbol, name: coin.name, type, amount: Number(amount), price: Number(price), fee: Number(fee), date: timestamp }
      if (editing) state.updateTransaction(editing, tx); else state.addTransaction(tx)
      setMessage(editing ? 'Transaction updated. Balances recalculated.' : 'Transaction recorded. Balances updated.'); reset()
    } catch (e) { setError(e.message) }
  }
  function edit(tx) {
    setEditing(tx.id); setCoin({ id: tx.coingeckoId, symbol: tx.symbol, name: tx.name || tx.symbol }); setType(tx.type); setAmount(String(tx.amount)); setPrice(String(tx.price)); setFee(String(tx.fee)); setDate(localDate(tx.date)); setError(''); setMessage('')
    form.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }
  function download() {
    const url = URL.createObjectURL(new Blob([exportTransactions(transactions)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'coinpulse-transactions.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function previewImport(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
    setError(''); setMessage(''); setPendingImport(null)
    try {
      if (file.size > 2_000_000) throw new Error('Choose a CSV file smaller than 2 MB.')
      const incoming = parseTransactions(await file.text())
      const known = new Map(transactions.map((tx) => [tx.id, tx]))
      const fresh = []
      for (const tx of incoming) {
        if (known.has(tx.id)) {
          if (['coingeckoId', 'symbol', 'type', 'amount', 'price', 'fee', 'date'].some((key) => known.get(tx.id)[key] !== tx[key])) throw new Error(`Transaction ${tx.id} conflicts with an existing record.`)
        } else { fresh.push(tx); known.set(tx.id, tx) }
      }
      calculateLedger([...transactions, ...fresh])
      setPendingImport({ rows: fresh, skipped: incoming.length - fresh.length })
    } catch (e) { setError(e.message) }
  }
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Your trading journal</p><h1 className="page-title">Transaction history</h1><p className="page-subtitle">Record buys, sells, and fees. Your balances follow automatically.</p></div><div className="flex gap-2"><button onClick={download} className="button-secondary"><Download className="h-4 w-4" />Export CSV</button><button onClick={() => fileInput.current.click()} className="button-secondary"><Upload className="h-4 w-4" />Import CSV</button><input ref={fileInput} type="file" accept=".csv,text/csv" onChange={previewImport} className="hidden" aria-label="Import transactions CSV" /></div></header>
    <div className="grid gap-3 sm:grid-cols-3">{[['Realized profit', ledger.realized], ['Unrealized profit', unrealized], ['Fees paid', ledger.fees]].map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-panel p-5"><p className="text-xs uppercase tracking-wider text-fog">{label}</p><p className={`mt-3 font-mono text-2xl ${value !== null && value < 0 ? 'text-ember' : label === 'Fees paid' ? 'text-white' : 'text-mint'}`}>{formatCurrency(value)}</p></div>)}</div>
    <p className="text-xs leading-5 text-fog">Average-cost accounting · fees in USD · dates shown in your local time · saved on this device. Realized profit is net sale proceeds minus the average cost of coins sold.</p>
    {transactions.some((tx) => tx.type === 'opening') && <p className="rounded-xl border border-acid/20 bg-acid/5 p-4 text-sm text-fog">Your previous holdings are preserved as opening balances, using the dates they were added. Edit their dates and costs if needed; these are not a reconstruction of past trades.</p>}
    {error && <p role="alert" className="rounded-xl border border-ember/30 bg-ember/10 p-4 text-sm text-ember">{error}</p>}
    {message && <p role="status" className="rounded-xl border border-mint/20 bg-mint/5 p-4 text-sm text-mint">{message}</p>}
    {pendingImport && <div className="rounded-xl border border-acid/30 bg-panel p-4"><p className="text-sm">Ready to import {pendingImport.rows.length} transactions. {pendingImport.skipped} duplicate records skipped.</p><p className="mt-2 text-xs text-fog">Import merges with your existing history. Use this app’s exported CSV format.</p><div className="mt-3 flex gap-2"><button disabled={!pendingImport.rows.length} className="button-primary" onClick={() => { try { state.importTransactions(pendingImport.rows); setMessage(`${pendingImport.rows.length} transactions imported.`); setPendingImport(null); setError('') } catch (e) { setError(e.message) } }}>Import {pendingImport.rows.length} records</button><button className="button-secondary" onClick={() => setPendingImport(null)}>Cancel</button></div></div>}
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-panel"><div className="flex flex-wrap gap-3 border-b border-line p-4"><input aria-label="Search transactions" className="field-input flex-1" placeholder="Search coin or symbol…" value={search} onChange={(e) => setSearch(e.target.value)} /><select aria-label="Filter transaction type" className="field-input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All transactions</option><option value="buy">Buys</option><option value="sell">Sells</option><option value="opening">Opening balances</option></select></div>
        {!rows.length ? <div className="empty-state"><h2>{transactions.length ? 'No matching transactions' : 'Start your trading journal'}</h2><p>Record a purchase to track its cost, fees, and eventual profit.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-fog"><tr>{['Date / asset', 'Type', 'Quantity', 'Price / fee', 'Realized P/L', 'Actions'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody>{rows.map((tx) => <tr key={tx.id} className="border-t border-line"><td className="p-4"><div className="flex items-center gap-2"><CoinIcon id={tx.coingeckoId} symbol={tx.symbol} /><span className="font-semibold">{tx.symbol}</span></div><p className="mt-2 text-xs text-fog">{new Date(tx.date).toLocaleString()}</p></td><td className={`p-4 capitalize ${tx.type === 'sell' ? 'text-ember' : 'text-mint'}`}>{tx.type === 'opening' ? 'Opening' : tx.type}</td><td className="p-4 font-mono">{tx.amount.toLocaleString(undefined, { maximumSignificantDigits: 12 })}</td><td className="p-4 font-mono">{formatCurrency(tx.price)}<p className="mt-1 text-xs text-fog">fee {formatCurrency(tx.fee)}</p></td><td className={`p-4 font-mono ${tx.realized < 0 ? 'text-ember' : 'text-mint'}`}>{formatCurrency(tx.realized)}</td><td className="p-4">{deleting === tx.id ? <div><button className="text-xs text-ember underline" onClick={() => { try { state.removeTransaction(tx.id); setDeleting(null); setError(''); if (editing === tx.id) reset(); setMessage('Transaction removed. Balances recalculated.') } catch (e) { setError(e.message); setDeleting(null) } }}>Confirm removal</button><button className="mt-2 block text-xs text-fog" onClick={() => setDeleting(null)}>Cancel</button></div> : <div className="flex"><button onClick={() => edit(tx)} aria-label={`Edit ${tx.symbol} ${tx.type} transaction`} className="icon-button"><Pencil className="h-4 w-4" /></button><button onClick={() => setDeleting(tx.id)} aria-label={`Remove ${tx.symbol} ${tx.type} transaction`} className="icon-button text-fog hover:text-ember"><Trash2 className="h-4 w-4" /></button></div>}</td></tr>)}</tbody></table></div>}
      </section>
      <form ref={form} onSubmit={submit} className="h-fit scroll-mt-24 rounded-2xl border border-line bg-panel p-5 lg:sticky lg:top-24"><p className="eyebrow">{editing ? 'Correct a record' : 'New record'}</p><h2 className="mb-5 mt-2 text-xl font-semibold">{editing ? 'Edit transaction' : 'Record transaction'}</h2><div className="space-y-4"><CoinSearch label="Transaction coin" selected={coin} onSelect={setCoin} /><label className="field-label">Transaction type<select className="field-input mt-2" value={type} onChange={(e) => setType(e.target.value)}><option value="buy">Buy</option><option value="sell">Sell</option>{type === 'opening' && <option value="opening">Opening balance</option>}</select></label><label className="field-label">Date and time<input className="field-input mt-2" type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} /></label>{[['Quantity', amount, setAmount], ['Price per coin (USD)', price, setPrice], ['Fee (USD)', fee, setFee]].map(([label, value, setter]) => <label key={label} className="field-label">{label}<input type="number" min="0" step="any" required className="field-input mt-2" value={value} onChange={(e) => setter(e.target.value)} /></label>)}<button className="button-primary w-full"><Plus className="h-4 w-4" />{editing ? 'Save changes' : 'Record transaction'}</button>{editing && <button type="button" className="button-secondary w-full" onClick={reset}>Cancel editing</button>}<p className="text-xs leading-5 text-fog">Recording a transaction does not place a trade. Sale dates must have sufficient prior holdings.</p></div></form>
    </div>
  </div>
}
