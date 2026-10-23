import axios from 'axios'
import { toBinanceSymbol } from './binanceSymbolMap.js'
import { getKrakenHistory } from './kraken.js'
import { getCoinMarketChart } from './coingecko.js'
import { resolveGeckoId } from './marketData.js'
const DAY = 86400_000
const cancelled = (error, signal) => { if (signal?.aborted || axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') throw error }

export async function getPortfolioAssetHistory(id, start, end, { signal } = {}) {
  const days = Math.max(1, Math.ceil((Date.now() - start) / DAY) + 2)
  try {
    const symbol = toBinanceSymbol(id)
    if (!symbol) throw new Error('No Binance market')
    let cursor = Math.floor(start / DAY) * DAY - 2 * DAY
    const points = []
    while (cursor < end) {
      const { data } = await axios.get('https://data-api.binance.vision/api/v3/klines', { params: { symbol, interval: '1d', startTime: cursor, endTime: end, limit: 1000 }, timeout: 8000, signal })
      if (!Array.isArray(data)) throw new Error('Invalid history')
      if (!data.length) break
      points.push(...data.map((row) => ({ timestamp: Math.min(Number(row[6]), end), price: Number(row[4]) })).filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0))
      const next = Number(data.at(-1)[0]) + DAY
      if (!(next > cursor)) throw new Error('History did not advance')
      cursor = next
      if (data.length < 1000) break
    }
    if (!points.length) throw new Error('Empty history')
    return { points, source: 'Binance', quote: 'USDT', maxGap: 2 * DAY }
  } catch (error) { cancelled(error, signal) }
  try {
    const result = await getKrakenHistory(id, days, { signal, closeTimes: true })
    return { ...result, maxGap: days > 720 ? 8 * DAY : 2 * DAY }
  } catch (error) { cancelled(error, signal) }
  const points = await getCoinMarketChart(await resolveGeckoId(id, { signal }), days, { signal })
  const valid = points.filter((p) => Number.isFinite(p.timestamp) && Number.isFinite(p.price) && p.price > 0)
  if (!valid.length) throw new Error('No historical prices available')
  return { points: valid, source: 'CoinGecko', quote: 'USD', maxGap: 2 * DAY }
}

export async function getPortfolioHistory(ids, start, end, { signal } = {}) {
  const histories = {}, failures = []
  let next = 0
  async function worker() {
    while (next < ids.length) {
      const id = ids[next++]
      try { histories[id] = await getPortfolioAssetHistory(id, start, end, { signal }) } catch (error) { cancelled(error, signal); failures.push(id) }
    }
  }
  await Promise.all([worker(), worker()])
  return { histories, failures, fetchedAt: Date.now() }
}
