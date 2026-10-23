import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { getTransactions, usePortfolioStore } from '../store/portfolioStore.js'
import { getPortfolioHistory } from '../api/portfolioHistory.js'
import { buildPortfolioTimeline } from '../utils/portfolioTimeline.js'
import { formatCurrency } from '../utils/format.js'
import DataFreshness from './DataFreshness.jsx'

const DAY = 86400_000
const ranges = [['1W', 7], ['1M', 30], ['3M', 90], ['All', null]]
function line(points, key, x, y) {
  let drawing = false
  return points.map((point) => { if (point[key] === null) { drawing = false; return '' }; const command = drawing ? 'L' : 'M'; drawing = true; return `${command}${x(point.timestamp)},${y(point[key])}` }).join(' ')
}
export default function PortfolioPerformance() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const recorded = usePortfolioStore((state) => state.transactions)
  const transactions = useMemo(() => getTransactions({ holdings, transactions: recorded }), [holdings, recorded])
  const [range, setRange] = useState('1M'), [asOf, setAsOf] = useState(Date.now()), [hover, setHover] = useState(null)
  useEffect(() => { const timer = setInterval(() => setAsOf(Date.now()), 300_000); return () => clearInterval(timer) }, [])
  const past = useMemo(() => transactions.filter((tx) => Date.parse(tx.date) <= asOf), [transactions, asOf])
  const first = past.length ? Math.min(...past.map((tx) => Date.parse(tx.date))) : asOf
  const days = ranges.find(([label]) => label === range)[1]
  const start = Math.max(first, days ? asOf - days * DAY : first)
  const ids = useMemo(() => [...new Set(past.map((tx) => tx.coingeckoId))].sort(), [past])
  const history = useQuery({ queryKey: ['portfolio-history', ids, start, asOf], queryFn: ({ signal }) => getPortfolioHistory(ids, start, asOf, { signal }), enabled: past.length > 0, staleTime: 300_000, retry: false })
  const points = useMemo(() => buildPortfolioTimeline(past, history.data?.histories || {}, start, asOf), [past, history.data, start, asOf])
  const chart = useMemo(() => {
    if (!points.length) return null
    const values = points.flatMap((point) => [point.value, point.invested]).filter((value) => value !== null)
    const min = Math.min(0, ...values), max = Math.max(1, ...values), span = max - min || 1
    const x = (time) => 65 + (time - start) / Math.max(1, asOf - start) * 840
    const y = (value) => 220 - (value - min) / span * 190
    return { x, y, min, max, value: line(points, 'value', x, y), invested: line(points, 'invested', x, y) }
  }, [points, start, asOf])
  const selected = points[Math.min(hover ?? points.length - 1, points.length - 1)]
  const missing = points.some((point) => point.value === null)
  const hasValue = points.some((point) => point.value !== null)
  const sources = [...new Set(Object.values(history.data?.histories || {}).map((item) => `${item.source} (${item.quote})`))].join(', ')
  function selectAt(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const normalized = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width * 960 - 65) / 840))
    const time = start + normalized * (asOf - start)
    let nearest = 0
    points.forEach((point, index) => { if (Math.abs(point.timestamp - time) < Math.abs(points[nearest].timestamp - time)) nearest = index })
    setHover(nearest)
  }
  return <section className="rounded-2xl border border-line bg-panel p-5 sm:p-6" aria-labelledby="performance-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">Beyond the balance</p><h2 id="performance-title" className="mt-2 text-xl font-semibold">Portfolio performance</h2><p className="mt-1 text-xs text-fog">Coin value compared with net money invested</p></div><div className="flex flex-wrap gap-1">{ranges.map(([label]) => <button key={label} type="button" aria-pressed={range === label} onClick={() => { setRange(label); setHover(null) }} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${range === label ? 'bg-acid/10 text-acid' : 'text-fog hover:bg-white/5'}`}>{label}</button>)}<button type="button" aria-label="Refresh portfolio history" disabled={history.isFetching || !past.length} className="icon-button disabled:opacity-40" onClick={() => { setAsOf(Date.now()); setHover(null) }}><RefreshCw className={`h-4 w-4 ${history.isFetching ? 'animate-spin' : ''}`} /></button></div></div>
    {!past.length ? <div className="py-10 text-center"><p className="text-sm font-semibold">Your performance story starts with a transaction</p><p className="mt-2 text-xs text-fog">Add dated buys and sells to compare your investment with its market value.</p><Link to="/transactions" className="button-primary mt-5">Record your first transaction</Link></div> : history.isPending ? <div className="mt-5 grid h-64 animate-pulse place-items-center rounded-xl bg-white/5 text-sm text-fog" role="status">Loading historical prices…</div> : <>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Coin value', selected?.value], ['Net invested', selected?.invested], ['Realized profit', selected?.realized], ['Total profit', selected?.profit]].map(([label, value]) => <div key={label}><p className="text-[11px] text-fog">{label}</p><p className={`mt-1 break-all font-mono text-sm sm:text-lg ${label.includes('profit') ? value < 0 ? 'text-ember' : 'text-mint' : 'text-white'}`}>{formatCurrency(value)}</p></div>)}</div>
      <p className="mt-3 text-xs text-fog">{selected ? new Date(selected.timestamp).toLocaleString() : ''}{selected?.events.length ? ` · ${selected.events.map((tx) => `${tx.type} ${tx.amount} ${tx.symbol}`).join(' · ')}` : ''}</p>
      {chart && <div className="mt-4 overflow-hidden rounded-xl bg-ink/40" onPointerMove={selectAt} onPointerLeave={() => setHover(null)}><svg viewBox="0 0 960 265" className="h-64 w-full" role="img" aria-label="Portfolio value and net invested money over time">
        {[0, 0.5, 1].map((fraction) => { const value = chart.min + (chart.max - chart.min) * fraction, y = chart.y(value); return <g key={fraction}><line x1="65" x2="905" y1={y} y2={y} stroke="rgba(255,255,255,0.07)" /><text x="60" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}</text></g> })}
        <path d={chart.invested} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <path d={chart.value} fill="none" stroke="#d7ff64" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        {points.filter((point) => point.events.length).map((point) => <g key={point.timestamp}><line x1={chart.x(point.timestamp)} x2={chart.x(point.timestamp)} y1="228" y2="238" stroke={point.events.some((tx) => tx.type === 'sell') ? '#fb7185' : '#38bdf8'} strokeWidth="3" /><title>{point.events.map((tx) => `${tx.type} ${tx.amount} ${tx.symbol}`).join(', ')} · {new Date(point.timestamp).toLocaleString()}</title></g>)}
        {selected && <line x1={chart.x(selected.timestamp)} x2={chart.x(selected.timestamp)} y1="25" y2="225" stroke="rgba(255,255,255,0.3)" strokeDasharray="3 4" />}
        <text x="65" y="257" fontSize="11" fill="#94a3b8">{new Date(start).toLocaleDateString()}</text><text x="905" y="257" textAnchor="end" fontSize="11" fill="#94a3b8">{new Date(asOf).toLocaleDateString()}</text>
      </svg></div>}
      {points.length > 1 && <label className="mt-3 block text-xs text-fog">Explore chart date<input aria-label="Explore portfolio history" type="range" min="0" max={points.length - 1} value={hover ?? points.length - 1} onChange={(event) => setHover(Number(event.target.value))} className="mt-2 w-full accent-lime-300" /></label>}
      <div className="mt-3 flex flex-wrap gap-4 text-[11px]"><span className="text-acid">━ Coin value</span><span className="text-fog">┄ Net invested</span><span className="text-sky-400">│ Buy / opening</span><span className="text-rose-400">│ Sell</span></div>
      {(missing || history.isError) && <p role="status" className="mt-3 text-xs leading-5 text-amber-300">{hasValue ? 'Historical coverage is incomplete. Gaps mean at least one held coin has no price for that date.' : 'Historical prices are unavailable. Only net invested money can be shown.'} Missing prices are never treated as zero. Use refresh to retry.</p>}
      <div className="mt-3"><DataFreshness source="History snapshot" fetchedAt={history.data?.fetchedAt} error={history.isError || Boolean(history.data?.failures.length)} fetching={history.isFetching} /></div>
      <p className="mt-2 text-[10px] leading-5 text-fog">Sources: {sources || 'not available'}. Daily or available historical samples; trade markers use the last available price at that time. {sources.includes('USDT') ? 'USDT prices are treated as approximately USD; differences in the exchange rate can affect these estimates.' : ''}</p>
    </>}
    {past.length > 0 && <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-fog">Net invested = purchases + fees + opening costs − net sale proceeds. Cash is not tracked; sale proceeds are treated as withdrawn. Total profit = realized + unrealized profit. Opening balances begin on their recorded dates; earlier performance is unknown.{transactions.length > past.length ? ' Future-dated transactions are excluded until their date.' : ''}</p>}
  </section>
}
