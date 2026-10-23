import { beforeEach, expect, it, vi } from 'vitest'
import axios from 'axios'
vi.mock('axios', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.resetModules(); axios.get.mockReset() })
it('shares a single snapshot request and keeps provider-specific IDs distinct', async () => {
  axios.get.mockResolvedValue({ data: [
    { id: 'btc-bitcoin', name: 'Bitcoin', symbol: 'BTC', rank: 1, quotes: { USD: { price: 100, percent_change_24h: 2 } } },
    { id: 'ex-example', name: 'Example', symbol: 'EX', rank: 500, quotes: { USD: { price: 3 } } },
  ] })
  const { getPaprikaTickers } = await import('./coinpaprika.js')
  const [a, b] = await Promise.all([getPaprikaTickers(), getPaprikaTickers()])
  expect(a).toBe(b)
  expect(a.map((coin) => coin.id)).toEqual(['bitcoin', 'paprika:ex-example'])
  await getPaprikaTickers()
  expect(axios.get).toHaveBeenCalledTimes(1)
})
