import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { getCoinMarketChart } from '../api/coingecko.js'
import { formatCurrency, formatPercent } from '../utils/format.js'

const POPULAR_COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
]

const TIMEFRAMES = [
  { days: 1, label: '24H', subtitle: '24 hours' },
  { days: 7, label: '7D', subtitle: '7 days' },
  { days: 30, label: '30D', subtitle: '30 days' },
]

function formatTimestamp(timestamp, days) {
  const date = new Date(timestamp)
  if (days === 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function buildChart(points) {
  if (!points?.length) return null
  const width = 1000
  const height = 280
  const padding = 16
  const prices = points.map((point) => point.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const coordinates = points.map((point, index) => ({
    x: padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2),
    y: padding + ((max - point.price) / range) * (height - padding * 2),
    price: point.price,
    timestamp: point.timestamp,
  }))

  const line = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')
  const area = `${line} L ${coordinates.at(-1).x.toFixed(2)} ${height} L ${coordinates[0].x.toFixed(2)} ${height} Z`

  const gridSteps = [0, 0.333, 0.666, 1]
  const gridLines = gridSteps.map((step) => {
    const price = max - step * range
    const y = padding + step * (height - padding * 2)
    return { step, price, y }
  })

  return { line, area, min, max, coordinates, width, height, gridLines }
}

export default function PopularCryptoChart() {
  const [selectedId, setSelectedId] = useState('bitcoin')
  const [days, setDays] = useState(7)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const coinRefs = useRef({})
  const chartContainerRef = useRef(null)
  const memoryCacheRef = useRef(new Map())

  const selected = POPULAR_COINS.find((coin) => coin.id === selectedId) || POPULAR_COINS[0]
  const activeTimeframe = TIMEFRAMES.find((tf) => tf.days === days) || TIMEFRAMES[1]
  const gradientId = `chart-fill-${useId().replaceAll(':', '')}`

  // Mobile auto-scroll selected tab into view
  useEffect(() => {
    const tabEl = coinRefs.current[selectedId]
    if (tabEl && typeof tabEl.scrollIntoView === 'function') {
      tabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [selectedId])

  // In-flight cancellation + memory cache
  const chartQuery = useQuery({
    queryKey: ['popular-market-chart', selectedId, days],
    queryFn: ({ signal }) => getCoinMarketChart(selectedId, days, { signal }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    placeholderData: () => memoryCacheRef.current.get(`${selectedId}-${days}`),
  })

  useEffect(() => {
    if (chartQuery.data?.length) {
      memoryCacheRef.current.set(`${selectedId}-${days}`, chartQuery.data)
    }
  }, [chartQuery.data, selectedId, days])

  const chart = useMemo(() => buildChart(chartQuery.data), [chartQuery.data])

  const firstPrice = chartQuery.data?.[0]?.price
  const currentPrice = chartQuery.data?.at(-1)?.price
  const totalChange = firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null
  const isPositive = totalChange === null || totalChange >= 0

  const strokeColor = isPositive ? '#10b981' : '#ef4444' // Mint Green vs Ember Red

  // Pointer interactions
  const handlePointerMove = (e) => {
    if (!chartQuery.data?.length || !chartContainerRef.current) return
    const rect = chartContainerRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const index = Math.round((relativeX / rect.width) * (chartQuery.data.length - 1))
    setHoveredIndex(index)
  }

  const handlePointerLeave = () => setHoveredIndex(null)

  const activePointIndex = hoveredIndex !== null && hoveredIndex < (chartQuery.data?.length || 0) ? hoveredIndex : null
  const activePoint = activePointIndex !== null ? chartQuery.data[activePointIndex] : null
  const activeCoord = activePointIndex !== null && chart ? chart.coordinates[activePointIndex] : null
  const activePointChange = activePoint && firstPrice ? ((activePoint.price - firstPrice) / firstPrice) * 100 : null

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel" aria-labelledby="market-pulse-title">
      <div className="flex flex-col gap-4 border-b border-line px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow">Popular assets · {activeTimeframe.subtitle}</p>
          <h2 id="market-pulse-title" className="mt-2 text-xl font-semibold text-white">Market pulse</h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          {/* Duration Selector */}
          <div className="inline-flex rounded-xl border border-line bg-ink/60 p-1" aria-label="Select timeframe">
            {TIMEFRAMES.map((tf) => {
              const active = tf.days === days
              return (
                <button
                  key={tf.days}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setDays(tf.days)
                    setHoveredIndex(null)
                  }}
                  className={`min-h-9 rounded-lg px-3 text-xs font-semibold transition-all ${
                    active ? 'bg-white/10 text-white shadow-sm' : 'text-fog hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              )
            })}
          </div>

          {/* Coin Selector */}
          <div className="chart-tabs -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Choose cryptocurrency">
            {POPULAR_COINS.map((coin) => {
              const active = coin.id === selectedId
              return (
                <button
                  key={coin.id}
                  ref={(el) => (coinRefs.current[coin.id] = el)}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedId(coin.id)
                    setHoveredIndex(null)
                  }}
                  className={`min-h-11 shrink-0 rounded-xl border px-3 text-left transition-colors ${
                    active
                      ? isPositive
                        ? 'border-mint/40 bg-mint/10 text-white'
                        : 'border-ember/40 bg-ember/10 text-white'
                      : 'border-line bg-ink/40 text-fog hover:border-fog/40 hover:text-white'
                  }`}
                >
                  <span className="block text-xs font-semibold">{coin.name}</span>
                  <span className={`font-mono text-[9px] ${active ? (isPositive ? 'text-mint' : 'text-ember') : 'text-fog'}`}>
                    {coin.symbol}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Header price & status */}
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-fog">
              {selected.name} {activePoint ? 'hovered price' : 'current price'}
            </p>
            <p className="mt-1 font-mono text-2xl font-medium text-white sm:text-3xl">
              {formatCurrency(activePoint ? activePoint.price : currentPrice)}
            </p>
          </div>

          <div className="text-right">
            {(activePointChange !== null || totalChange !== null) && (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs ${
                  (activePointChange ?? totalChange) >= 0
                    ? 'border-mint/20 bg-mint/[0.06] text-mint'
                    : 'border-ember/20 bg-ember/[0.06] text-ember'
                }`}
              >
                {(activePointChange ?? totalChange) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercent(activePointChange ?? totalChange)}
              </div>
            )}
            {activePoint && (
              <p className="mt-1 font-mono text-[10px] text-fog">
                {formatTimestamp(activePoint.timestamp, days)}
              </p>
            )}
          </div>
        </div>

        {/* Chart View */}
        {chartQuery.isLoading && !chart ? (
          <div aria-label="Loading market chart" className="h-64 animate-pulse rounded-xl bg-white/[0.035]" />
        ) : chartQuery.isError && !chart ? (
          <div className="grid h-64 place-items-center rounded-xl border border-dashed border-line bg-ink/30 text-center">
            <div>
              <p className="text-sm font-semibold text-white">Chart temporarily unavailable</p>
              <p className="mt-1 text-xs text-fog">CoinGecko did not return price history.</p>
              <button type="button" onClick={() => chartQuery.refetch()} className="button-secondary mt-4">
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        ) : chart ? (
          <div>
            <div
              ref={chartContainerRef}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              onTouchStart={handlePointerMove}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerLeave}
              className="relative h-56 w-full cursor-crosshair overflow-hidden rounded-xl bg-ink/35 select-none sm:h-72"
            >
              {/* Y-axis gridlines & Price labels */}
              <div className="pointer-events-none absolute inset-0">
                {chart.gridLines.map((grid, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-x-0 border-b border-white/[0.05]"
                    style={{ top: `${(grid.y / chart.height) * 100}%` }}
                  >
                    <span className="absolute right-2 -top-3 font-mono text-[9px] text-fog/70">
                      {formatCurrency(grid.price)}
                    </span>
                  </div>
                ))}
              </div>

              {/* SVG Chart */}
              <svg
                role="img"
                aria-label={`${selected.name} ${activeTimeframe.subtitle} USD price chart`}
                className="relative h-full w-full"
                viewBox={`0 0 ${chart.width} ${chart.height}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={chart.area} fill={`url(#${gradientId})`} />
                <path
                  d={chart.line}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Crosshair Guideline & Dot Indicator */}
                {activeCoord && (
                  <g className="pointer-events-none">
                    <line
                      x1={activeCoord.x}
                      y1={0}
                      x2={activeCoord.x}
                      y2={chart.height}
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      vectorEffect="non-scaling-stroke"
                    />
                    <circle
                      cx={activeCoord.x}
                      cy={activeCoord.y}
                      r="6"
                      fill={strokeColor}
                      stroke="#0f172a"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                )}
              </svg>

              {/* Dynamic Floating Tooltip */}
              {activeCoord && activePoint && (
                <div
                  className="pointer-events-none absolute z-10 rounded-lg border border-line bg-ink/95 px-3 py-1.5 shadow-xl backdrop-blur-md transition-all duration-75"
                  style={{
                    left: `min(max(${activeCoord.x}px - 70px, 8px), calc(100% - 150px))`,
                    top: `max(${activeCoord.y}px - 60px, 8px)`,
                  }}
                >
                  <p className="font-mono text-xs font-semibold text-white">
                    {formatCurrency(activePoint.price)}
                  </p>
                  <p className="font-mono text-[9px] text-fog">
                    {formatTimestamp(activePoint.timestamp, days)}
                  </p>
                </div>
              )}
            </div>

            {/* Subtitle / Footer stats */}
            <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-fog">
              <span>{days === 1 ? '24 hours ago' : `${days} days ago`}</span>
              <span>USD · {days === 1 ? '5-Min' : 'Hourly'}</span>
              <span>Now</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

