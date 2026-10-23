import { expect, it } from 'vitest'
import { calculateAllocation } from './PortfolioAllocation.jsx'

it('combines duplicate coin positions and calculates shares by value', () => {
  const result = calculateAllocation([
    { coingeckoId: 'bitcoin', symbol: 'BTC', amount: 1 },
    { coingeckoId: 'bitcoin', symbol: 'BTC', amount: 2 },
    { coingeckoId: 'ethereum', symbol: 'ETH', amount: 5 },
  ], { BTC: { price: 100 }, ETH: { price: 20 } })
  expect(result.total).toBe(400)
  expect(result.assets.map((asset) => asset.percent)).toEqual([75, 25])
  expect(result.missing).toBe(0)
})

it('flags unknown prices and handles empty or zero-valued holdings', () => {
  expect(calculateAllocation([{ coingeckoId: 'bitcoin', symbol: 'BTC', amount: 1 }], {}).missing).toBe(1)
  expect(calculateAllocation([], {}).assets).toEqual([])
  expect(calculateAllocation([{ coingeckoId: 'bitcoin', symbol: 'BTC', amount: 0 }], {}).missing).toBe(0)
  expect(calculateAllocation([{ coingeckoId: 'bitcoin', symbol: 'BTC', amount: 1 }], { BTC: { price: 0 } }).assets).toEqual([])
})
