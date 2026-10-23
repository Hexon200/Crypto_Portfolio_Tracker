import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateLedger, openingTransactions } from '../utils/ledger.js'

export const getTransactions = (state) => state.transactions ?? openingTransactions(state.holdings)
const applyLedger = (transactions) => ({ transactions, holdings: calculateLedger(transactions).holdings })

export const usePortfolioStore = create(persist(
  (set) => ({
    holdings: [], transactions: null,
    addTransaction: (tx) => set((state) => applyLedger([...getTransactions(state), tx])),
    updateTransaction: (id, tx) => set((state) => applyLedger(getTransactions(state).map((item) => item.id === id ? { ...tx, id } : item))),
    removeTransaction: (id) => set((state) => applyLedger(getTransactions(state).filter((item) => item.id !== id))),
    importTransactions: (incoming) => set((state) => {
      const current = getTransactions(state)
      const known = new Map(current.map((tx) => [tx.id, tx]))
      const additions = []
      for (const tx of incoming) {
        const existing = known.get(tx.id)
        if (existing) {
          const fields = ['coingeckoId', 'symbol', 'type', 'amount', 'price', 'fee', 'date']
          if (fields.some((key) => existing[key] !== tx[key])) throw new Error(`Transaction ${tx.id} already exists with different values.`)
        } else { additions.push(tx); known.set(tx.id, tx) }
      }
      return applyLedger([...current, ...additions])
    }),
    addHolding: (h) => set((state) => applyLedger([...getTransactions(state), { ...openingTransactions([h])[0], type: 'buy' }])),
    updateHolding: (id, changes) => set((state) => applyLedger(getTransactions(state).map((tx) => tx.id === id ? { ...tx, amount: changes.amount ?? tx.amount, price: changes.avgBuyPrice ?? tx.price } : tx))),
    removeHolding: (id) => set((state) => applyLedger(getTransactions(state).filter((tx) => tx.id !== id))),
  }),
  { name: 'crypto-portfolio-v1' },
))
