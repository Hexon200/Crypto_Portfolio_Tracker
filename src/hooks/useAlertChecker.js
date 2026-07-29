import { useEffect } from 'react'
import { useAlertStore } from '../store/alertStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { useToastStore } from '../store/toastStore.js'

function conditionIsMet(alert, price) {
  return alert.condition === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice
}

export function useAlertChecker() {
  useEffect(() => usePriceStore.subscribe((state, previousState) => {
    if (state.prices === previousState.prices) return

    for (const [symbol, ticker] of Object.entries(state.prices)) {
      if (ticker === previousState.prices[symbol]) continue
      const matchingAlerts = useAlertStore.getState().alerts.filter((alert) => (
        alert.enabled && alert.triggeredAt === null && alert.symbol === symbol && conditionIsMet(alert, ticker.price)
      ))

      for (const alert of matchingAlerts) {
        const direction = alert.condition === 'above' ? 'rose above' : 'fell below'
        const message = `${alert.symbol} ${direction} $${Number(alert.targetPrice).toLocaleString()}`
        useAlertStore.getState().markTriggered(alert.id)
        useToastStore.getState().addNotification({ title: 'Price alert triggered', message, tone: 'alert' })

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('Coinpulse price alert', { body: message, tag: `coinpulse-${alert.id}` })
          } catch {
            // The in-app notification above remains available when OS delivery fails.
          }
        }
      }
    }
  }), [])
}
