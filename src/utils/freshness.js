export function freshness({ updatedAt, fetchedAt, live = false, connected = true, error = false, now = Date.now(), maxAge = 900_000 }) {
  const parse = (value) => typeof value === 'number' ? value : value ? Date.parse(value) : NaN
  const sourceTime = parse(updatedAt), receivedTime = parse(fetchedAt)
  const timestamp = Number.isFinite(sourceTime) ? sourceTime : receivedTime
  if (!Number.isFinite(timestamp)) return { label: 'Awaiting data', tone: 'text-fog', timestamp: null }
  const age = Math.max(0, now - timestamp)
  const elapsed = age < 60_000 ? 'just now' : age < 3600_000 ? `${Math.floor(age / 60_000)}m ago` : age < 86400_000 ? `${Math.floor(age / 3600_000)}h ago` : `${Math.floor(age / 86400_000)}d ago`
  const stale = age > (live ? 60_000 : maxAge)
  const status = error ? 'Cached · refresh failed' : live && connected && !stale ? 'Live' : stale || (live && !connected) ? 'Stale / cached' : 'Cached snapshot'
  return { label: `${status} · ${Number.isFinite(sourceTime) ? 'updated' : 'fetched'} ${elapsed}`, tone: stale || error || (live && !connected) ? 'text-amber-300' : live ? 'text-mint' : 'text-fog', timestamp }
}
