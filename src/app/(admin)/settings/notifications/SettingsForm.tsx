'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useNotificationSettings } from './useNotificationSettings'
import type { NotificationSettings, AICharacter, EmailLanguage, PushSettings } from '@/lib/notifications/types'
import { DEFAULT_PUSH_SETTINGS } from '@/lib/notifications/services/pushDue'
import { usePushSubscription } from '@/hooks/usePushSubscription'

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  email: '',
  frequencies: {
    daily: false,
    weekly: true,
    monthly: true,
    quarterly: true
  },
  aiCharacter: 'BALANCED_MENTOR',
  preferredTime: '06:00:00',
  timezone: 'Asia/Jakarta',
  language: 'id',
  push: DEFAULT_PUSH_SETTINGS
}

const PUSH_KINDS: Array<{ key: keyof Omit<PushSettings, 'enabled' | 'morningTime' | 'eveningTime'>; label: string }> = [
  { key: 'timer', label: 'Timer selesai' },
  { key: 'habits', label: 'Reminder habit' },
  { key: 'schedules', label: 'Blok waktu (activity plan)' },
  { key: 'dailySync', label: 'Daily sync pagi & malam' },
  { key: 'recap', label: 'Rekap harian' },
]

export function SettingsForm() {
  const { settings, isLoading, updateSettings } = useNotificationSettings()
  const [localSettings, setLocalSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)
  const device = usePushSubscription()
  const push: PushSettings = { ...DEFAULT_PUSH_SETTINGS, ...localSettings.push }
  const setPush = (patch: Partial<PushSettings>) => setLocalSettings({ ...localSettings, push: { ...push, ...patch } })

  const handleDeviceToggle = async () => {
    try {
      if (device.state === 'subscribed') {
        await device.unsubscribe()
        toast.success('Push dimatikan di perangkat ini')
      } else {
        await device.subscribe()
        toast.success('Push aktif di perangkat ini')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mengubah push')
    }
  }

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  // Hanya tampilkan skeleton saat initial load (belum ada data sama sekali)
  if (isLoading && !settings) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </div>
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings(localSettings)
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your email AI summaries and preferred frequencies</p>
      </div>
      
      <div className="px-6 py-6 space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-gray-900 dark:text-white">Enable Notifications</label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Receive AI-generated summaries of your progress</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={localSettings.enabled}
              onChange={(e) => setLocalSettings({...localSettings, enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
          </label>
        </div>

        {localSettings.enabled && (
          <>
            {/* Email Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Email</label>
              <input 
                type="email" 
                placeholder="Leave blank to use account email"
                className="w-full px-4 py-2 border border-gray-200 focus:border-brand-500 focus:ring focus:ring-brand-500/20 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={localSettings.email || ''}
                onChange={(e) => setLocalSettings({...localSettings, email: e.target.value})}
              />
            </div>

            {/* Frequencies */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-base font-medium text-gray-900 dark:text-white">Frequencies</label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                    checked={localSettings.frequencies.daily}
                    onChange={(e) => setLocalSettings({
                      ...localSettings, 
                      frequencies: {...localSettings.frequencies, daily: e.target.checked}
                    })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Daily Recap</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                    checked={localSettings.frequencies.weekly}
                    onChange={(e) => setLocalSettings({
                      ...localSettings, 
                      frequencies: {...localSettings.frequencies, weekly: e.target.checked}
                    })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Weekly Summary</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                    checked={localSettings.frequencies.monthly}
                    onChange={(e) => setLocalSettings({
                      ...localSettings, 
                      frequencies: {...localSettings.frequencies, monthly: e.target.checked}
                    })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Monthly Review</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                    checked={localSettings.frequencies.quarterly}
                    onChange={(e) => setLocalSettings({
                      ...localSettings, 
                      frequencies: {...localSettings.frequencies, quarterly: e.target.checked}
                    })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quarterly Insight</span>
                </label>
              </div>
            </div>

            {/* AI Personality */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI Personality</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 focus:border-brand-500 focus:ring focus:ring-brand-500/20 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={localSettings.aiCharacter}
                onChange={(e) => setLocalSettings({...localSettings, aiCharacter: e.target.value as AICharacter})}
              >
                <option value="MOTIVATIONAL_COACH">Motivational Coach (Encouraging & Practical)</option>
                <option value="ANALYTICAL_ADVISOR">Analytical Advisor (Data-driven & Objective)</option>
                <option value="BALANCED_MENTOR">Balanced Mentor (Mindful & Process-oriented)</option>
                <option value="FRIENDLY_BUDDY">Friendly Buddy (Casual & Supportive)</option>
              </select>
            </div>

            {/* Email Language */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bahasa Email</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 focus:border-brand-500 focus:ring focus:ring-brand-500/20 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={localSettings.language ?? 'id'}
                onChange={(e) => setLocalSettings({...localSettings, language: e.target.value as EmailLanguage})}
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Push Notifications */}
      <div className="px-6 py-6 space-y-6 border-t border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Notifikasi ke Mac &amp; Android walau app tertutup (butuh PWA terinstal)</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-base font-medium text-gray-900 dark:text-white">Enable Push</label>
            <p className="text-sm text-gray-500 dark:text-gray-400">Server kirim notif ke semua perangkat yang terdaftar</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={push.enabled}
              onChange={(e) => setPush({ enabled: e.target.checked })}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
          </label>
        </div>

        {push.enabled && (
          <>
            {/* This device */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Perangkat ini</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {device.state === 'loading' && 'Memeriksa...'}
                  {device.state === 'unsupported' && 'Browser tidak mendukung push (Brave: aktifkan Google push di brave://settings/privacy)'}
                  {device.state === 'denied' && 'Izin notifikasi ditolak — ubah di pengaturan browser'}
                  {device.state === 'subscribed' && 'Terdaftar — notif akan masuk ke perangkat ini'}
                  {device.state === 'unsubscribed' && 'Belum terdaftar'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDeviceToggle}
                disabled={device.busy || device.state === 'loading' || device.state === 'unsupported' || device.state === 'denied'}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-brand-500 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {device.state === 'subscribed' ? 'Matikan' : 'Aktifkan'}
              </button>
            </div>

            {/* Kinds */}
            <div className="grid gap-4 md:grid-cols-2">
              {PUSH_KINDS.map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-600"
                    checked={push[key]}
                    onChange={(e) => setPush({ [key]: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>

            {/* Daily sync times */}
            {push.dailySync && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam pagi</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 focus:border-brand-500 focus:ring focus:ring-brand-500/20 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={push.morningTime}
                    onChange={(e) => setPush({ morningTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jam malam</label>
                  <input
                    type="time"
                    className="w-full px-4 py-2 border border-gray-200 focus:border-brand-500 focus:ring focus:ring-brand-500/20 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={push.eveningTime}
                    onChange={(e) => setPush({ eveningTime: e.target.value })}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-70 disabled:cursor-wait transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
