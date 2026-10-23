export function openingTransactions(holdings) {
  return holdings.filter((h) => h.amount > 0).map((h) => ({ id: h.id, coingeckoId: h.coingeckoId, symbol: h.symbol, name: h.name || h.symbol, type: 'opening', amount: h.amount, price: h.avgBuyPrice, fee: 0, date: new Date(Number.isFinite(h.addedAt) ? h.addedAt : Date.now()).toISOString() }))
}

export function calculateLedger(transactions) {
  const positions = new Map(), ids = new Set(), rows = []
  let realized = 0, fees = 0
  const ordered = [...transactions].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  for (const tx of ordered) {
    if (!tx.id || ids.has(tx.id)) throw new Error('Transaction IDs must be unique.')
    ids.add(tx.id)
    if (!tx.coingeckoId || !tx.symbol || !['buy', 'sell', 'opening'].includes(tx.type)) throw new Error('Choose a coin and a valid transaction type.')
    if (!Number.isFinite(Date.parse(tx.date))) throw new Error('Enter a valid transaction date.')
    if (!Number.isFinite(tx.amount) || tx.amount <= 0 || !Number.isFinite(tx.price) || tx.price < 0 || !Number.isFinite(tx.fee) || tx.fee < 0) throw new Error('Quantity must be positive. Price and fee must be zero or greater.')
    if (!Number.isFinite(tx.amount * tx.price + tx.fee)) throw new Error('Transaction value is too large.')
    const p = positions.get(tx.coingeckoId) || { id: `position:${tx.coingeckoId}`, coingeckoId: tx.coingeckoId, symbol: tx.symbol, name: tx.name || tx.symbol, amount: 0, cost: 0, addedAt: Date.parse(tx.date) }
    let saleProfit = null
    if (tx.type === 'sell') {
      const tolerance = Number.EPSILON * Math.max(p.amount, tx.amount) * 8
      if (tx.amount - p.amount > tolerance || p.amount === 0) throw new Error(`Cannot sell ${tx.amount} ${tx.symbol} on ${tx.date.slice(0, 10)}: only ${p.amount} available at that time.`)
      const quantity = Math.min(tx.amount, p.amount)
      const removedCost = p.cost * quantity / p.amount
      saleProfit = tx.amount * tx.price - tx.fee - removedCost
      realized += saleProfit
      p.amount -= quantity; p.cost -= removedCost
      if (p.amount <= tolerance) { p.amount = 0; p.cost = 0 }
    } else { p.amount += tx.amount; p.cost += tx.amount * tx.price + tx.fee }
    fees += tx.fee
    positions.set(tx.coingeckoId, p)
    rows.push({ ...tx, realized: saleProfit })
  }
  const holdings = [...positions.values()].filter((p) => p.amount > 0).map(({ cost, ...p }) => ({ ...p, avgBuyPrice: cost / p.amount }))
  return { holdings, rows, realized, fees, cost: [...positions.values()].reduce((sum, p) => sum + p.cost, 0) }
}
