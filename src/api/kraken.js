import axios from 'axios'
import { toBinanceSymbol } from './binanceSymbolMap.js'
import { checkAbort } from './coinpaprika.js'
let pairs, expires = 0, pending
async function getPairs(signal) {
  checkAbort(signal)
  if (pairs && Date.now() < expires) return pairs
  if (!pending) pending = axios.get('https://api.kraken.com/0/public/AssetPairs', { timeout: 8000 })
    .then(({ data }) => { if (data.error?.length || !data.result) throw new Error('Kraken pairs unavailable'); pairs = Object.values(data.result); expires = Date.now() + 3600_000; return pairs })
    .finally(() => { pending = null })
  const result = await pending; checkAbort(signal); return result
}
export async function getKrakenHistory(id, days, { signal, closeTimes = false } = {}) {
  const symbol = id === 'bitcoin' ? 'XBT' : id === 'dogecoin' ? 'XDG' : toBinanceSymbol(id)?.replace(/USDT$/, '')
  if (!symbol) throw new Error('No verified Kraken asset mapping')
  const markets = await getPairs(signal)
  const pair = ['USD', 'USDT'].flatMap((quote) => markets.filter((item) => item.wsname === `${symbol}/${quote}` && (!item.status || item.status === 'online')))[0]
  if (!pair) throw new Error('No supported Kraken spot pair')
  const minutes = days > 720 ? 10080 : days > 30 ? 1440 : days === 1 ? 5 : days === 7 ? 60 : 240
  const since = Math.floor(Date.now() / 1000) - days * 86400
  const { data } = await axios.get('https://api.kraken.com/0/public/OHLC', { params: { pair: pair.altname, interval: minutes, since }, signal, timeout: 8000 })
  if (data.error?.length) throw new Error(data.error.join(', '))
  const candles = Object.entries(data.result || {}).find(([key, value]) => key !== 'last' && Array.isArray(value))?.[1]
  const points = (candles || []).map((row) => ({ timestamp: closeTimes ? Math.min((Number(row[0]) + minutes * 60) * 1000, Date.now()) : Number(row[0]) * 1000, price: Number(row[4]) }))
    .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.price) && point.price > 0 && point.timestamp >= since * 1000)
  if (points.length < 2) throw new Error('Kraken returned no price history')
  return { points, source: 'Kraken', quote: pair.wsname.split('/')[1], interval: minutes === 10080 ? 'Weekly' : minutes === 1440 ? 'Daily' : minutes === 5 ? '5-min' : minutes === 60 ? 'Hourly' : '4-hour' }
}
