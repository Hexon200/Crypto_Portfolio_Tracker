import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import PortfolioAllocation from '../components/PortfolioAllocation.jsx'
import CoinSearch from '../components/CoinSearch.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { formatCurrency } from '../utils/format.js'

export default function Portfolio() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const addHolding = usePortfolioStore((state) => state.addHolding)
  const location = useLocation()
  const [coin, setCoin] = useState(location.state?.coin || null)
  useEffect(() => { if (location.state?.coin) setCoin(location.state.coin) }, [location.key, location.state])
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!coin || Number(amount) <= 0 || Number(avgBuyPrice) < 0) return
    try { addHolding({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      coingeckoId: coin.id,
      symbol: coin.symbol,
      amount: Number(amount),
      avgBuyPrice: Number(avgBuyPrice),
      addedAt: Date.now(),
    }) } catch (e) { setError(e.message); return }
    setError('')
    setCoin(null); setAmount(''); setAvgBuyPrice('')
  }

  return (
    <div className="space-y-8">
      <header><p className="eyebrow">Cost basis</p><h1 className="page-title">Manage portfolio</h1><p className="page-subtitle">Balances and average costs follow your transaction history.</p></header>
      <Link to="/transactions" className="button-secondary">View transaction history</Link>
      {error && <p role="alert" className="text-sm text-ember">{error}</p>}
      <PortfolioAllocation />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-line bg-panel"><div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-white">Your holdings</h2></div>
          {holdings.length === 0 ? <div className="empty-state py-20"><div className="empty-icon">+</div><h3>No holdings yet</h3><p>Use the form to add your first tracked asset.</p></div> : <div className="divide-y divide-line">{holdings.map((holding) => <div key={holding.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 font-mono text-xs text-fog">{holding.symbol.slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="font-semibold text-white">{holding.symbol}</p><p className="text-xs text-fog">Cost basis {formatCurrency(holding.avgBuyPrice)}</p></div><div className="text-right"><p className="font-mono text-sm">{holding.amount.toLocaleString(undefined, { maximumSignificantDigits: 12 })}</p><Link to="/transactions" state={{ coin: { id: holding.coingeckoId, name: holding.name || holding.symbol, symbol: holding.symbol } }} className="text-xs text-acid hover:underline">Record buy / sell</Link></div></div>)}</div>}
        </section>
        <form onSubmit={submit} className="h-fit rounded-2xl border border-line bg-panel p-5 lg:sticky lg:top-24"><div className="mb-6"><p className="eyebrow">New position</p><h2 className="mt-2 text-xl font-semibold text-white">Add a holding</h2></div><p className="mb-4 text-xs leading-5 text-fog">Quick add records a purchase now with no fee. For dated trades or fees, use <Link className="text-acid underline" to="/transactions" state={{ coin }}>transaction history</Link>.</p><div className="space-y-4"><CoinSearch label="Coin" selected={coin} onSelect={setCoin} /><label className="field-label">Amount<input className="field-input mt-2" type="number" min="0" step="any" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label><label className="field-label">Average buy price (USD)<input className="field-input mt-2" type="number" min="0" step="any" required value={avgBuyPrice} onChange={(event) => setAvgBuyPrice(event.target.value)} placeholder="0.00" /></label><button className="button-primary w-full" type="submit"><Plus className="h-4 w-4" /> Add holding</button></div></form>
      </div>
    </div>
  )
}
