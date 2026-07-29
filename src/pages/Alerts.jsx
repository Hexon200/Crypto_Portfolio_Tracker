import { useState } from 'react'
import { BellRing, Plus, Trash2 } from 'lucide-react'
import CoinSearch from '../components/CoinSearch.jsx'
import { useAlertStore } from '../store/alertStore.js'
import { usePriceStore } from '../store/priceStore.js'
import { formatCurrency } from '../utils/format.js'

export default function Alerts() {
  const alerts = useAlertStore((state) => state.alerts)
  const addAlert = useAlertStore((state) => state.addAlert)
  const removeAlert = useAlertStore((state) => state.removeAlert)
  const toggleAlert = useAlertStore((state) => state.toggleAlert)
  const prices = usePriceStore((state) => state.prices)
  const [coin, setCoin] = useState(null)
  const [condition, setCondition] = useState('above')
  const [targetPrice, setTargetPrice] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (!coin || Number(targetPrice) <= 0) return
    if (alerts.length === 0 && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try { await Notification.requestPermission() } catch { /* in-app alerts still work */ }
    }
    addAlert({ id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`, coingeckoId: coin.id, symbol: coin.symbol, condition, targetPrice: Number(targetPrice), enabled: true, triggeredAt: null })
    setCoin(null); setTargetPrice(''); setCondition('above')
  }

  return (
    <div className="space-y-8">
      <header><p className="eyebrow">Watch conditions</p><h1 className="page-title">Price alerts</h1><p className="page-subtitle">One-shot notifications that stay quiet until you re-enable them.</p></header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-2xl border border-line bg-panel"><div className="flex items-center gap-3 border-b border-line px-5 py-4"><BellRing className="h-5 w-5 text-acid" /><div><h2 className="font-semibold text-white">Alert rules</h2><p className="mt-1 text-xs text-fog">Triggered rules disable automatically</p></div></div>
          {alerts.length === 0 ? <div className="empty-state py-20"><div className="empty-icon"><BellRing className="h-5 w-5" /></div><h3>No alerts set</h3><p>Create a threshold and we’ll watch it in the background while this tab is open.</p></div> : <div className="divide-y divide-line">{alerts.map((alert) => <div key={alert.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className={`h-2.5 w-2.5 rounded-full ${alert.enabled ? 'bg-acid shadow-[0_0_10px_#d7ff64]' : 'bg-fog/40'}`} /><div className="min-w-0 flex-1"><p className="font-semibold text-white">{alert.symbol} <span className="font-normal text-fog">{alert.condition}</span> {formatCurrency(alert.targetPrice)}</p><p className="mt-1 text-xs text-fog">Current: {formatCurrency(prices[alert.symbol]?.price)}{alert.triggeredAt ? ` · Triggered ${new Date(alert.triggeredAt).toLocaleString()}` : ''}</p></div><button type="button" role="switch" aria-checked={alert.enabled} onClick={() => toggleAlert(alert.id)} className={`relative h-7 w-12 rounded-full transition-colors ${alert.enabled ? 'bg-acid' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-ink transition-transform ${alert.enabled ? 'left-6' : 'left-1'}`} /></button><button type="button" onClick={() => removeAlert(alert.id)} aria-label={`Remove ${alert.symbol} alert`} className="icon-button text-fog hover:text-ember"><Trash2 className="h-4 w-4" /></button></div>)}</div>}
        </section>
        <form onSubmit={submit} className="h-fit rounded-2xl border border-line bg-panel p-5 lg:sticky lg:top-24"><div className="mb-6"><p className="eyebrow">New trigger</p><h2 className="mt-2 text-xl font-semibold text-white">Create an alert</h2></div><div className="space-y-4"><CoinSearch label="Alert coin" selected={coin} onSelect={setCoin} /><label className="field-label">Condition<select className="field-input mt-2" value={condition} onChange={(event) => setCondition(event.target.value)}><option value="above">Price goes above</option><option value="below">Price goes below</option></select></label><label className="field-label">Target price (USD)<input className="field-input mt-2" type="number" min="0" step="any" required value={targetPrice} onChange={(event) => setTargetPrice(event.target.value)} placeholder="0.00" /></label><button className="button-primary w-full" type="submit"><Plus className="h-4 w-4" /> Create alert</button><p className="text-center text-[11px] leading-4 text-fog">Browser permission is requested only when you create your first alert.</p></div></form>
      </div>
    </div>
  )
}
