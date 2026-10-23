import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import PortfolioPerformance from './PortfolioPerformance.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { getPortfolioHistory } from '../api/portfolioHistory.js'
vi.mock('../api/portfolioHistory.js', () => ({ getPortfolioHistory: vi.fn() }))
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><PortfolioPerformance /></MemoryRouter></QueryClientProvider>)
beforeEach(() => { usePortfolioStore.setState({ holdings: [], transactions: [] }); vi.clearAllMocks() })
it('guides an empty portfolio to transaction entry without fetching', () => {
 mount()
 expect(screen.getByRole('link', { name: 'Record your first transaction' })).toHaveAttribute('href', '/transactions')
 expect(getPortfolioHistory).not.toHaveBeenCalled()
})
it('renders history and allows range selection', async () => {
 const now = Date.now(), start = now - 40 * 86400000
 usePortfolioStore.setState({ transactions: [{ id: '1', coingeckoId: 'bitcoin', symbol: 'BTC', type: 'buy', amount: 1, price: 100, fee: 0, date: new Date(start).toISOString() }] })
 getPortfolioHistory.mockResolvedValue({ histories: { bitcoin: { points: [{ timestamp: start, price: 100 }, { timestamp: now - 1000, price: 120 }], source: 'Binance', quote: 'USDT' } }, failures: [], fetchedAt: now })
 mount()
 expect(await screen.findByRole('img', { name: 'Portfolio value and net invested money over time' })).toBeInTheDocument()
 expect(screen.getByText('$120.00')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button', { name: 'All', exact: true }))
 expect(screen.getByRole('button', { name: 'All', exact: true })).toHaveAttribute('aria-pressed', 'true')
 await screen.findByRole('slider')
 expect(screen.getByText(/buy 1 BTC/)).toBeInTheDocument()
})
