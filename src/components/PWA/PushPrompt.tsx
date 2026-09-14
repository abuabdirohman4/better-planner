'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { usePushSubscription } from '@/hooks/usePushSubscription'

const DISMISSED_KEY = 'push-prompt-dismissed'
const SHOW_DELAY_MS = 5000

/**
 * Offers to turn on notifications once, for devices that have not subscribed.
 * Browsers only grant notification permission from a real user gesture, so the
 * click cannot be skipped — this just saves the user a trip to Settings.
 * Dismissal is remembered permanently; Settings remains the way back in.
 */
export default function PushPrompt() {
  const { state, busy, subscribe } = usePushSubscription()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (state !== 'unsubscribed') return
    // Only ask when no choice has been made yet; a denied permission is final
    // until the user changes it in browser settings.
    if (typeof Notification !== 'undefined' && Notification.permission !== 'default') return

    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === 'true'
    } catch {
      // private mode or blocked storage — treat as not dismissed
    }
    if (dismissed) return

    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state])

  const handleEnable = async () => {
    try {
      const ok = await subscribe()
      setVisible(false)
      if (ok) toast.success('Notifikasi aktif di perangkat ini')
      else toast.info('Notifikasi belum aktif — bisa dinyalakan lagi di Settings')
    } catch (error) {
      setVisible(false)
      toast.error(error instanceof Error ? error.message : 'Gagal mengaktifkan notifikasi')
    }
  }

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // nothing to do — it will simply ask again next session
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-99 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl md:bottom-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Nyalakan notifikasi?</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Timer, habit, dan daily sync tetap mengingatkan walau app tertutup.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleEnable}
          disabled={busy}
          className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-wait disabled:opacity-70"
        >
          {busy ? 'Mengaktifkan...' : 'Nyalakan'}
        </button>
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          Nanti
        </button>
      </div>
    </div>
  )
}
