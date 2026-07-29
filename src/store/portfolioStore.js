import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const usePortfolioStore = create(persist(
  (set) => ({
    holdings: [],
    addHolding: (holding) => set((state) => ({ holdings: [...state.holdings, holding] })),
    removeHolding: (id) => set((state) => ({ holdings: state.holdings.filter((holding) => holding.id !== id) })),
    updateHolding: (id, changes) => set((state) => ({
      holdings: state.holdings.map((holding) => holding.id === id ? { ...holding, ...changes } : holding),
    })),
  }),
  { name: 'crypto-portfolio-v1' },
))
