import { create } from 'zustand'

export const usePriceStore = create((set) => ({
  prices: {},
  connectionStatus: 'disconnected',
  updatePrice: (symbol, data) => set((state) => ({
    prices: {
      ...state.prices,
      [symbol]: { ...state.prices[symbol], ...data },
    },
  })),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}))
