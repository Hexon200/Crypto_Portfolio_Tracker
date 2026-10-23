import DataFreshness from './DataFreshness.jsx'
import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { X, Star, Plus, Bell } from 'lucide-react'
import { useCoinDetailStore } from '../store/coinDetailStore.js'
import { useWatchlistStore } from '../store/watchlistStore.js'
import { getCoinDetails } from '../api/marketData.js'
import { formatCurrency, formatPercent } from '../utils/format.js'
import CoinIcon from './CoinIcon.jsx'
import { marketErrorMessage } from '../utils/marketError.js'
import PopularCryptoChart from './PopularCryptoChart.jsx'

function DetailContent({ coin, close }) {
  const dialog = useRef(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saved = useWatchlistStore((state) => state.coins.some((item) => item.id === coin.id))
  const toggle = useWatchlistStore((state) => state.toggle)
  const details = useQuery({ queryKey: ['coin-details', coin.id], queryFn: ({ signal }) => getCoinDetails(coin.id, { signal }), staleTime: 600_000, retry: (count, error) => count < 1 && ![429, 401, 403, 404].includes(error.status) })
  const cached = queryClient.getQueryData(['market-leaders'])?.find((item) => item.id === coin.id)
  const asset = { ...coin, ...cached, ...details.data }
  useEffect(() => {
    const previous = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog.current.showModal()
    return () => { document.body.style.overflow = overflow; previous?.focus?.() }
  }, [])
  function go(path) {
    close()
    navigate(path, { state: { coin: { id: asset.id, name: asset.name, symbol: asset.symbol, image: asset.image } } })
  }
  return <dialog ref={dialog} aria-labelledby="coin-detail-title" onCancel={(event) => { event.preventDefault(); close() }} onClick={(event) => { if (event.target === dialog.current) { const rect = dialog.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close() } }} className="m-auto max-h-[90dvh] w-[calc(100%-1rem)] max-w-3xl overflow-y-auto rounded-2xl border border-line bg-ink p-0 text-white shadow-2xl backdrop:bg-black/70">
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-ink/95 p-5 backdrop-blur-xl">
      <CoinIcon id={asset.id} symbol={asset.symbol} image={asset.image} className="h-11 w-11" />
      <div className="min-w-0 flex-1"><p className="eyebrow">Asset overview</p><h2 id="coin-detail-title" className="mt-1 truncate text-xl font-semibold">{asset.name}</h2><p className="text-xs text-fog">{asset.symbol}</p></div>
      <button autoFocus onClick={close} aria-label="Close coin details" className="icon-button"><X className="h-5 w-5" /></button>
    </div>
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap gap-2"><button onClick={() => toggle(asset)} aria-pressed={saved} className="button-secondary"><Star className="h-4 w-4 text-acid" fill={saved ? 'currentColor' : 'none'} />{saved ? 'Watching' : 'Watch coin'}</button><button onClick={() => go('/portfolio')} className="button-primary"><Plus className="h-4 w-4" />Add holding</button><button onClick={() => go('/transactions')} className="button-secondary">Record transaction</button><button onClick={() => go('/alerts')} className="button-secondary"><Bell className="h-4 w-4" />Set alert</button></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[
        ['Price (USD)', formatCurrency(asset.price)], ['24h change', formatPercent(asset.change24h)], ['7d change', formatPercent(asset.change7d)],
        ['Market cap', formatCurrency(asset.marketCap, 0)], ['24h volume', formatCurrency(asset.volume, 0)], ['Market rank', asset.rank ? `#${asset.rank}` : '—'],
      ].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-line bg-panel p-3"><p className="text-xs text-fog">{label}</p><p className="mt-2 break-words font-mono text-sm font-semibold">{value}</p></div>)}</div>
      {details.isPending && <p className="text-xs text-fog" role="status">Loading market statistics…</p>}
      {details.isError && <p className="text-xs text-amber-300">{marketErrorMessage(details.error)} <button className="underline" onClick={() => details.refetch()}>Retry statistics</button></p>}
      <PopularCryptoChart key={coin.id} coin={coin} />
      <DataFreshness source={asset.source} updatedAt={asset.updatedAt} fetchedAt={asset.fetchedAt} error={details.isError} fetching={details.isFetching} />
      <p className="text-xs leading-5 text-fog">Market statistics are quoted in USD. The chart labels its own source and quote currency. Adding a holding records your position; it does not place a trade.</p>
    </div>
  </dialog>
}

export default function CoinDetailPanel() {
  const coin = useCoinDetailStore((state) => state.coin)
  const close = useCoinDetailStore((state) => state.close)
  return coin ? <DetailContent key={coin.id} coin={coin} close={close} /> : null
}
