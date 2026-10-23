import axios from 'axios'
import { getCoinMarketChart } from './coingecko.js'

import { getKrakenHistory } from './kraken.js'
import { resolveGeckoId } from './marketData.js'
import { toBinanceSymbol } from './binanceSymbolMap.js'

export async function getPopularHistory(coinId, days, { signal } = {}) {
  const interval = days === 1 ? '5m' : '1h'
  const limit = days === 1 ? 289 : days * 24 + 1
  try {
    if (!toBinanceSymbol(coinId)) throw new Error('Unsupported exchange market')
    const { data } = await axios.get('https://data-api.binance.vision/api/v3/klines', {
      params: { symbol: toBinanceSymbol(coinId), interval, limit }, signal, timeout: 8000,
    })
    if (!Array.isArray(data)) throw new Error('Invalid price history')
    const points = data.map((row) => ({ timestamp: Number(row[0]), price: Number(row[4]) }))
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0)
    if (points.length < 2) throw new Error('Empty price history')
    return { fetchedAt: Date.now(), points, source: 'Binance', quote: 'USDT', interval: days === 1 ? '5-min' : 'Hourly' }
  } catch (error) {
    if (signal?.aborted || axios.isCancel(error)) throw error
    try { return { ...await getKrakenHistory(coinId, days, { signal }), fetchedAt: Date.now() } } catch (krakenError) {
      if (signal?.aborted || axios.isCancel(krakenError) || krakenError?.code === 'ERR_CANCELED') throw krakenError
    }
    const geckoId = await resolveGeckoId(coinId, { signal })
    const points = (await getCoinMarketChart(geckoId, days, { signal }))
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0)
    if (points.length < 2) throw new Error('No price history returned by any provider')
    return { fetchedAt: Date.now(), points, source: 'CoinGecko', quote: 'USD', interval: 'Sampled' }
  }
}
