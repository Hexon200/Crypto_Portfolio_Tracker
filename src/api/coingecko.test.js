import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const create = vi.fn(() => ({ get }))
const isCancel = vi.fn(() => false)
vi.mock('axios', () => ({ default: { create, isCancel } }))

describe('CoinGecko API', () => {
  beforeEach(() => {
    vi.resetModules()
    get.mockReset()
    create.mockClear()
  })

  it('searches coins and returns normalized results', async () => {
    get.mockResolvedValue({ data: { coins: [{ id: 'bitcoin', name: 'Bitcoin', symbol: 'btc', thumb: 'btc.png', market_cap_rank: 1 }] } })
    const { searchCoins } = await import('./coingecko.js')

    await expect(searchCoins(' bit coin ')).resolves.toEqual([
      { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', image: 'btc.png', marketCapRank: 1 },
    ])
    expect(get).toHaveBeenCalledWith('/search', { params: { query: 'bit coin' } })
  })

  it('normalizes list, metadata, and batched market data', async () => {
    get
      .mockResolvedValueOnce({ data: [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' }] })
      .mockResolvedValueOnce({ data: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: { large: 'logo.png' }, description: { en: 'Peer-to-peer money' }, market_cap_rank: 1 } })
      .mockResolvedValueOnce({ data: [{ id: 'bitcoin', symbol: 'btc', current_price: 65000, market_cap: 1_200_000, price_change_percentage_24h: 2.4 }] })
    const { getCoinsList, getCoinMetadata, getCoinMarketData } = await import('./coingecko.js')

    await expect(getCoinsList()).resolves.toEqual([{ id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }])
    await expect(getCoinMetadata('bitcoin')).resolves.toMatchObject({ id: 'bitcoin', symbol: 'BTC', logo: 'logo.png', marketCapRank: 1 })
    await expect(getCoinMarketData(['bitcoin'])).resolves.toEqual({
      bitcoin: { symbol: 'BTC', price: 65000, marketCap: 1_200_000, change24h: 2.4 },
    })
  })

  it('normalizes seven-day chart points', async () => {
    get.mockResolvedValue({ data: { prices: [[1000, 62000], [2000, 62500.5], [3000, 61000]] } })
    const { getCoinMarketChart } = await import('./coingecko.js')

    await expect(getCoinMarketChart('bitcoin', 7)).resolves.toEqual([
      { timestamp: 1000, price: 62000 },
      { timestamp: 2000, price: 62500.5 },
      { timestamp: 3000, price: 61000 },
    ])
    expect(get).toHaveBeenCalledWith('/coins/bitcoin/market_chart', {
      params: { vs_currency: 'usd', days: 7 },
      signal: undefined,
    })
  })

  it('throws a normalized error object', async () => {
    get.mockRejectedValue({ response: { status: 429, data: { error: 'Rate limit exceeded' } }, message: 'Request failed' })
    const { getCoinsList } = await import('./coingecko.js')

    await expect(getCoinsList()).rejects.toEqual({ source: 'coingecko', status: 429, message: 'Rate limit exceeded' })
  })
})
