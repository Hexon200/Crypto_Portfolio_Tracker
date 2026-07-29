import { Activity, Bell, LayoutDashboard, PieChart } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { usePriceStore } from '../store/priceStore.js'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portfolio', label: 'Portfolio', icon: PieChart },
  { to: '/alerts', label: 'Alerts', icon: Bell },
]

function ConnectionIndicator() {
  const status = usePriceStore((state) => state.connectionStatus)
  const tone = status === 'connected' ? 'bg-mint' : status === 'connecting' || status === 'reconnecting' ? 'bg-amber-400' : 'bg-ember'
  return <div className="flex items-center gap-2 rounded-full border border-line bg-white/[0.025] px-3 py-2" title={`WebSocket ${status}`}><span className={`h-2 w-2 rounded-full ${tone}`} /><span className="hidden text-xs capitalize text-fog sm:inline">{status}</span></div>
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-ink text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(215,255,100,0.07),transparent_28%),linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
      <header className="sticky top-0 z-40 border-b border-line/90 bg-ink/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-10">
          <NavLink to="/" className="mr-auto flex items-center gap-3" aria-label="Coinpulse dashboard"><span className="grid h-9 w-9 place-items-center rounded-xl border border-acid/30 bg-acid/10 text-acid"><Activity className="h-5 w-5" /></span><div><p className="text-sm font-bold tracking-tight">COINPULSE</p><p className="font-mono text-[9px] uppercase tracking-[0.23em] text-fog">Market monitor</p></div></NavLink>
          <nav aria-label="Primary navigation" className="hidden items-center rounded-xl border border-line bg-panel p-1 md:flex">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm transition-colors ${isActive ? 'bg-white/[0.07] text-white' : 'text-fog hover:text-white'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
          <ConnectionIndicator />
        </div>
      </header>
      <main className="relative mx-auto max-w-[1440px] px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-10">{children}</main>
      <nav aria-label="Mobile navigation" className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 rounded-2xl border border-line bg-panel/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-12 min-w-[5rem] flex-col items-center justify-center gap-1 rounded-xl px-3 text-[10px] ${isActive ? 'bg-acid/10 text-acid' : 'text-fog'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
    </div>
  )
}
