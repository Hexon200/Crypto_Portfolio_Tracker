import { act, render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertChecker } from './useAlertChecker.js'
import { useAlertStore } from '../store/alertStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { useToastStore } from '../store/toastStore.js'

function Harness() {
  useAlertChecker()
  return null
}

describe('useAlertChecker', () => {
  beforeEach(() => {
    useAlertStore.setState({ alerts: [] })
    usePriceStore.setState({ prices: {}, connectionStatus: 'disconnected' })
    useToastStore.setState({ notifications: [] })
    const NotificationMock = vi.fn()
    NotificationMock.permission = 'granted'
    globalThis.Notification = NotificationMock
  })

  it('fires a matching alert once, creates a toast, and does not repeatedly fire', () => {
    useAlertStore.getState().addAlert({ id: 'a1', coingeckoId: 'bitcoin', symbol: 'BTC', condition: 'below', targetPrice: 70000, enabled: true, triggeredAt: null })
    render(<Harness />)

    act(() => usePriceStore.getState().updatePrice('BTC', { price: 65000, change24h: 1, lastUpdate: 1, source: 'ws' }))
    expect(globalThis.Notification).toHaveBeenCalledTimes(1)
    expect(useAlertStore.getState().alerts[0].enabled).toBe(false)
    expect(useToastStore.getState().notifications).toHaveLength(1)

    act(() => usePriceStore.getState().updatePrice('BTC', { price: 64000, change24h: 1, lastUpdate: 2, source: 'ws' }))
    expect(globalThis.Notification).toHaveBeenCalledTimes(1)
    expect(useToastStore.getState().notifications).toHaveLength(1)
  })
})
