import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWatchlistStore = create(persist((set) => ({
  coins: [],
  toggle: (coin) => set((state) => ({
    coins: state.coins.some((item) => item.id === coin.id)
      ? state.coins.filter((item) => item.id !== coin.id)
      : [...state.coins, { id: coin.id, name: coin.name, symbol: coin.symbol, image: coin.image }],
  })),
}), { name: 'coinpulse-watchlist-v1' }))
