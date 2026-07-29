import { useCallback, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCoinMarketData } from '../api/coingecko.js'
import { toBinanceSymbol } from '../api/binanceSymbolMap.js'
import { useBinanceSocket } from '../api/binanceSocket.js'
import { useAlertStore } from '../store/alertStore.js'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { usePriceStore } from '../store/priceStore.js'

export function useRealtimePrices() {
  const holdings = usePortfolioStore((state) => state.holdings)
  const alerts = useAlertStore((state) => state.alerts)
  const updatePrice = usePriceStore((state) => state.updatePrice)
  const setConnectionStatus = usePriceStore((state) => state.setConnectionStatus)

  const trackedCoins = useMemo(() => {
    const defaultCoins = [
      { coingeckoId: 'bitcoin', symbol: 'BTC' },
      { coingeckoId: 'ethereum', symbol: 'ETH' },
      { coingeckoId: 'solana', symbol: 'SOL' },
      { coingeckoId: 'binancecoin', symbol: 'BNB' },
      { coingeckoId: 'ripple', symbol: 'XRP' },
    ]
    const byId = new Map()
    ;[...defaultCoins, ...holdings, ...alerts].forEach((item) => byId.set(item.coingeckoId, { coingeckoId: item.coingeckoId, symbol: item.symbol }))
    return [...byId.values()]
  }, [holdings, alerts])
  const coinIds = useMemo(() => trackedCoins.map((coin) => coin.coingeckoId).sort(), [trackedCoins])
  const fallbackCoins = useMemo(() => trackedCoins.filter((coin) => !toBinanceSymbol(coin.coingeckoId)), [trackedCoins])
  const wsSymbols = useMemo(() => [...new Set(trackedCoins.map((coin) => toBinanceSymbol(coin.coingeckoId)).filter(Boolean))].sort(), [trackedCoins])

  const initialMarket = useQuery({
    queryKey: ['market-data', coinIds],
    queryFn: () => getCoinMarketData(coinIds),
    enabled: coinIds.length > 0,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!initialMarket.data) return
    trackedCoins.forEach((coin) => {
      const market = initialMarket.data[coin.coingeckoId]
      const existing = usePriceStore.getState().prices[coin.symbol]
      if (market && existing?.source !== 'ws') updatePrice(coin.symbol, {
        price: market.price,
        change24h: market.change24h,
        lastUpdate: Date.now(),
        source: 'rest',
      })
    })
  }, [initialMarket.data, trackedCoins, updatePrice])

  const fallbackIds = useMemo(() => fallbackCoins.map((coin) => coin.coingeckoId).sort(), [fallbackCoins])
  const fallbackMarket = useQuery({
    queryKey: ['fallback-market-data', fallbackIds],
    queryFn: () => getCoinMarketData(fallbackIds),
    enabled: fallbackIds.length > 0,
    refetchInterval: 30_000,
    staleTime: 25_000,
  })

  useEffect(() => {
    if (!fallbackMarket.data) return
    fallbackCoins.forEach((coin) => {
      const market = fallbackMarket.data[coin.coingeckoId]
      if (market) updatePrice(coin.symbol, {
        price: market.price,
        change24h: market.change24h,
        lastUpdate: Date.now(),
        source: 'rest',
      })
    })
  }, [fallbackMarket.data, fallbackCoins, updatePrice])

  const handlePrice = useCallback((binanceSymbol, data) => {
    const currentTracked = [...usePortfolioStore.getState().holdings, ...useAlertStore.getState().alerts]
    const targetSymbols = new Set(currentTracked
      .filter((coin) => toBinanceSymbol(coin.coingeckoId) === binanceSymbol)
      .map((coin) => coin.symbol))
    targetSymbols.forEach((symbol) => usePriceStore.getState().updatePrice(symbol, data))
  }, [])

  const handleStatus = useCallback((status) => setConnectionStatus(status), [setConnectionStatus])
  useBinanceSocket(initialMarket.isPending ? [] : wsSymbols, { onPrice: handlePrice, onStatus: handleStatus })

  return { isInitialLoading: initialMarket.isLoading, fallbackCount: fallbackCoins.length }
}
