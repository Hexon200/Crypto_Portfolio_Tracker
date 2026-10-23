import { create } from 'zustand'

export const useCoinDetailStore = create((set) => ({
  coin: null,
  open: (coin) => set({ coin }),
  close: () => set({ coin: null }),
}))
