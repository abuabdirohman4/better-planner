'use client'

import { useCallback, useEffect, useState } from 'react'
import { savePushSubscription, removePushSubscription } from '@/app/(admin)/settings/notifications/actions'

export type PushState = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

/** Turn an opaque pushManager.subscribe() rejection into something actionable. */
function describeSubscribeError(err: unknown): string {
  const name = (err as Error)?.name
  const msg = (err as Error)?.message ?? ''
  if (name === 'NotAllowedError') return 'Izin notifikasi ditolak browser'
  if (name === 'InvalidStateError') return 'Sudah ada langganan lama yang bentrok — tutup app, buka lagi, coba ulang'
  if (name === 'NotSupportedError' || /not supported/i.test(msg)) {
    return 'Browser memblokir push. Chrome/Brave: aktifkan layanan push Google, lalu restart browser'
  }
  if (name === 'AbortError' || /registration failed|push service/i.test(msg)) {
    return 'Layanan push tidak bisa dihubungi. Cek koneksi, dan pastikan Google Play Services aktif'
  }
  return msg || 'Gagal mendaftar push'
}

const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** Subscribe/unsubscribe THIS device to web push. Server keeps one row per device endpoint. */
export function usePushSubscription() {
  const [state, setState] = useState<PushState>('loading')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    if (!supported()) return setState('unsupported')
    if (Notification.permission === 'denied') return setState('denied')
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setState(sub ? 'subscribed' : 'unsubscribed')
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const subscribe = useCallback(async () => {
    if (!supported()) return
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setState(permission === 'denied' ? 'denied' : 'unsubscribed'); return }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) throw new Error('Kunci VAPID belum diset di server')
      const reg = await navigator.serviceWorker.ready

      // A subscription made with a different VAPID key blocks a new subscribe();
      // the browser allows only one per service worker. Drop the stale one first.
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      let sub: PushSubscription
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) })
      } catch (err) {
        throw new Error(describeSubscribeError(err))
      }
      const json = sub.toJSON()
      await savePushSubscription({ endpoint: json.endpoint!, p256dh: json.keys!.p256dh, auth: json.keys!.auth, userAgent: navigator.userAgent })
      setState('subscribed')
    } finally {
      setBusy(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!supported()) return
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setState('unsubscribed')
    } finally {
      setBusy(false)
    }
  }, [])

  return { state, busy, subscribe, unsubscribe, refresh }
}
