import { beforeEach, expect, it, vi } from 'vitest'
import * as gecko from './coingecko.js'
import { getPaprikaCoin, getPaprikaTickers } from './coinpaprika.js'
import { getCoinDetails, getCoinMarketData, getMarketLeaders, resolveGeckoId } from './marketData.js'
vi.mock('./coingecko.js', () => ({ getCoinDetails: vi.fn(), getMarketLeaders: vi.fn(), getCoinMarketData: vi.fn(), searchCoins: vi.fn() }))
vi.mock('./coinpaprika.js', () => ({ getPaprikaCoin: vi.fn(), getPaprikaTickers: vi.fn(), checkAbort: (signal) => { if (signal?.aborted) throw Object.assign(new Error('cancelled'), { code: 'ERR_CANCELED' }) } }))
const btc = { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 100, rank: 1, source: 'CoinPaprika' }
beforeEach(() => vi.resetAllMocks())
it('prefers CoinPaprika and avoids CoinGecko when data is available', async () => {
  getPaprikaCoin.mockResolvedValue(btc); getPaprikaTickers.mockResolvedValue([btc])
  expect(await getCoinDetails('bitcoin')).toEqual(btc)
  expect(await getMarketLeaders()).toEqual([btc])
  expect(await getCoinMarketData(['bitcoin'])).toEqual({ bitcoin: btc })
  expect(gecko.getCoinDetails).not.toHaveBeenCalled()
  expect(gecko.getCoinMarketData).not.toHaveBeenCalled()
})
it('uses CoinGecko only for missing markets and preserves primary results', async () => {
  getPaprikaTickers.mockResolvedValue([btc])
  gecko.getCoinMarketData.mockResolvedValue({ ethereum: { price: 20 } })
  expect(await getCoinMarketData(['bitcoin', 'ethereum'])).toMatchObject({ bitcoin: btc, ethereum: { price: 20, source: 'CoinGecko' } })
  expect(gecko.getCoinMarketData.mock.calls[0][0]).toEqual(['ethereum'])
})
it('falls back on provider failure and labels the resulting source', async () => {
  getPaprikaCoin.mockRejectedValue(new Error('unavailable'))
  gecko.getCoinDetails.mockResolvedValue({ price: 100 })
  expect(await getCoinDetails('bitcoin')).toMatchObject({ source: 'CoinGecko', id: 'bitcoin' })
})
it('never routes ambiguous ticker matches to the wrong coin', async () => {
  getPaprikaCoin.mockResolvedValue({ name: 'Example', symbol: 'EX' })
  gecko.searchCoins.mockResolvedValue([{ id: 'one', name: 'Example', symbol: 'EX' }, { id: 'two', name: 'Example', symbol: 'EX' }])
  await expect(resolveGeckoId('paprika:ex-example')).rejects.toThrow('unambiguous')
})
it('does not start a fallback after cancellation', async () => {
  const controller = new AbortController(); controller.abort()
  getPaprikaCoin.mockRejectedValue(new Error('cancelled'))
  await expect(getCoinDetails('bitcoin', { signal: controller.signal })).rejects.toMatchObject({ code: 'ERR_CANCELED' })
  expect(gecko.getCoinDetails).not.toHaveBeenCalled()
})
