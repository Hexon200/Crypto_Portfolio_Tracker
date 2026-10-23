import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MarketDiscovery from './MarketDiscovery.jsx'
import { useWatchlistStore } from '../store/watchlistStore.js'

vi.mock('../api/marketData.js', () => ({
  getMarketLeaders: vi.fn().mockResolvedValue([
    { id: 'alpha', name: 'Alpha', symbol: 'A', price: 110, change24h: 10, change7d: -5, history: [100, 110] },
    { id: 'beta', name: 'Beta', symbol: 'B', price: 20, change24h: -2, change7d: 12, history: [22, 20] },
  ]),
  getCoinMarketData: vi.fn().mockResolvedValue({ alpha: { price: 110, change24h: 10 } }),
  getCoinsList: vi.fn().mockResolvedValue([]),
  searchCoins: vi.fn().mockResolvedValue([]),
}))

describe('market discovery', () => {
  beforeEach(() => useWatchlistStore.setState({ coins: [] }))
  it('saves a market mover, switches periods, and removes a watched coin', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MarketDiscovery /></QueryClientProvider>)
    fireEvent.click(await screen.findByRole('button', { name: 'Watch Alpha' }))
    expect(useWatchlistStore.getState().coins.map((coin) => coin.id)).toEqual(['alpha'])
    expect(JSON.parse(localStorage.getItem('coinpulse-watchlist-v1')).state.coins[0].id).toBe('alpha')
    fireEvent.click(screen.getByRole('button', { name: '7d' }))
    expect(screen.getByText('+12.00%')).toBeInTheDocument()
    expect(screen.getByText('-5.00%')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Alpha from watchlist' })[0])
    expect(useWatchlistStore.getState().coins).toEqual([])
  })
})
