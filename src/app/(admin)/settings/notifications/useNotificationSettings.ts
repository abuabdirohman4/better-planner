'use client'

import useSWR from 'swr'
import { getNotificationSettings, updateNotificationSettings } from './actions'
import type { NotificationSettings } from '@/lib/notifications/types'
import { dataKeys } from '@/lib/swr'

export function useNotificationSettings() {
  const { data: settings, error, isLoading, mutate } = useSWR<NotificationSettings | null>(
    dataKeys.notifications.settings(),
    getNotificationSettings
  )

  const updateSettings = async (newSettings: NotificationSettings) => {
    // Optimistic update
    mutate(newSettings, false)
    try {
      await updateNotificationSettings(newSettings)
      mutate(newSettings)
      return { success: true }
    } catch (err) {
      // Revert on error
      mutate(settings)
      throw err
    }
  }

  return {
    settings,
    isLoading,
    error,
    updateSettings
  }
}
