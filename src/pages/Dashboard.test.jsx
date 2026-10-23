import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import Dashboard from './Dashboard.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { usePriceStore } from '../store/priceStore.js'

vi.mock('../components/PortfolioPerformance.jsx', () => ({ default: () => null }))
vi.mock('../components/MarketDiscovery.jsx', () => ({ default: () => null }))
vi.mock('../components/PopularCryptoChart.jsx', () => ({ default: () => null }))
vi.mock('../api/marketData.js', () => ({ getCoinMarketData: vi.fn().mockResolvedValue({}), getCoinMetadata: vi.fn().mockResolvedValue(null) }))

it('filters personal profit independently of daily change and sorts by return', async () => {
  usePortfolioStore.setState({ holdings: [
    { id: '1', symbol: 'WIN', coingeckoId: 'win', amount: 1, avgBuyPrice: 100 },
    { id: '2', symbol: 'LOSS', coingeckoId: 'loss', amount: 1, avgBuyPrice: 200 },
  ] })
  usePriceStore.setState({ prices: { WIN: { price: 150, change24h: -2 }, LOSS: { price: 100, change24h: 10 } } })
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><Dashboard /></MemoryRouter></QueryClientProvider>)
  await screen.findByText('+50.00% return')
  fireEvent.click(screen.getByRole('button', { name: 'In profit' }))
  expect(screen.queryByText('-50.00% return')).not.toBeInTheDocument()
  expect(screen.getByText('+50.00% return')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'In loss' }))
  expect(screen.getByText('-50.00% return')).toBeInTheDocument()
  expect(screen.queryByText('+50.00% return')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'All holdings' }))
  fireEvent.change(screen.getByRole('combobox', { name: 'Sort holdings' }), { target: { value: 'returnPct' } })
  expect(screen.getAllByRole('row')[1]).toHaveTextContent('WIN')
})
