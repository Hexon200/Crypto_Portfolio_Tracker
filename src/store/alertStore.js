import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAlertStore = create(persist(
  (set) => ({
    alerts: [],
    addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),
    removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((alert) => alert.id !== id) })),
    toggleAlert: (id) => set((state) => ({
      alerts: state.alerts.map((alert) => alert.id === id
        ? { ...alert, enabled: !alert.enabled, triggeredAt: alert.enabled ? alert.triggeredAt : null }
        : alert),
    })),
    markTriggered: (id) => set((state) => ({
      alerts: state.alerts.map((alert) => alert.id === id && alert.enabled && alert.triggeredAt === null
        ? { ...alert, enabled: false, triggeredAt: Date.now() }
        : alert),
    })),
  }),
  { name: 'crypto-alerts-v1' },
))
