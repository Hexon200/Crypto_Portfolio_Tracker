import { beforeEach, expect, it, vi } from 'vitest'
import axios from 'axios'
import { getKrakenHistory } from './kraken.js'
import { getCoinMarketChart } from './coingecko.js'
import { getPortfolioAssetHistory, getPortfolioHistory } from './portfolioHistory.js'
vi.mock('axios', () => ({ default: { get: vi.fn(), isCancel: e => e?.code === 'ERR_CANCELED' } }))
vi.mock('./kraken.js', () => ({ getKrakenHistory: vi.fn() }))
vi.mock('./coingecko.js', () => ({ getCoinMarketChart: vi.fn() }))
vi.mock('./marketData.js', () => ({ resolveGeckoId: vi.fn(async id => id) }))
const DAY = 86400000
beforeEach(() => vi.resetAllMocks())
it('paginates long histories and uses candle closing times', async () => {
 const rows = Array.from({ length: 1000 }, (_, i) => [i * DAY, 0, 0, 0, '100', 0, (i + 1) * DAY - 1])
 axios.get.mockResolvedValueOnce({ data: rows }).mockResolvedValueOnce({ data: [[1000 * DAY, 0, 0, 0, '120', 0, 1001 * DAY - 1]] })
 const result = await getPortfolioAssetHistory('bitcoin', 2 * DAY, 1001 * DAY)
 expect(axios.get).toHaveBeenCalledTimes(2)
 expect(axios.get.mock.calls[1][1].params.startTime).toBe(1000 * DAY)
 expect(result.points[0].timestamp).toBe(DAY - 1)
 expect(result.points.at(-1).price).toBe(120)
})
it('uses Kraken before CoinGecko and requests closing times', async () => {
 axios.get.mockRejectedValue(new Error('offline'))
 getKrakenHistory.mockResolvedValue({ points: [{ timestamp: 100, price: 10 }], source: 'Kraken', quote: 'USD' })
 expect((await getPortfolioAssetHistory('bitcoin', Date.now() - DAY, Date.now())).source).toBe('Kraken')
 expect(getKrakenHistory.mock.calls[0][2].closeTimes).toBe(true)
 expect(getCoinMarketChart).not.toHaveBeenCalled()
})
it('reports failed assets without inventing historical prices', async () => {
 axios.get.mockRejectedValue(new Error('offline'))
 getKrakenHistory.mockRejectedValue(new Error('offline'))
 getCoinMarketChart.mockRejectedValue(new Error('offline'))
 expect(await getPortfolioHistory(['bitcoin'], 100, 200)).toMatchObject({ histories: {}, failures: ['bitcoin'] })
})
it('does not use fallback providers after cancellation', async () => {
 axios.get.mockRejectedValue({ code: 'ERR_CANCELED' })
 await expect(getPortfolioAssetHistory('bitcoin', 100, 200)).rejects.toMatchObject({ code: 'ERR_CANCELED' })
 expect(getKrakenHistory).not.toHaveBeenCalled()
})
