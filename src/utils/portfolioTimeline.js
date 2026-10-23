const DAY = 86400_000
function priceAt(history, timestamp) {
  const points = history?.points || []
  let left = 0, right = points.length - 1, found = -1
  while (left <= right) { const middle = (left + right) >> 1; if (points[middle].timestamp <= timestamp) { found = middle; left = middle + 1 } else right = middle - 1 }
  const point = points[found]
  return point && timestamp - point.timestamp <= (history.maxGap || 2 * DAY) ? point.price : null
}
export function buildPortfolioTimeline(transactions, histories, start, end) {
  const ordered = transactions.filter((tx) => Date.parse(tx.date) <= end).sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  if (!ordered.length) return []
  const times = new Set([start, end])
  const step = Math.max(1, Math.ceil((end - start) / DAY / 365)) * DAY
  for (let timestamp = Math.ceil(start / DAY) * DAY - 1; timestamp < end; timestamp += step) if (timestamp >= start) times.add(timestamp)
  ordered.forEach((tx) => { const time = Date.parse(tx.date); if (time >= start) { if (time > start) times.add(time - 1); times.add(time) } })
  let index = 0, invested = 0, realized = 0
  const balances = new Map()
  return [...times].sort((a, b) => a - b).map((timestamp) => {
    const events = []
    while (index < ordered.length && Date.parse(ordered[index].date) <= timestamp) {
      const tx = ordered[index++], balance = balances.get(tx.coingeckoId) || { amount: 0, cost: 0 }
      const gross = tx.amount * tx.price
      if (tx.type === 'sell') {
        const cost = balance.amount > 0 ? balance.cost * Math.min(tx.amount, balance.amount) / balance.amount : 0
        realized += gross - tx.fee - cost; invested -= gross - tx.fee
        balance.amount = Math.max(0, balance.amount - tx.amount); balance.cost = Math.max(0, balance.cost - cost)
        if (balance.amount <= Number.EPSILON * tx.amount * 8) { balance.amount = 0; balance.cost = 0 }
      } else { invested += gross + tx.fee; balance.amount += tx.amount; balance.cost += gross + tx.fee }
      balances.set(tx.coingeckoId, balance)
      if (Date.parse(tx.date) === timestamp) events.push(tx)
    }
    let value = 0, cost = 0
    const missing = []
    for (const [id, balance] of balances) {
      if (!balance.amount) continue
      cost += balance.cost
      const price = priceAt(histories[id], timestamp)
      if (price === null) missing.push(id); else value += balance.amount * price
    }
    return { timestamp, invested, realized, value: missing.length ? null : value, profit: missing.length ? null : value - invested, unrealized: missing.length ? null : value - cost, events, missing }
  })
}
