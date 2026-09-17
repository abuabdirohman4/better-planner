'use server'

import { createClient } from '@/lib/supabase/server'
import type { NotificationSettings } from '@/lib/notifications/types'
import { sendPushToUser } from '@/lib/notifications/services/pushService'
import { sendEmail } from '@/lib/notifications/services/emailService'

export async function getNotificationSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('notification_settings')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching notification settings:', error.message)
    throw new Error('Failed to fetch settings')
  }

  return (data?.notification_settings ?? null) as NotificationSettings | null
}

export async function updateNotificationSettings(settings: NotificationSettings) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  // Profile row may not exist yet → upsert on user_id (UNIQUE)
  const { error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: user.id, notification_settings: settings }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating notification settings:', error.message)
    throw new Error('Failed to update settings')
  }

  return { success: true }
}

// ─── Web Push device subscriptions ───

export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth, user_agent: sub.userAgent ?? null },
      { onConflict: 'endpoint' }
    )
  if (error) {
    console.error('Error saving push subscription:', error.message)
    throw new Error('Failed to save push subscription')
  }
  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) {
    console.error('Error removing push subscription:', error.message)
    throw new Error('Failed to remove push subscription')
  }
  return { success: true }
}

// ─── Test notification ───

/**
 * Send one notification to the logged-in user right now, so they can confirm
 * delivery without waiting for the 06:00 WIB cron. Never throws — the caller
 * shows `message` verbatim in a toast.
 */
export async function sendTestNotification(channel: 'push' | 'email'): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sesi kamu sudah berakhir. Muat ulang halaman lalu masuk lagi.' }

  try {
    if (channel === 'push') {
      const { sent } = await sendPushToUser(user.id, {
        kind: 'test',
        tag: 'test',
        title: 'Tes notifikasi',
        body: 'Kalau kamu melihat ini, notifikasi Better Planner berfungsi.',
        url: '/dashboard',
      })
      // Not a technical failure, but nothing reached the user either.
      if (sent === 0) {
        return { ok: false, message: 'Belum ada perangkat terdaftar. Aktifkan "Perangkat ini" di atas dulu, lalu coba lagi.' }
      }
      return {
        ok: true,
        message: `Tes push dikirim ke ${sent} perangkat. Kalau halaman ini sedang terbuka, notifnya muncul sebagai toast — pindah tab atau tutup app untuk melihat notif sistem.`,
      }
    }

    const to = user.email
    if (!to) return { ok: false, message: 'Akun kamu tidak punya alamat email, jadi tes email tidak bisa dikirim.' }

    const result = await sendEmail(
      to,
      '[Better Planner] Tes notifikasi',
      `<p>Halo!</p><p>Kalau kamu membaca email ini, notifikasi email Better Planner berfungsi.</p><p style="color:#6b7280;font-size:12px">Email ini dikirim manual dari halaman Settings, bukan dari jadwal harian.</p>`,
    )
    if (!result.success) {
      return { ok: false, message: `Email gagal dikirim: ${result.error ?? 'penyebab tidak diketahui'}` }
    }
    return { ok: true, message: `Tes email dikirim ke ${to}. Cek inbox (dan folder spam).` }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    console.error('[sendTestNotification]', channel, raw)
    return { ok: false, message: explainFailure(channel, raw) }
  }
}

/** Turn a thrown config/transport error into something the user can act on. */
function explainFailure(channel: 'push' | 'email', raw: string): string {
  if (/VAPID/i.test(raw)) return 'Kunci push (VAPID) belum diatur di server, jadi push belum bisa dipakai.'
  if (/RESEND_API_KEY|API key|EMAIL_FROM/i.test(raw)) return 'Pengiriman email belum diatur di server (API key atau alamat pengirim kosong).'
  return channel === 'push' ? 'Gagal mengirim tes push. Coba lagi sebentar lagi.' : 'Gagal mengirim tes email. Coba lagi sebentar lagi.'
}
