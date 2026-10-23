import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { getCoinMarketChart } from './coingecko.js'
import { getPopularHistory } from './popularHistory.js'
vi.mock('axios', () => ({ default: { get: vi.fn(), isCancel: (error) => error?.code === 'ERR_CANCELED' } }))
vi.mock('./coingecko.js', () => ({ getCoinMarketChart: vi.fn() }))
beforeEach(() => vi.resetAllMocks())
describe('popular history', () => {
  it.each(['bitcoin', 'ethereum', 'solana', 'binancecoin', 'ripple'].flatMap((id) => [1, 7, 30].map((days) => [id, days])))('loads %s for %s days with the correct interval and coverage', async (id, days) => {
    axios.get.mockResolvedValue({ data: [[1000, '0', '0', '0', '100'], [2000, '0', '0', '0', '110']] })
    const history = await getPopularHistory(id, days)
    expect(history.points).toEqual([{ timestamp: 1000, price: 100 }, { timestamp: 2000, price: 110 }])
    expect(history.quote).toBe('USDT')
    expect(axios.get.mock.calls[0][1].params).toMatchObject({ interval: days === 1 ? '5m' : '1h', limit: days === 1 ? 289 : days * 24 + 1 })
    expect(getCoinMarketChart).not.toHaveBeenCalled()
  })
  it('falls back to USD history when exchange data is unavailable', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'))
    getCoinMarketChart.mockResolvedValue([{ timestamp: 1, price: 100 }, { timestamp: 2, price: 105 }])
    expect(await getPopularHistory('ethereum', 30)).toMatchObject({ source: 'CoinGecko', quote: 'USD' })
    expect(getCoinMarketChart).toHaveBeenCalledWith('ethereum', 30, { signal: undefined })
  })
  it('rejects empty history and does not start a fallback for cancelled requests', async () => {
    axios.get.mockResolvedValue({ data: [] })
    getCoinMarketChart.mockResolvedValue([])
    await expect(getPopularHistory('solana', 1)).rejects.toThrow('No price history')
    getCoinMarketChart.mockClear()
    axios.get.mockRejectedValue({ code: 'ERR_CANCELED' })
    await expect(getPopularHistory('solana', 1)).rejects.toMatchObject({ code: 'ERR_CANCELED' })
    expect(getCoinMarketChart).not.toHaveBeenCalled()
  })
  it('uses Kraken before CoinGecko when Binance fails', async () => {
    const now = Math.floor(Date.now() / 1000)
    axios.get.mockRejectedValueOnce(new Error('Binance unavailable'))
      .mockResolvedValueOnce({ data: { error: [], result: { ETHUSD: { wsname: 'ETH/USD', altname: 'ETHUSD' } } } })
      .mockResolvedValueOnce({ data: { error: [], result: { ETHUSD: [[now - 3600, '', '', '', '100'], [now, '', '', '', '110']] } } })
    expect(await getPopularHistory('ethereum', 30)).toMatchObject({ source: 'Kraken', quote: 'USD', interval: '4-hour' })
    expect(getCoinMarketChart).not.toHaveBeenCalled()
  })

})
