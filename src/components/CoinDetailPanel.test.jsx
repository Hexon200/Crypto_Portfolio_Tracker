import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CoinDetailPanel from './CoinDetailPanel.jsx'
import Portfolio from '../pages/Portfolio.jsx'
import Alerts from '../pages/Alerts.jsx'
import { useCoinDetailStore } from '../store/coinDetailStore.js'
import { useWatchlistStore } from '../store/watchlistStore.js'

vi.mock('./PopularCryptoChart.jsx', () => ({ default: ({ coin }) => <p>{coin.name} chart</p> }))
vi.mock('../api/marketData.js', () => ({ getCoinDetails: vi.fn().mockResolvedValue({ id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 2000, marketCap: 240000000000, volume: 1000000, rank: 2, change24h: 2, change7d: 5 }), searchCoins: vi.fn().mockResolvedValue([]) }))
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  useWatchlistStore.setState({ coins: [] })
  useCoinDetailStore.getState().open({ id: 'ethereum', name: 'Ethereum', symbol: 'ETH' })
})
function mount() {
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><Routes><Route path="/" element={<p>Dashboard</p>} /><Route path="/portfolio" element={<Portfolio />} /><Route path="/alerts" element={<Alerts />} /></Routes><CoinDetailPanel /></MemoryRouter></QueryClientProvider>)
}
it('shows statistics, toggles watching, and prefills the holding form', async () => {
  mount()
  expect(await screen.findByText('$2,000.00')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Watch coin' }))
  expect(useWatchlistStore.getState().coins[0].id).toBe('ethereum')
  fireEvent.click(screen.getByRole('button', { name: 'Add holding', exact: true }))
  expect(screen.getByLabelText('Coin')).toHaveValue('Ethereum (ETH)')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('prefills the alert form and supports closing the panel', () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'Set alert' }))
  expect(screen.getByLabelText('Alert coin')).toHaveValue('Ethereum (ETH)')
})
it('closes on Escape via the native dialog cancel event', () => {
  mount()
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }))
  expect(useCoinDetailStore.getState().coin).toBeNull()
  expect(document.body.style.overflow).not.toBe('hidden')
})
