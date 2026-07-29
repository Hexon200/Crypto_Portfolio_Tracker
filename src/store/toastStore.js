import { create } from 'zustand'

export const useToastStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      createdAt: Date.now(),
      ...notification,
    }],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((notification) => notification.id !== id),
  })),
}))
