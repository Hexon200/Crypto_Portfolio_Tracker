import { expect, it } from 'vitest'
import { buildPortfolioTimeline } from './portfolioTimeline.js'
const DAY = 86400000
const tx = (time, type, amount, price, fee = 0) => ({ id: String(time), date: new Date(time).toISOString(), type, amount, price, fee, coingeckoId: 'bitcoin', symbol: 'BTC' })
const histories = { bitcoin: { points: [0, 1, 2, 3].map(n => ({ timestamp: n * DAY, price: 100 + n * 10 })) } }
it('separates contributions from gains and includes buy fees', () => {
 const points = buildPortfolioTimeline([tx(0, 'buy', 1, 100, 2), tx(DAY, 'buy', 1, 110, 1)], histories, 0, DAY)
 expect(points.at(-1)).toMatchObject({ value: 220, invested: 213, profit: 7, realized: 0, unrealized: 7 })
})
it('preserves realized profit after a partial sale and complete exit', () => {
 const partial = buildPortfolioTimeline([tx(0, 'buy', 2, 100, 2), tx(DAY, 'sell', 1, 120, 1)], histories, DAY, DAY)
 expect(partial.at(-1)).toMatchObject({ value: 110, invested: 83, realized: 18, unrealized: 9, profit: 27 })
 const closed = buildPortfolioTimeline([tx(0, 'buy', 2, 100, 2), tx(DAY, 'sell', 2, 120, 2)], {}, DAY, DAY)
 expect(closed.at(-1)).toMatchObject({ value: 0, invested: -36, realized: 36, profit: 36 })
})
it('never uses future prices or treats missing held coins as zero', () => {
 const result = buildPortfolioTimeline([tx(0, 'opening', 1, 100)], { bitcoin: { points: [{ timestamp: DAY, price: 110 }] } }, 0, DAY)
 expect(result[0].value).toBeNull()
 expect(result.at(-1).value).toBe(110)
})
it('carries older positions into the selected range and excludes future trades', () => {
 const result = buildPortfolioTimeline([tx(0, 'buy', 1, 100), tx(4 * DAY, 'buy', 100, 100)], histories, DAY, 2 * DAY)
 expect(result[0]).toMatchObject({ invested: 100, value: 110, events: [] })
 expect(result.at(-1).profit).toBe(20)
})
it('stops carrying stale historical prices forward', () => {
 const result = buildPortfolioTimeline([tx(0, 'buy', 1, 100)], { bitcoin: { points: [{ timestamp: 0, price: 100 }] } }, 0, 4 * DAY)
 expect(result.at(-1).profit).toBeNull()
})
