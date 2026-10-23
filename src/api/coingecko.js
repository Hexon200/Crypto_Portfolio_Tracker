import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3',
  timeout: 8000,
  headers: import.meta.env.VITE_COINGECKO_API_KEY
    ? { 'x-cg-demo-api-key': import.meta.env.VITE_COINGECKO_API_KEY }
    : {},
})

function normalizeError(error) {
  if (axios.isCancel?.(error)) {
    return error
  }
  const payload = error?.response?.data
  const message = payload?.error || payload?.status?.error_message || error?.message || 'CoinGecko request failed'
  return {
    source: 'coingecko',
    status: error?.response?.status ?? null,
    message,
  }
}

let rateLimitedUntil = 0

async function request(path, config) {
  if (Date.now() < rateLimitedUntil) throw { source: 'coingecko', status: 429, message: 'Request limit reached. Retry in a minute.' }
  try {
    return (await client.get(path, config)).data
  } catch (error) {
    if (axios.isCancel?.(error)) {
      throw error
    }
    if (error?.response?.status === 429) rateLimitedUntil = Date.now() + 60_000
    throw normalizeError(error)
  }
}

export async function searchCoins(query, options = {}) {
  if (!query?.trim()) return []
  const data = await request('/search', { params: { query: query.trim() }, signal: options.signal })
  return (data.coins || []).map((coin) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    image: coin.thumb,
    marketCapRank: coin.market_cap_rank,
  }))
}

export async function getCoinsList(options = {}) {
  const data = await request('/coins/list', { signal: options.signal })
  return data.map((coin) => ({ ...coin, symbol: coin.symbol.toUpperCase() }))
}

export async function getCoinMetadata(coinId, options = {}) {
  const data = await request(`/coins/${coinId}`, {
    params: { localization: false, tickers: false, market_data: false, community_data: false, developer_data: false },
    signal: options.signal,
  })
  return {
    id: data.id,
    symbol: data.symbol.toUpperCase(),
    name: data.name,
    logo: data.image?.large || data.image?.small || null,
    description: data.description?.en || '',
    marketCapRank: data.market_cap_rank,
  }
}

export async function getCoinMarketData(coinIds, options = {}) {
  if (!coinIds?.length) return {}
  const data = await request('/coins/markets', {
    params: { vs_currency: 'usd', ids: coinIds.join(','), price_change_percentage: '24h' },
    signal: options.signal,
  })
  return Object.fromEntries(data.map((coin) => [coin.id, {
    symbol: coin.symbol.toUpperCase(),
    price: coin.current_price,
    marketCap: coin.market_cap,
    change24h: coin.price_change_percentage_24h,
  }]))
}

export async function getCoinMarketChart(coinId, days = 7, options = {}) {
  const params = { vs_currency: 'usd', days }
  if (days > 30) {
    params.interval = 'daily'
  }
  const data = await request(`/coins/${coinId}/market_chart`, {
    params,
    signal: options.signal,
  })
  return (data.prices || []).map(([timestamp, price]) => ({ timestamp, price }))
}

export async function getMarketLeaders(options = {}) {
  const data = await request('/coins/markets', {
    params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 100, page: 1, sparkline: true, price_change_percentage: '24h,7d' },
    signal: options.signal,
  })
  return data.map((coin) => ({
    id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(), image: coin.image,
    price: coin.current_price, marketCap: coin.market_cap, volume: coin.total_volume, rank: coin.market_cap_rank, change24h: coin.price_change_percentage_24h,
    change7d: coin.price_change_percentage_7d_in_currency,
    history: coin.sparkline_in_7d?.price || [],
  }))
}

export async function getCoinDetails(coinId, options = {}) {
  try {
    const data = await request('/coins/markets', {
      params: { vs_currency: 'usd', ids: coinId, price_change_percentage: '24h,7d' }, signal: options.signal,
    })
    const coin = data[0]
    if (!coin) throw new Error('Coin statistics are unavailable')
    return { id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(), image: coin.image,
      price: coin.current_price, marketCap: coin.market_cap, volume: coin.total_volume, rank: coin.market_cap_rank,
      change24h: coin.price_change_percentage_24h, change7d: coin.price_change_percentage_7d_in_currency }
  } catch (error) {
    if (options.signal?.aborted || axios.isCancel?.(error) || error.status === 429 || error.status === 401 || error.status === 403) throw error
    const coin = await request(`/coins/${coinId}`, {
      params: { localization: false, tickers: false, market_data: true, community_data: false, developer_data: false }, signal: options.signal,
    })
    if (!coin.market_data) throw new Error('Coin statistics are unavailable')
    return { id: coin.id, name: coin.name, symbol: coin.symbol.toUpperCase(), image: coin.image?.small,
      price: coin.market_data.current_price?.usd, marketCap: coin.market_data.market_cap?.usd,
      volume: coin.market_data.total_volume?.usd, rank: coin.market_cap_rank,
      change24h: coin.market_data.price_change_percentage_24h, change7d: coin.market_data.price_change_percentage_7d }
  }
}
