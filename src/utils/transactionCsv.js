const fields = ['id', 'coingeckoId', 'symbol', 'name', 'type', 'amount', 'price', 'fee', 'date']
export function exportTransactions(transactions) {
  const cell = (value) => `"${( /^[=+@\-\t\r]/.test(String(value ?? '')) ? "'" + String(value) : String(value ?? '') ).replaceAll('"', '""')}"`
  return [fields.join(','), ...transactions.map((tx) => fields.map((key) => cell(tx[key])).join(','))].join('\r\n')
}
export function parseTransactions(csv) {
  const rows = []
  let row = [], value = '', quoted = false
  const text = csv.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted }
    else if (char === ',' && !quoted) { row.push(value); value = '' }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i++; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = '' }
    else value += char
  }
  if (quoted) throw new Error('CSV has an unclosed quoted value.')
  row.push(value); if (row.some(Boolean)) rows.push(row)
  if (rows.length < 2 || rows[0].join(',') !== fields.join(',')) throw new Error(`Use the exported CSV format: ${fields.join(',')}`)
  if (rows.length > 10001) throw new Error('Import up to 10,000 transactions at a time.')
  return rows.slice(1).map((cells, index) => {
    if (cells.length !== fields.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`)
    const tx = Object.fromEntries(fields.map((key, i) => [key, /^'[=+@\-\t\r]/.test(cells[i]) ? cells[i].slice(1) : cells[i]]))
    for (const field of ['amount', 'price', 'fee']) { if (!tx[field].trim()) throw new Error(`CSV row ${index + 2} is missing ${field}.`); tx[field] = Number(tx[field]) }
    if (!/^(?:paprika:)?[a-z0-9][a-z0-9-]*$/i.test(tx.coingeckoId) || !/^[a-z0-9][a-z0-9._ -]*$/i.test(tx.symbol)) throw new Error(`CSV row ${index + 2} has an invalid coin ID or symbol.`)
    return tx
  })
}
