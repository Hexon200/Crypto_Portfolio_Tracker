import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { getTransactions, usePortfolioStore } from '../store/portfolioStore.js'
import { useAlertStore } from '../store/alertStore.js'
import { useWatchlistStore } from '../store/watchlistStore.js'
import { BACKUP_LIMIT, makeBackup, parseBackup, planRestore, persistRestore } from '../utils/backup.js'

const current = () => ({ transactions: getTransactions(usePortfolioStore.getState()), alerts: useAlertStore.getState().alerts, watchlist: useWatchlistStore.getState().coins })
export default function Backup() {
 const [preview, setPreview] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false)
 const selection = useRef(0)
 function download() {
  setError(''); setMessage('')
  try {
   const backup = makeBackup(current()), blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
   if (blob.size > BACKUP_LIMIT) throw new Error('Your records exceed the 5 MB backup limit. Export your transaction history as CSV instead.')
   const url = URL.createObjectURL(blob)
   const link = document.createElement('a'); link.href = url; link.download = `coinpulse-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
   setMessage('Backup download started. Keep the file somewhere safe.')
  } catch (e) { setError(e.message) }
 }
 async function choose(event) {
  const file = event.target.files?.[0], token = ++selection.current
  setPreview(null); setError(''); setMessage(''); event.target.value = ''
  if (!file) return
  setBusy(true)
  try {
   if (file.size > BACKUP_LIMIT) throw new Error('Backup exceeds the 5 MB limit.')
   const backup = parseBackup(await file.text()), plan = planRestore(current(), backup)
   if (token === selection.current) setPreview({ backup, plan, filename: file.name })
  } catch (e) { if (token === selection.current) setError(e.message) }
  finally { if (token === selection.current) setBusy(false) }
 }
 async function restore() {
  setError(''); setBusy(true)
  try {
   const plan = planRestore(current(), preview.backup)
   persistRestore(localStorage, plan)
   await Promise.all([usePortfolioStore.persist.rehydrate(), useAlertStore.persist.rehydrate(), useWatchlistStore.persist.rehydrate()])
   setPreview(null); setMessage('Restore complete. Your existing records were kept and new records were added.')
  } catch (e) { setError(e.message) }
  finally { setBusy(false) }
 }
 return <div className="mx-auto max-w-3xl space-y-6">
  <header><p className="eyebrow">Keep your records safe</p><h1 className="page-title">Backup & restore</h1><p className="page-subtitle">Save transactions, holdings, watchlist, and alerts in one portable file.</p></header>
  <section className="rounded-2xl border border-line bg-panel p-6"><h2 className="text-lg font-semibold">Download a backup</h2><p className="mt-2 text-sm leading-6 text-fog">Holdings are rebuilt from your transactions. Existing opening balances are included. Market prices and chart caches are fetched again when needed.</p><button type="button" onClick={download} className="button-primary mt-5"><Download className="h-4 w-4" />Download backup</button><p className="mt-3 text-xs text-fog">The file contains your financial records and is not encrypted. No backup is uploaded.</p></section>
  <section className="rounded-2xl border border-line bg-panel p-6"><h2 className="text-lg font-semibold">Restore from a file</h2><p className="mt-2 text-sm leading-6 text-fog">Preview before restoring. New records are added; matching IDs are skipped. Existing watchlist entries and alert settings stay as they are. Conflicting transactions block the restore.</p><label className="mt-5 block text-sm"><span className="mb-2 flex items-center gap-2"><Upload className="h-4 w-4" />Choose backup file</span><input type="file" accept=".json,application/json" disabled={busy} onChange={choose} className="block w-full min-w-0 text-xs text-fog file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-3 file:text-white" /></label><p className="mt-2 text-xs text-fog">Coinpulse JSON backup · maximum 5 MB</p>
   {preview && <div className="mt-6 border-t border-line pt-5"><h3 className="font-semibold">Restore preview</h3><p className="mt-2 break-all text-xs text-fog">{preview.filename} · saved {new Date(preview.backup.exportedAt).toLocaleString()}</p><ul className="my-4 space-y-2 text-sm">{Object.entries(preview.plan.stats).map(([key, value]) => <li key={key} className="capitalize">{key}: {value.added} new · {value.skipped} already saved</li>)}</ul><p className="text-xs text-fog">Imported enabled alerts will resume checking while the app is open.</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" className="button-primary disabled:opacity-40" disabled={busy || Object.values(preview.plan.stats).every(s => s.added === 0)} onClick={restore}>Restore new records</button><button type="button" className="button-secondary" disabled={busy} onClick={() => setPreview(null)}>Cancel</button></div></div>}
  </section>
  {busy && <p role="status" className="text-sm text-fog">Checking and saving records…</p>}
  {error && <p role="alert" className="rounded-xl border border-ember/30 p-4 text-sm text-ember">{error}</p>}
  {message && <p role="status" className="rounded-xl border border-mint/30 p-4 text-sm text-mint">{message}</p>}
 </div>
}
