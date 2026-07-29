import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { getCoinsList, searchCoins } from '../api/coingecko.js'

export default function CoinSearch({ onSelect, selected, label = 'Search coin' }) {
  const [query, setQuery] = useState('')
  useQuery({ queryKey: ['coins-list'], queryFn: getCoinsList, staleTime: Infinity })
  const results = useQuery({
    queryKey: ['coin-search', query.trim()],
    queryFn: () => searchCoins(query),
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  })

  function choose(coin) {
    onSelect(coin)
    setQuery(`${coin.name} (${coin.symbol})`)
  }

  return (
    <div className="relative">
      <label className="field-label" htmlFor={`${label.replaceAll(' ', '-')}-input`}>{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fog" />
        <input
          id={`${label.replaceAll(' ', '-')}-input`}
          className="field-input pl-10"
          value={query}
          onChange={(event) => { setQuery(event.target.value); if (selected) onSelect(null) }}
          placeholder="Bitcoin, ETH, Solana…"
          autoComplete="off"
        />
      </div>
      {query.trim().length >= 2 && !selected && (
        <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-line bg-panel p-1 shadow-2xl">
          {results.isLoading && <p className="px-3 py-3 text-sm text-fog">Searching market…</p>}
          {results.isError && <p className="px-3 py-3 text-sm text-ember">CoinGecko search unavailable.</p>}
          {results.data?.slice(0, 8).map((coin) => (
            <button key={coin.id} type="button" onClick={() => choose(coin)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5 focus-visible:bg-white/5">
              {coin.image ? <img src={coin.image} alt="" className="h-7 w-7 rounded-full" /> : <span className="h-7 w-7 rounded-full bg-line" />}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{coin.name}</span>
              <span className="font-mono text-xs text-fog">{coin.symbol}</span>
            </button>
          ))}
          {results.data?.length === 0 && <p className="px-3 py-3 text-sm text-fog">No matching coins.</p>}
        </div>
      )}
    </div>
  )
}
