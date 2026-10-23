import DataFreshness from './DataFreshness.jsx'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { getMarketLeaders, getCoinMarketData } from '../api/marketData.js'
import { useWatchlistStore } from '../store/watchlistStore.js'
import { rankMovers } from '../utils/performance.js'
import { formatCurrency, formatPercent } from '../utils/format.js'
import CoinSearch from './CoinSearch.jsx'
import { useCoinDetailStore } from '../store/coinDetailStore.js'
import CoinIcon from './CoinIcon.jsx'

function Sparkline({ values }) {
  const valid = values.filter(Number.isFinite)
  if (valid.length < 2) return <span className="text-xs text-fog">—</span>
  const min = Math.min(...valid), range = Math.max(...valid) - min || 1
  const points = valid.map((price, i) => `${i / (valid.length - 1) * 80},${27 - (price - min) / range * 24}`).join(' ')
  return <svg viewBox="0 0 80 30" className={`h-8 w-20 ${valid.at(-1) >= valid[0] ? 'text-mint' : 'text-ember'}`} role="img" aria-label="7-day price trend"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
}

function WatchButton({ coin }) {
  const saved = useWatchlistStore((state) => state.coins.some((item) => item.id === coin.id))
  const toggle = useWatchlistStore((state) => state.toggle)
  return <button type="button" onClick={() => toggle(coin)} aria-label={`${saved ? 'Remove' : 'Watch'} ${coin.name}${saved ? ' from watchlist' : ''}`} aria-pressed={saved} className={`icon-button shrink-0 ${saved ? 'text-acid' : 'text-fog'}`}><Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} /></button>
}

function CoinRow({ coin, timeframe = '24h', showChart = false }) {
  const open = useCoinDetailStore((state) => state.open)
  const change = timeframe === '7d' ? coin.change7d : coin.change24h
  return <div className="flex items-center gap-3 border-t border-line/70 py-3">
    <CoinIcon id={coin.id} symbol={coin.symbol} image={coin.image} />
    <button onClick={() => open(coin)} aria-label={`View ${coin.name} details`} className="min-w-0 flex-1 text-left hover:text-acid"><p className="truncate text-sm font-semibold">{coin.name}</p><p className="text-xs text-fog">{coin.symbol}</p></button>
    {showChart && coin.history?.length > 1 && <div className="hidden xl:block"><Sparkline values={coin.history || []} /></div>}
    <div className="text-right font-mono"><p className="text-xs">{formatCurrency(coin.price)}</p><p className={`mt-1 text-xs ${change == null ? 'text-fog' : change >= 0 ? 'text-mint' : 'text-ember'}`}>{formatPercent(change)}</p></div>
    <WatchButton coin={coin} />
  </div>
}

export default function MarketDiscovery() {
  const [timeframe, setTimeframe] = useState('24h')
  const [searchKey, setSearchKey] = useState(0)
  const coins = useWatchlistStore((state) => state.coins)
  const toggle = useWatchlistStore((state) => state.toggle)
  const market = useQuery({ queryKey: ['market-leaders'], queryFn: ({ signal }) => getMarketLeaders({ signal }), staleTime: 120_000, refetchInterval: 120_000 })
  const ids = coins.map((coin) => coin.id).sort()
  const watched = useQuery({ queryKey: ['watchlist-prices', ids], queryFn: ({ signal }) => getCoinMarketData(ids, { signal }), enabled: ids.length > 0, staleTime: 60_000, refetchInterval: 60_000 })
  const gainers = rankMovers(market.data || [], timeframe, 'up')
  const losers = rankMovers(market.data || [], timeframe, 'down')
  return <section aria-labelledby="discovery-title" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Discover & follow</p><h2 id="discovery-title" className="mt-2 text-xl font-semibold">Market movers</h2><p className="mt-1 text-xs text-fog">Among the top 100 by market cap · price change, not personal profit</p></div><div className="flex rounded-xl border border-line bg-panel p-1">{['24h', '7d'].map((period) => <button key={period} type="button" aria-pressed={timeframe === period} onClick={() => setTimeframe(period)} className={`min-h-10 rounded-lg px-4 text-xs font-semibold uppercase ${timeframe === period ? 'bg-acid/10 text-acid' : 'text-fog'}`}>{period}</button>)}</div></div>
    <div className="grid gap-4 lg:grid-cols-3">
      {[{ title: 'Top gainers', rows: gainers, Icon: TrendingUp, tone: 'text-mint' }, { title: 'Top losers', rows: losers, Icon: TrendingDown, tone: 'text-ember' }].map(({ title, rows, Icon, tone }) => <div key={title} className="rounded-2xl border border-line bg-panel p-5"><div className="mb-4 flex items-center gap-2"><Icon className={`h-4 w-4 ${tone}`} /><h3 className="text-sm font-semibold">{title}</h3><span className="ml-auto text-[10px] uppercase text-fog">{timeframe}</span></div>
        {market.isPending ? <div aria-label={`Loading ${title.toLowerCase()}`} className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}</div> : market.isError && !market.data ? <div className="py-10 text-center"><p className="text-sm text-fog">Market data unavailable.</p><button onClick={() => market.refetch()} className="button-secondary mt-4"><RefreshCw className="h-4 w-4" />Retry</button></div> : rows.length ? rows.map((coin) => <CoinRow key={coin.id} coin={coin} timeframe={timeframe} showChart />) : <p className="py-10 text-sm text-fog">No {title === 'Top gainers' ? 'gainers' : 'losers'} in this period.</p>}
        {market.data && <DataFreshness source={market.data[0]?.source || 'Market data'} updatedAt={market.data[0]?.updatedAt} fetchedAt={market.data[0]?.fetchedAt} error={market.isError} fetching={market.isFetching} />}
      </div>)}
      <div className="rounded-2xl border border-line bg-panel p-5"><div className="mb-4 flex items-center gap-2"><Star className="h-4 w-4 text-acid" /><h3 className="text-sm font-semibold">Your watchlist</h3><span className="ml-auto rounded-full bg-white/5 px-2 py-1 text-xs text-fog">{coins.length}</span></div>
        <CoinSearch key={searchKey} label="Find a coin to watch" selected={null} onSelect={(coin) => { if (!coin) return; if (!coins.some((item) => item.id === coin.id)) toggle(coin); setSearchKey((key) => key + 1) }} />
        {coins.length === 0 ? <div className="py-12 text-center"><Star className="mx-auto h-8 w-8 text-acid/60" /><p className="mt-4 text-sm font-semibold">Keep your next move in sight</p><p className="mt-2 text-xs leading-5 text-fog">Star any market mover or search for a coin.<br />No purchase needed.</p></div> : <div className="mt-4 max-h-96 overflow-y-auto">{coins.map((coin) => <CoinRow key={coin.id} coin={{ ...coin, ...watched.data?.[coin.id] }} />)}</div>}
        {watched.isError && <button onClick={() => watched.refetch()} className="mt-3 text-xs text-amber-300">Prices could not refresh. Retry</button>}
        <p className="mt-3 text-[10px] text-fog">Saved on this device · changes: 24H</p>
      </div>
    </div>
    <p className="text-[10px] text-fog">Powered by <a className="underline" href="https://coinpaprika.com/" target="_blank" rel="noreferrer">CoinPaprika</a> · CoinGecko fallback · market snapshots cached for up to 10 minutes.</p>
  </section>
}
