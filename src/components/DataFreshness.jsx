import { useEffect, useState } from 'react'
import { freshness } from '../utils/freshness.js'

export default function DataFreshness({ source, fetching = false, ...props }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 15_000); return () => clearInterval(timer) }, [])
  const state = freshness({ ...props, now })
  return <span className={`block text-[10px] leading-4 ${state.tone}`} title={state.timestamp ? `${source || 'Data'} · ${new Date(state.timestamp).toLocaleString()}` : 'No update received yet'}>{source ? `${source} · ` : ''}{state.label}{fetching ? ' · refreshing…' : ''}</span>
}
