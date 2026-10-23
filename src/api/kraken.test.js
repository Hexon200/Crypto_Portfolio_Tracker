import { beforeEach, expect, it, vi } from 'vitest'
import axios from 'axios'
vi.mock('axios', () => ({ default: { get: vi.fn() } }))
beforeEach(() => { vi.resetModules(); axios.get.mockReset() })
it.each([[1, 5], [7, 60], [30, 240]])('uses a supported interval for %s days', async (days, interval) => {
  const now = Math.floor(Date.now() / 1000)
  axios.get.mockResolvedValueOnce({ data: { error: [], result: { ETHUSD: { wsname: 'ETH/USD', altname: 'ETHUSD', status: 'online' } } } })
    .mockResolvedValueOnce({ data: { error: [], result: { XETHZUSD: [[now - 600, '', '', '', '100'], [now, '', '', '', '101']], last: now } } })
  const { getKrakenHistory } = await import('./kraken.js')
  const chart = await getKrakenHistory('ethereum', days)
  expect(chart).toMatchObject({ source: 'Kraken', quote: 'USD' })
  expect(chart.points[1]).toEqual({ timestamp: now * 1000, price: 101 })
  expect(axios.get.mock.calls[1][1].params.interval).toBe(interval)
})
it('rejects exchange errors instead of treating an empty chart as success', async () => {
  axios.get.mockResolvedValueOnce({ data: { result: { ETHUSD: { wsname: 'ETH/USD', altname: 'ETHUSD' } }, error: [] } })
    .mockResolvedValueOnce({ data: { error: ['EGeneral:Temporary lockout'] } })
  const { getKrakenHistory } = await import('./kraken.js')
  await expect(getKrakenHistory('ethereum', 7)).rejects.toThrow('lockout')
})
