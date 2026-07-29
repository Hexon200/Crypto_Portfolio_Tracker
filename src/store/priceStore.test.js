import { beforeEach, describe, expect, it } from 'vitest'
import { usePriceStore } from './priceStore.js'

describe('priceStore', () => {
  beforeEach(() => usePriceStore.setState({ prices: {}, connectionStatus: 'disconnected' }))

  it('updates one symbol without replacing other prices', () => {
    usePriceStore.getState().updatePrice('BTCUSDT', { price: 65000, change24h: 2, lastUpdate: 10, source: 'ws' })
    usePriceStore.getState().updatePrice('ETHUSDT', { price: 3500, change24h: -1, lastUpdate: 11, source: 'rest' })
    expect(usePriceStore.getState().prices.BTCUSDT.price).toBe(65000)
    expect(usePriceStore.getState().prices.ETHUSDT.source).toBe('rest')
  })

  it('sets connection status', () => {
    usePriceStore.getState().setConnectionStatus('connected')
    expect(usePriceStore.getState().connectionStatus).toBe('connected')
  })
})
