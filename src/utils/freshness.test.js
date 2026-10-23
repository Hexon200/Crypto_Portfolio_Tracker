import { expect, it } from 'vitest'
import { freshness } from './freshness.js'
it('uses provider time even after a recent fetch', () => {
 expect(freshness({ updatedAt: 1000, fetchedAt: 2000000, now: 2000000 }).label).toContain('Stale / cached')
})
it('only calls recent connected stream data live', () => {
 expect(freshness({ updatedAt: 1000, now: 2000, live: true }).label).toContain('Live')
 expect(freshness({ updatedAt: 1000, now: 2000, live: true, connected: false }).label).toContain('Stale / cached')
 expect(freshness({ updatedAt: 1000, now: 70000, live: true }).label).toContain('Stale / cached')
})
it('distinguishes fetch time, failed refreshes, and missing data', () => {
 expect(freshness({ fetchedAt: 1000, now: 2000 }).label).toBe('Cached snapshot · fetched just now')
 expect(freshness({ fetchedAt: 1000, now: 2000, error: true }).label).toContain('refresh failed')
 expect(freshness({ now: 2000 }).label).toBe('Awaiting data')
})
