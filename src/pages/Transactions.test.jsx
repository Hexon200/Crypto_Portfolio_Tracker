import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Transactions from './Transactions.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
vi.mock('../api/marketData.js', () => ({ searchCoins: vi.fn().mockResolvedValue([]) }))
beforeEach(() => usePortfolioStore.setState({ holdings: [], transactions: null }))
it('records a buy, updates balances, and displays errors for an oversell', () => {
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={[{ pathname: '/transactions', state: { coin: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' } } }]}><Transactions /></MemoryRouter></QueryClientProvider>)
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } })
  fireEvent.change(screen.getByLabelText('Price per coin (USD)'), { target: { value: '100' } })
  fireEvent.change(screen.getByLabelText('Fee (USD)'), { target: { value: '10' } })
  fireEvent.click(screen.getByRole('button', { name: 'Record transaction', exact: true }))
  expect(usePortfolioStore.getState().holdings[0]).toMatchObject({ amount: 2, avgBuyPrice: 105 })
  fireEvent.click(screen.getByRole('button', { name: 'Edit BTC buy transaction' }))
  fireEvent.change(screen.getByLabelText('Transaction type'), { target: { value: 'sell' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
  expect(screen.getByRole('alert')).toHaveTextContent('only 0 available')
  expect(usePortfolioStore.getState().transactions[0].type).toBe('buy')
})
