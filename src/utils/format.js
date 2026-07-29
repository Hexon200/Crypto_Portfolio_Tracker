export function formatCurrency(value, maximumFractionDigits = 2) {
  if (!Number.isFinite(Number(value))) return '—'
  const numeric = Number(value)
  const digits = Math.abs(numeric) < 1 ? 6 : maximumFractionDigits
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits }).format(numeric)
}

export function formatPercent(value) {
  if (!Number.isFinite(Number(value))) return '—'
  return `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`
}
