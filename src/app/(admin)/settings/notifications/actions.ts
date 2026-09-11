'use server'

import { createClient } from '@/lib/supabase/server'
import type { NotificationSettings } from '@/lib/notifications/types'

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
