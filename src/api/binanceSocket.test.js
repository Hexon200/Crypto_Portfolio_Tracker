import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BinanceSocketManager } from './binanceSocket.js'

class FakeWebSocket {
  static instances = []
  constructor(url) {
    this.url = url
    this.readyState = 0
    FakeWebSocket.instances.push(this)
  }
  open() { this.readyState = 1; this.onopen?.() }
  message(data) { this.onmessage?.({ data: JSON.stringify(data) }) }
  close() { this.readyState = 3; this.onclose?.() }
  fail() { this.onerror?.(new Error('offline')) }
}

describe('BinanceSocketManager', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    FakeWebSocket.instances = []
  })

  it('multiplexes subscriptions by rebuilding one combined stream', () => {
    const manager = new BinanceSocketManager({ WebSocketImpl: FakeWebSocket, baseUrl: 'wss://stream.binance.com:9443/ws' })
    manager.subscribe('BTCUSDT')
    expect(FakeWebSocket.instances[0].url).toBe('wss://stream.binance.com:9443/stream?streams=btcusdt@ticker')

    manager.subscribe('ETHUSDT')
    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(FakeWebSocket.instances[1].url).toContain('btcusdt@ticker/ethusdt@ticker')
    manager.destroy()
  })

  it('normalizes ticker payloads and throttles store updates per symbol to 250ms', () => {
    const onPrice = vi.fn()
    const manager = new BinanceSocketManager({ WebSocketImpl: FakeWebSocket, onPrice })
    manager.subscribe('BTCUSDT')
    const socket = FakeWebSocket.instances[0]
    socket.open()
    socket.message({ stream: 'btcusdt@ticker', data: { s: 'BTCUSDT', c: '65000.12', P: '2.45', E: 123 } })
    socket.message({ stream: 'btcusdt@ticker', data: { s: 'BTCUSDT', c: '65001.00', P: '2.50', E: 124 } })

    expect(onPrice).toHaveBeenCalledTimes(1)
    expect(onPrice).toHaveBeenLastCalledWith('BTCUSDT', { price: 65000.12, change24h: 2.45, lastUpdate: 123, source: 'ws' })
    vi.advanceTimersByTime(250)
    expect(onPrice).toHaveBeenCalledTimes(2)
    expect(onPrice.mock.calls[1][1].price).toBe(65001)
    manager.destroy()
  })

  it('reconnects with exponential backoff and exposes status', () => {
    const onStatus = vi.fn()
    const manager = new BinanceSocketManager({ WebSocketImpl: FakeWebSocket, onStatus })
    manager.subscribe('BTCUSDT')
    FakeWebSocket.instances[0].open()
    FakeWebSocket.instances[0].close()
    expect(onStatus).toHaveBeenLastCalledWith('reconnecting')

    vi.advanceTimersByTime(999)
    expect(FakeWebSocket.instances).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(2)
    FakeWebSocket.instances[1].close()
    vi.advanceTimersByTime(1999)
    expect(FakeWebSocket.instances).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(FakeWebSocket.instances).toHaveLength(3)
    manager.destroy()
  })

  it('closes cleanly when the last subscription is removed', () => {
    const onStatus = vi.fn()
    const manager = new BinanceSocketManager({ WebSocketImpl: FakeWebSocket, onStatus })
    manager.subscribe('BTCUSDT')
    manager.unsubscribe('BTCUSDT')
    expect(manager.getSymbols()).toEqual([])
    expect(onStatus).toHaveBeenLastCalledWith('disconnected')
    vi.advanceTimersByTime(30_000)
    expect(FakeWebSocket.instances).toHaveLength(1)
  })
})
