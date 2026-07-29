import { describe, expect, it } from 'vitest'
import { BINANCE_SYMBOL_MAP, toBinanceSymbol } from './binanceSymbolMap.js'

describe('Binance symbol mapping', () => {
  it('maps CoinGecko ids to Binance USDT tickers', () => {
    expect(toBinanceSymbol('bitcoin')).toBe('BTCUSDT')
    expect(toBinanceSymbol('ethereum')).toBe('ETHUSDT')
    expect(toBinanceSymbol('solana')).toBe('SOLUSDT')
  })

  it('returns null for unsupported and empty ids', () => {
    expect(toBinanceSymbol('made-up-coin')).toBeNull()
    expect(toBinanceSymbol()).toBeNull()
  })

  it('contains a curated top-coin map', () => {
    expect(Object.keys(BINANCE_SYMBOL_MAP).length).toBeGreaterThanOrEqual(90)
  })
})
