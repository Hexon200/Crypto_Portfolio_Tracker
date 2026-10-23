import { Link } from 'react-router-dom'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { useCoinDetailStore } from '../store/coinDetailStore.js'
import { formatCurrency } from '../utils/format.js'
import CoinIcon from './CoinIcon.jsx'

const colors = ['#d7ff64', '#38bdf8', '#a78bfa', '#fb923c', '#2dd4bf', '#f472b6', '#818cf8', '#facc15']

export function calculateAllocation(holdings, prices) {
  const grouped = new Map()
  let missing = 0
  for (const holding of holdings) {
    if (!(holding.amount > 0)) continue
    const price = prices[holding.symbol]?.price
    if (!Number.isFinite(price) || price < 0) { missing++; continue }
    const existing = grouped.get(holding.coingeckoId) || { id: holding.coingeckoId, name: holding.symbol, symbol: holding.symbol, value: 0 }
    existing.value += holding.amount * price
    grouped.set(existing.id, existing)
  }
  const assets = [...grouped.values()].filter((asset) => asset.value > 0).sort((a, b) => b.value - a.value)
  const total = assets.reduce((sum, asset) => sum + asset.value, 0)
  return { assets: assets.map((asset) => ({ ...asset, percent: asset.value / total * 100 })), total, missing }
}

export default function PortfolioAllocation() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const prices = usePriceStore((state) => state.prices)
  const open = useCoinDetailStore((state) => state.open)
  const { assets, total, missing } = calculateAllocation(holdings, prices)
  let offset = 0
  return <section className="rounded-2xl border border-line bg-panel p-5" aria-labelledby="allocation-title"><p className="eyebrow">Your balance</p><h2 id="allocation-title" className="mt-2 text-xl font-semibold">Portfolio allocation</h2><p className="mt-1 text-xs text-fog">Share of current market value · USD</p>
    {holdings.length === 0 ? <div className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:text-left"><div className="h-24 w-24 shrink-0 rounded-full border-[14px] border-white/5" /><div><p className="text-sm font-semibold">See where your money sits</p><p className="mt-2 text-xs text-fog">Add holdings to see each coin’s share of your portfolio.</p><Link to="/portfolio" className="button-secondary mt-4">Add your first asset</Link></div></div> : missing > 0 ? <p role="status" className="py-10 text-sm text-fog">Waiting for {missing} holding{missing === 1 ? '' : 's'} to receive a price. Allocation appears when all positions can be valued.</p> : total === 0 ? <p className="py-10 text-sm text-fog">Your holdings have no positive market value to allocate yet.</p> : <div className="mt-6 grid items-center gap-6 sm:grid-cols-[220px_1fr]">
      <div className="relative mx-auto h-52 w-52"><svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" role="img" aria-label="Portfolio allocation by market value"><title>{assets.map((asset) => `${asset.symbol}: ${asset.percent.toFixed(1)}%`).join(', ')}</title>{assets.map((asset, index) => { const start = offset; offset += asset.percent; return <circle key={asset.id} cx="100" cy="100" r="80" fill="none" stroke={colors[index % colors.length]} strokeWidth="24" pathLength="100" strokeDasharray={`${asset.percent} ${100 - asset.percent}`} strokeDashoffset={-start} /> })}</svg><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xs text-fog">Total value</span><span className="mt-2 max-w-36 break-all text-center font-mono text-sm font-semibold">{formatCurrency(total)}</span><span className="mt-1 text-xs text-fog">{assets.length} assets</span></div></div>
      <div className="max-h-64 space-y-1 overflow-y-auto">{assets.map((asset, index) => <button key={asset.id} onClick={() => open(asset)} aria-label={`View ${asset.symbol} details`} className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colors[index % colors.length] }} /><CoinIcon id={asset.id} symbol={asset.symbol} /><span className="flex-1 text-sm font-semibold">{asset.symbol}</span><span className="text-right"><span className="block font-mono text-sm">{asset.percent.toFixed(1)}%</span><span className="text-xs text-fog">{formatCurrency(asset.value)}</span></span></button>)}</div>
    </div>}
  </section>
}
