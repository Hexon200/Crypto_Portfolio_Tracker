import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import Backup from './Backup.jsx'
import { usePortfolioStore } from '../store/portfolioStore.js'
import { useAlertStore } from '../store/alertStore.js'
import { useWatchlistStore } from '../store/watchlistStore.js'
import { makeBackup } from '../utils/backup.js'
const backup = makeBackup({ transactions: [{ id: 'one', coingeckoId: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', type: 'buy', amount: 1, price: 100, fee: 0, date: '2026-01-01T00:00:00Z' }], alerts: [], watchlist: [] })
beforeEach(() => { localStorage.clear(); usePortfolioStore.setState({ transactions: [], holdings: [] }); useAlertStore.setState({ alerts: [] }); useWatchlistStore.setState({ coins: [] }) })
const upload = raw => fireEvent.change(screen.getByLabelText('Choose backup file'), { target: { files: [{ name: 'backup.json', size: raw.length, text: async () => raw }] } })
it('previews without mutation, restores only on confirmation, and detects repeated imports', async () => {
 render(<Backup />)
 upload(JSON.stringify(backup))
 await screen.findByText('Restore preview')
 expect(usePortfolioStore.getState().transactions).toEqual([])
 fireEvent.click(screen.getByRole('button', { name: 'Restore new records' }))
 await screen.findByText(/Restore complete/)
 expect(usePortfolioStore.getState().holdings[0].amount).toBe(1)
 expect(JSON.parse(localStorage.getItem('crypto-portfolio-v1')).state.transactions).toHaveLength(1)
 upload(JSON.stringify(backup))
 await screen.findByText('Restore preview')
 expect(screen.getByRole('button', { name: 'Restore new records' })).toBeDisabled()
})
it('rejects malformed files and lets the user cancel a valid preview', async () => {
 render(<Backup />); upload('broken')
 await screen.findByRole('alert')
 expect(usePortfolioStore.getState().transactions).toHaveLength(0)
 upload(JSON.stringify(backup)); await screen.findByText('Restore preview')
 fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
 await waitFor(() => expect(screen.queryByText('Restore preview')).not.toBeInTheDocument())
 expect(usePortfolioStore.getState().transactions).toHaveLength(0)
})
