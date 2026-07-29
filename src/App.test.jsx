import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.jsx'
import { useAlertStore } from './store/alertStore.js'
import { usePortfolioStore } from './store/portfolioStore.js'

vi.mock('./api/coingecko.js', () => ({
  getCoinsList: vi.fn().mockResolvedValue([]),
  getCoinMarketChart: vi.fn().mockResolvedValue([
    { timestamp: 1, price: 60000 },
    { timestamp: 2, price: 63000 },
  ]),
  getCoinMarketData: vi.fn().mockResolvedValue({}),
  getCoinMetadata: vi.fn().mockResolvedValue(null),
  searchCoins: vi.fn().mockResolvedValue([]),
}))

function renderApp(path = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Coinpulse app routes', () => {
  beforeEach(() => {
    usePortfolioStore.setState({ holdings: [] })
    useAlertStore.setState({ alerts: [] })
  })

  it('shows the dashboard empty state and primary navigation', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /portfolio overview/i })).toBeInTheDocument()
    expect(screen.getByText('No holdings yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /alerts/i }).length).toBeGreaterThan(0)
  })

  it('shows popular crypto chart controls without holdings', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /market pulse/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /bitcoin/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /ethereum/i })).toBeInTheDocument()
  })

  it('shows the alerts form and empty state', () => {
    renderApp('/alerts')
    expect(screen.getByRole('heading', { name: /price alerts/i })).toBeInTheDocument()
    expect(screen.getByText('No alerts set')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create alert/i })).toBeInTheDocument()
  })
})
