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
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching notification settings:', error.message)
    throw new Error('Failed to fetch settings')
  }

  return data.notification_settings as NotificationSettings | null
}

export async function updateNotificationSettings(settings: NotificationSettings) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase
    .from('user_profiles')
    .update({ notification_settings: settings })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating notification settings:', error.message)
    throw new Error('Failed to update settings')
  }

  return { success: true }
}
