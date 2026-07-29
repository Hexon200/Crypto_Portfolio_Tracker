import { useEffect, useRef } from 'react'

const DEFAULT_BASE = import.meta.env.VITE_BINANCE_WS_BASE || 'wss://stream.binance.com:9443/ws'

export class BinanceSocketManager {
  constructor({ WebSocketImpl = globalThis.WebSocket, baseUrl = DEFAULT_BASE, onPrice = () => {}, onStatus = () => {} } = {}) {
    this.WebSocketImpl = WebSocketImpl
    this.baseUrl = baseUrl
    this.onPrice = onPrice
    this.onStatus = onStatus
    this.symbols = new Set()
    this.socket = null
    this.reconnectTimer = null
    this.reconnectAttempt = 0
    this.throttleState = new Map()
    this.destroyed = false
  }

  setCallbacks({ onPrice, onStatus }) {
    if (onPrice) this.onPrice = onPrice
    if (onStatus) this.onStatus = onStatus
  }

  getSymbols() {
    return [...this.symbols]
  }

  revive() {
    // React StrictMode intentionally replays effects in development. The first
    // cleanup destroys the manager; the replay must create a fresh connection.
    this.destroyed = false
  }

  subscribe(symbol) {
    const normalized = symbol?.toUpperCase()
    if (!normalized || this.symbols.has(normalized)) return
    this.symbols.add(normalized)
    this.rebuildConnection()
  }

  unsubscribe(symbol) {
    if (!this.symbols.delete(symbol?.toUpperCase())) return
    this.throttleState.delete(symbol?.toUpperCase())
    this.rebuildConnection()
  }

  buildUrl() {
    const root = this.baseUrl.replace(/\/ws\/?$/, '')
    const streams = [...this.symbols].map((symbol) => `${symbol.toLowerCase()}@ticker`).join('/')
    return `${root}/stream?streams=${streams}`
  }

  rebuildConnection() {
    this.clearReconnectTimer()
    this.closeCurrentSocket()
    if (this.destroyed || this.symbols.size === 0) {
      this.emitStatus('disconnected')
      return
    }
    this.reconnectAttempt = 0
    this.connect(false)
  }

  connect(isReconnect = false) {
    if (this.destroyed || this.symbols.size === 0) return
    this.emitStatus(isReconnect ? 'reconnecting' : 'connecting')
    const socket = new this.WebSocketImpl(this.buildUrl())
    this.socket = socket

    socket.onopen = () => {
      if (socket !== this.socket) return
      this.reconnectAttempt = 0
      this.emitStatus('connected')
    }
    socket.onmessage = (event) => {
      if (socket !== this.socket) return
      this.handleMessage(event.data)
    }
    socket.onerror = () => {
      if (socket !== this.socket) return
      this.emitStatus('reconnecting')
      socket.close()
    }
    socket.onclose = () => {
      if (socket !== this.socket) return
      this.socket = null
      if (!this.destroyed && this.symbols.size > 0) this.scheduleReconnect()
      else this.emitStatus('disconnected')
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer || this.destroyed || this.symbols.size === 0) return
    this.emitStatus('reconnecting')
    const delay = Math.min(1000 * (2 ** this.reconnectAttempt), 30_000)
    this.reconnectAttempt += 1
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect(true)
    }, delay)
  }

  handleMessage(rawMessage) {
    try {
      const message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
      const ticker = message.data || message
      const symbol = ticker.s?.toUpperCase()
      if (!symbol || !this.symbols.has(symbol)) return
      this.throttledUpdate(symbol, {
        price: Number(ticker.c),
        change24h: Number(ticker.P),
        lastUpdate: ticker.E || Date.now(),
        source: 'ws',
      })
    } catch {
      // Ignore malformed third-party frames; a subsequent valid ticker will replace it.
    }
  }

  throttledUpdate(symbol, data) {
    const now = Date.now()
    const state = this.throttleState.get(symbol) || { lastEmission: null, pending: null, timer: null }
    if (state.lastEmission === null || now - state.lastEmission >= 250) {
      state.lastEmission = now
      this.onPrice(symbol, data)
    } else {
      state.pending = data
      if (!state.timer) {
        state.timer = setTimeout(() => {
          state.timer = null
          if (state.pending) {
            state.lastEmission = Date.now()
            this.onPrice(symbol, state.pending)
            state.pending = null
          }
        }, 250 - (now - state.lastEmission))
      }
    }
    this.throttleState.set(symbol, state)
  }

  emitStatus(status) {
    this.onStatus(status)
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
  }

  closeCurrentSocket() {
    if (!this.socket) return
    const socket = this.socket
    this.socket = null
    socket.close()
  }

  destroy() {
    this.destroyed = true
    this.symbols.clear()
    this.clearReconnectTimer()
    for (const state of this.throttleState.values()) if (state.timer) clearTimeout(state.timer)
    this.throttleState.clear()
    this.closeCurrentSocket()
    this.emitStatus('disconnected')
  }
}

export function useBinanceSocket(symbols, { onPrice, onStatus }) {
  const managerRef = useRef(null)

  if (!managerRef.current) managerRef.current = new BinanceSocketManager({ onPrice, onStatus })
  managerRef.current.setCallbacks({ onPrice, onStatus })

  useEffect(() => {
    const manager = managerRef.current
    if (manager.destroyed) manager.revive()
    const next = new Set(symbols.filter(Boolean).map((symbol) => symbol.toUpperCase()))
    manager.getSymbols().filter((symbol) => !next.has(symbol)).forEach((symbol) => manager.unsubscribe(symbol))
    next.forEach((symbol) => manager.subscribe(symbol))
  }, [symbols])

  useEffect(() => () => managerRef.current?.destroy(), [])
  return managerRef.current
}
