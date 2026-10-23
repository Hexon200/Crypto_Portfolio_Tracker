import axios from 'axios'
import { canonicalId, paprikaId } from './coinIdentity.js'

let snapshot, expires = 0, pending, cooldown = 0
export function checkAbort(signal) {
  if (signal?.aborted) throw Object.assign(new Error('Request cancelled'), { code: 'ERR_CANCELED' })
}
export async function getPaprikaTickers({ signal } = {}) {
  checkAbort(signal)
  if (snapshot && Date.now() < expires) return snapshot
  if (Date.now() < cooldown) throw { source: 'CoinPaprika', status: 429, message: 'CoinPaprika rate limit' }
  if (!pending) pending = axios.get('https://api.coinpaprika.com/v1/tickers', { timeout: 12000 })
    .then(({ data }) => {
      if (!Array.isArray(data) || !data.length) throw new Error('CoinPaprika returned no markets')
      snapshot = data.filter((coin) => Number.isFinite(coin.quotes?.USD?.price)).map((coin) => ({
        id: canonicalId(coin.id), paprikaId: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(),
        image: `https://static.coinpaprika.com/coin/${coin.id}/logo.png`,
        price: coin.quotes.USD.price, marketCap: coin.quotes.USD.market_cap, volume: coin.quotes.USD.volume_24h,
        rank: coin.rank, change24h: coin.quotes.USD.percent_change_24h, change7d: coin.quotes.USD.percent_change_7d,
        source: 'CoinPaprika', fetchedAt: Date.now(), updatedAt: coin.last_updated, history: [],
      }))
      if (!snapshot.length) throw new Error('CoinPaprika returned no valid prices')
      expires = Date.now() + 600_000
      return snapshot
    }).catch((error) => {
      if (error.response?.status === 429 || error.response?.status === 402) cooldown = Date.now() + 60_000
      throw { source: 'CoinPaprika', status: error.response?.status, message: error.message }
    }).finally(() => { pending = null })
  const result = await pending
  checkAbort(signal)
  return result
}
export async function getPaprikaCoin(id, options) {
  const key = paprikaId(id)
  if (!key) throw new Error('No verified CoinPaprika mapping for this asset')
  const coin = (await getPaprikaTickers(options)).find((item) => item.paprikaId === key)
  if (!coin) throw new Error('Asset not available in CoinPaprika market data')
  return { ...coin, id }
}
