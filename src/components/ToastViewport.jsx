import { X } from 'lucide-react'
import { useToastStore } from '../store/toastStore.js'

export default function ToastViewport() {
  const notifications = useToastStore((state) => state.notifications)
  const removeNotification = useToastStore((state) => state.removeNotification)
  return (
    <div aria-live="polite" className="fixed bottom-5 right-5 z-50 flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-xl border border-acid/30 bg-[#171d18] p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-acid shadow-[0_0_12px_#d7ff64]" />
            <div className="flex-1"><p className="text-sm font-semibold text-white">{notification.title}</p><p className="mt-1 text-sm text-fog">{notification.message}</p></div>
            <button type="button" onClick={() => removeNotification(notification.id)} aria-label="Dismiss notification" className="rounded-md p-1 text-fog hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
