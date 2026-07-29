import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import CoinSearch from '../components/CoinSearch.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { formatCurrency } from '../utils/format.js'

export default function Portfolio() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const addHolding = usePortfolioStore((state) => state.addHolding)
  const removeHolding = usePortfolioStore((state) => state.removeHolding)
  const updateHolding = usePortfolioStore((state) => state.updateHolding)
  const [coin, setCoin] = useState(null)
  const [amount, setAmount] = useState('')
  const [avgBuyPrice, setAvgBuyPrice] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!coin || Number(amount) <= 0 || Number(avgBuyPrice) < 0) return
    addHolding({
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
      coingeckoId: coin.id,
      symbol: coin.symbol,
      amount: Number(amount),
      avgBuyPrice: Number(avgBuyPrice),
      addedAt: Date.now(),
    })
    setCoin(null); setAmount(''); setAvgBuyPrice('')
  }

  return (
    <div className="space-y-8">
      <header><p className="eyebrow">Cost basis</p><h1 className="page-title">Manage portfolio</h1><p className="page-subtitle">Track quantities and average buy prices. Nothing here can place an order.</p></header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-line bg-panel"><div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-white">Your holdings</h2></div>
          {holdings.length === 0 ? <div className="empty-state py-20"><div className="empty-icon">+</div><h3>No holdings yet</h3><p>Use the form to add your first tracked asset.</p></div> : <div className="divide-y divide-line">{holdings.map((holding) => <div key={holding.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 font-mono text-xs text-fog">{holding.symbol.slice(0, 2)}</div><div className="min-w-0 flex-1"><p className="font-semibold text-white">{holding.symbol}</p><p className="text-xs text-fog">Cost basis {formatCurrency(holding.avgBuyPrice)}</p></div><label className="text-xs text-fog">Amount<input aria-label={`Amount of ${holding.symbol}`} className="field-input mt-1 w-32" type="number" min="0" step="any" value={holding.amount} onChange={(event) => updateHolding(holding.id, { amount: Number(event.target.value) })} /></label><button type="button" onClick={() => removeHolding(holding.id)} aria-label={`Remove ${holding.symbol}`} className="icon-button text-fog hover:text-ember"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
        </section>
        <form onSubmit={submit} className="h-fit rounded-2xl border border-line bg-panel p-5 lg:sticky lg:top-24"><div className="mb-6"><p className="eyebrow">New position</p><h2 className="mt-2 text-xl font-semibold text-white">Add a holding</h2></div><div className="space-y-4"><CoinSearch label="Coin" selected={coin} onSelect={setCoin} /><label className="field-label">Amount<input className="field-input mt-2" type="number" min="0" step="any" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label><label className="field-label">Average buy price (USD)<input className="field-input mt-2" type="number" min="0" step="any" required value={avgBuyPrice} onChange={(event) => setAvgBuyPrice(event.target.value)} placeholder="0.00" /></label><button className="button-primary w-full" type="submit"><Plus className="h-4 w-4" /> Add holding</button></div></form>
      </div>
    </div>
  )
}
