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

async function request(path, config) {
  try {
    return (await client.get(path, config)).data
  } catch (error) {
    if (axios.isCancel?.(error)) {
      throw error
    }
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
