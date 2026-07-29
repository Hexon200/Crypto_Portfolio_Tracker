import { StrictMode } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useBinanceSocket } from './binanceSocket.js'

class FakeWebSocket {
  static instances = []
  constructor(url) { this.url = url; this.closed = false; FakeWebSocket.instances.push(this) }
  close() { this.closed = true; this.onclose?.() }
}

function Harness() {
  useBinanceSocket(['BTCUSDT'], { onPrice: vi.fn(), onStatus: vi.fn() })
  return null
}

describe('useBinanceSocket', () => {
  it('keeps a live manager after React StrictMode effect replay', () => {
    const original = globalThis.WebSocket
    globalThis.WebSocket = FakeWebSocket
    FakeWebSocket.instances = []
    render(<StrictMode><Harness /></StrictMode>)
    expect(FakeWebSocket.instances.length).toBeGreaterThanOrEqual(2)
    expect(FakeWebSocket.instances.at(-1).closed).toBe(false)
    globalThis.WebSocket = original
  })
})
