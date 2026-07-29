import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore } from './alertStore.js'

describe('alertStore', () => {
  beforeEach(() => useAlertStore.setState({ alerts: [] }))

  it('adds, toggles, triggers once, re-enables, removes, and persists alerts', () => {
    vi.spyOn(Date, 'now').mockReturnValue(12345)
    const alert = { id: 'a1', coingeckoId: 'bitcoin', symbol: 'BTC', condition: 'above', targetPrice: 70000, enabled: true, triggeredAt: null }
    useAlertStore.getState().addAlert(alert)
    expect(localStorage.getItem('crypto-alerts-v1')).toContain('bitcoin')

    useAlertStore.getState().markTriggered('a1')
    expect(useAlertStore.getState().alerts[0]).toMatchObject({ enabled: false, triggeredAt: 12345 })
    useAlertStore.getState().markTriggered('a1')
    expect(useAlertStore.getState().alerts[0].triggeredAt).toBe(12345)

    useAlertStore.getState().toggleAlert('a1')
    expect(useAlertStore.getState().alerts[0]).toMatchObject({ enabled: true, triggeredAt: null })
    useAlertStore.getState().removeAlert('a1')
    expect(useAlertStore.getState().alerts).toEqual([])
  })
})
