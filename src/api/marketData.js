import axios from 'axios'
import * as gecko from './coingecko.js'
import { getPaprikaTickers, getPaprikaCoin, checkAbort } from './coinpaprika.js'

const resolvedGecko = new Map()
export async function resolveGeckoId(id, { signal } = {}) {
  checkAbort(signal)
  if (!id.startsWith('paprika:')) return id
  if (resolvedGecko.has(id)) return resolvedGecko.get(id)
  let identity
  try { identity = await getPaprikaCoin(id, { signal }) } catch (error) {
    checkAbort(signal)
    const { data } = await axios.get(`https://api.coinpaprika.com/v1/coins/${encodeURIComponent(id.slice(8))}`, { signal, timeout: 8000 })
    identity = data
  }
  const matches = (await gecko.searchCoins(identity.name, { signal })).filter((coin) =>
    coin.name.toLowerCase() === identity.name.toLowerCase() && coin.symbol.toUpperCase() === identity.symbol.toUpperCase())
  if (matches.length !== 1) throw new Error('No unambiguous CoinGecko identity match')
  resolvedGecko.set(id, matches[0].id)
  return matches[0].id
}
function cancelled(error, signal) { checkAbort(signal); if (axios.isCancel?.(error) || error?.code === 'ERR_CANCELED') throw error }
export async function getCoinDetails(id, options = {}) {
  try { return await getPaprikaCoin(id, options) } catch (error) {
    cancelled(error, options.signal)
    return { ...await gecko.getCoinDetails(await resolveGeckoId(id, options), options), id, source: 'CoinGecko', fetchedAt: Date.now() }
  }
}
export async function getMarketLeaders(options = {}) {
  try { return (await getPaprikaTickers(options)).filter((coin) => coin.rank > 0).sort((a, b) => a.rank - b.rank).slice(0, 100) } catch (error) {
    cancelled(error, options.signal)
    return (await gecko.getMarketLeaders(options)).map((coin) => ({ ...coin, source: 'CoinGecko', fetchedAt: Date.now() }))
  }
}
export async function getCoinMarketData(ids, options = {}) {
  if (!ids?.length) return {}
  let tickers = []
  try { tickers = await getPaprikaTickers(options) } catch (error) { cancelled(error, options.signal) }
  const found = {}, missing = []
  for (const id of [...new Set(ids)]) {
    const coin = tickers.find((item) => item.id === id)
    if (coin) found[id] = coin; else missing.push(id)
  }
  if (missing.length) {
    const pairs = await Promise.all(missing.map(async (id) => {
      try { return [id, await resolveGeckoId(id, options)] } catch (error) { cancelled(error, options.signal); return null }
    }))
    const valid = pairs.filter(Boolean)
    try {
      const fallback = await gecko.getCoinMarketData(valid.map(([, id]) => id), options)
      for (const [id, geckoId] of valid) if (fallback[geckoId]) found[id] = { ...fallback[geckoId], source: 'CoinGecko', fetchedAt: Date.now() }
    } catch (error) { cancelled(error, options.signal); if (!Object.keys(found).length) throw error }
  }
  if (!Object.keys(found).length) throw new Error('Market prices are unavailable from both providers')
  return found
}
export async function getCoinMetadata(id, options = {}) {
  try { const coin = await getPaprikaCoin(id, options); return { ...coin, logo: coin.image, marketCapRank: coin.rank } } catch (error) {
    cancelled(error, options.signal)
    return { ...await gecko.getCoinMetadata(await resolveGeckoId(id, options), options), source: 'CoinGecko', fetchedAt: Date.now() }
  }
}
export async function searchCoins(query, options = {}) {
  if (!query?.trim()) return []
  try {
    const term = query.trim().toLowerCase()
    const coins = (await getPaprikaTickers(options)).filter((coin) => coin.name.toLowerCase().includes(term) || coin.symbol.toLowerCase().includes(term))
      .sort((a, b) => Number(b.symbol.toLowerCase() === term) - Number(a.symbol.toLowerCase() === term) || (a.rank || Infinity) - (b.rank || Infinity))
    if (coins.length) return coins
  } catch (error) { cancelled(error, options.signal) }
  return gecko.searchCoins(query, options)
}
