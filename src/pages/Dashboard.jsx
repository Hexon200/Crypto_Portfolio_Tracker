import { memo, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, Bell, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCoinMarketData, getCoinMetadata } from '../api/coingecko.js'
import { toBinanceSymbol } from '../api/binanceSymbolMap.js'
import PopularCryptoChart from '../components/PopularCryptoChart.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { formatCurrency, formatPercent } from '../utils/format.js'

function PortfolioTotals({ holdings }) {
  const prices = usePriceStore((state) => state.prices)
  const { value, cost, change } = holdings.reduce((totals, holding) => {
    const current = prices[holding.symbol]?.price || 0
    totals.value += current * holding.amount
    totals.cost += holding.avgBuyPrice * holding.amount
    const dayChange = prices[holding.symbol]?.change24h || 0
    totals.change += current * holding.amount * (dayChange / 100)
    return totals
  }, { value: 0, cost: 0, change: 0 })
  const pnl = value - cost
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Portfolio value" value={formatCurrency(value)} accent />
      <Metric label="Unrealized P/L" value={`${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`} trend={pnl} />
      <Metric label="24h movement" value={`${change >= 0 ? '+' : ''}${formatCurrency(change)}`} trend={change} />
    </div>
  )
}

function Metric({ label, value, trend, accent }) {
  return <div className={`rounded-2xl border p-5 ${accent ? 'border-acid/30 bg-acid/[0.06] shadow-glow' : 'border-line bg-panel'}`}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-fog">{label}</p><p className={`mt-4 font-mono text-2xl font-medium ${accent ? 'text-acid' : trend < 0 ? 'text-ember' : 'text-white'}`}>{value}</p></div>
}

const HoldingRow = memo(function HoldingRow({ holding }) {
  const ticker = usePriceStore((state) => state.prices[holding.symbol])
  const metadata = useQuery({ queryKey: ['coin-metadata', holding.coingeckoId], queryFn: () => getCoinMetadata(holding.coingeckoId), staleTime: 60 * 60 * 1000 })
  const currentValue = ticker?.price * holding.amount
  const pnl = ticker ? (ticker.price - holding.avgBuyPrice) * holding.amount : null
  const hasLiveMarket = Boolean(toBinanceSymbol(holding.coingeckoId))
  return (
    <tr className="group border-t border-line/80 transition-colors hover:bg-white/[0.02]">
      <td className="px-5 py-5">
        <div className="flex items-center gap-3">
          {metadata.data?.logo ? <img src={metadata.data.logo} alt="" className="h-9 w-9 rounded-full" /> : <div className="grid h-9 w-9 place-items-center rounded-full bg-white/5 font-mono text-xs text-fog">{holding.symbol.slice(0, 2)}</div>}
          <div><p className="font-semibold text-white">{metadata.data?.name || holding.symbol}</p><p className="font-mono text-xs text-fog">{holding.symbol}</p></div>
        </div>
      </td>
      <td className="px-5 py-5 text-right"><p className="font-mono text-sm text-white">{holding.amount.toLocaleString()}</p><p className="text-xs text-fog">avg {formatCurrency(holding.avgBuyPrice)}</p></td>
      <td className="px-5 py-5 text-right"><p className="font-mono text-sm text-white">{formatCurrency(ticker?.price)}</p><span className={`source-badge ${hasLiveMarket ? 'source-live' : 'source-rest'}`}>{hasLiveMarket ? 'live' : 'polling fallback'}</span></td>
      <td className={`px-5 py-5 text-right font-mono text-sm ${ticker?.change24h >= 0 ? 'text-mint' : 'text-ember'}`}>{formatPercent(ticker?.change24h)}</td>
      <td className="px-5 py-5 text-right font-mono text-sm text-white">{formatCurrency(currentValue)}</td>
      <td className={`px-5 py-5 text-right font-mono text-sm ${pnl >= 0 ? 'text-mint' : 'text-ember'}`}>{pnl === null ? '—' : `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}</td>
    </tr>
  )
})

function TableSkeleton() {
  return <div className="space-y-px">{[0, 1, 2].map((item) => <div key={item} className="grid animate-pulse grid-cols-[2fr_repeat(5,1fr)] gap-4 border-t border-line px-5 py-6"><div className="h-9 rounded-lg bg-white/5" />{[0, 1, 2, 3, 4].map((cell) => <div key={cell} className="h-7 rounded-lg bg-white/[0.035]" />)}</div>)}</div>
}

export default function Dashboard() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const coinIds = useMemo(() => holdings.map((holding) => holding.coingeckoId).sort(), [holdings])
  const initial = useQuery({ queryKey: ['market-data', coinIds], queryFn: () => getCoinMarketData(coinIds), enabled: coinIds.length > 0, staleTime: 30_000 })
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">Live market ledger</p><h1 className="page-title">Portfolio overview</h1><p className="page-subtitle">Prices move in real time. Your keys never enter the room.</p></div><div className="flex gap-3"><Link to="/alerts" className="button-secondary"><Bell className="h-4 w-4" /> Set alert</Link><Link to="/portfolio" className="button-primary"><Plus className="h-4 w-4" /> Add holding</Link></div></header>
      <PopularCryptoChart />
      {holdings.length > 0 && <PortfolioTotals holdings={holdings} />}
      <section className="overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="font-semibold text-white">Holdings</h2><p className="mt-1 text-xs text-fog">USD spot prices · no trade execution</p></div><ArrowUpRight className="h-5 w-5 text-fog" /></div>
        {holdings.length === 0 ? <div className="empty-state"><div className="empty-icon">+</div><h3>No holdings yet</h3><p>Add an asset and cost basis to begin monitoring your portfolio.</p><Link to="/portfolio" className="button-primary mt-5">Add first holding</Link></div> : initial.isLoading ? <TableSkeleton /> : <div className="overflow-x-auto"><table className="w-full min-w-[880px]"><thead><tr className="text-left text-[11px] uppercase tracking-[0.16em] text-fog"><th className="px-5 py-3 font-semibold">Asset</th><th className="px-5 py-3 text-right font-semibold">Holdings</th><th className="px-5 py-3 text-right font-semibold">Price</th><th className="px-5 py-3 text-right font-semibold">24h</th><th className="px-5 py-3 text-right font-semibold">Value</th><th className="px-5 py-3 text-right font-semibold">Unrealized P/L</th></tr></thead><tbody>{holdings.map((holding) => <HoldingRow key={holding.id} holding={holding} />)}</tbody></table></div>}
      </section>
    </div>
  )
}
