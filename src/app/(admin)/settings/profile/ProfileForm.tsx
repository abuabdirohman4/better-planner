'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Button from '@/components/ui/button/Button'
import Input from '@/components/form/input/InputField'
import Label from '@/components/form/Label'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useSoundStore } from '@/stores/soundStore'
import { TIMER_SOUND_OPTIONS, FOCUS_SOUND_OPTIONS, COMPLETION_SOUND_OPTIONS } from '@/lib/soundUtils'
import SoundSelector from '@/app/(admin)/execution/daily-sync/PomodoroTimer/components/SoundSelector'
import { updateDisplayName } from './actions/user-profile/actions'

const soundName = (options: { id: string; name: string }[], id: string) =>
  options.find((o) => o.id === id)?.name ?? id

export function ProfileForm() {
  const router = useRouter()
  const { user, isLoading } = useCurrentUser()
  const currentName: string = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const sound = useSoundStore()
  const [showSoundSelector, setShowSoundSelector] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => { setName(currentName) }, [currentName])
  useEffect(() => { sound.loadSettings() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
      <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
    </div>
  }

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== currentName

  const handleSave = async () => {
    setIsSaving(true)
    const { error } = await updateDisplayName(trimmed)
    setIsSaving(false)
    if (error) return toast.error(error)
    toast.success('Nama tampilan disimpan')
    router.refresh()
  }

  const handleReset = async () => {
    setIsResetting(true)
    await sound.resetSettings()
    setIsResetting(false)
    toast.success('Suara timer dikembalikan ke default')
  }

  return (
    <div className="max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profil</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nama yang tampil di header dan email rekap</p>
      </div>

      <div className="px-6 py-6 space-y-5">
        {avatarUrl && (
          <Image width={64} height={64} src={avatarUrl} alt={currentName} className="rounded-full object-cover" />
        )}
        <div>
          <Label htmlFor="display-name">Nama tampilan</Label>
          <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={user?.email ?? ''} disabled />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
        <Button onClick={handleSave} disabled={!canSave} loading={isSaving} loadingText="Menyimpan...">
          Simpan
        </Button>
      </div>

      <div className="px-6 py-6 space-y-4 border-t border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Suara timer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dipakai Pomodoro timer dan penyelesaian tugas</p>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-gray-500 dark:text-gray-400">Fokus selesai</dt>
          <dd className="text-gray-900 dark:text-white">{soundName(TIMER_SOUND_OPTIONS, sound.settings.soundId)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Saat fokus berjalan</dt>
          <dd className="text-gray-900 dark:text-white">{soundName(FOCUS_SOUND_OPTIONS, sound.settings.focusSoundId)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Tugas selesai</dt>
          <dd className="text-gray-900 dark:text-white">{soundName(COMPLETION_SOUND_OPTIONS, sound.settings.taskCompletionSoundId)}</dd>
          <dt className="text-gray-500 dark:text-gray-400">Volume</dt>
          <dd className="text-gray-900 dark:text-white">{Math.round(sound.settings.volume * 100)}%</dd>
        </dl>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowSoundSelector(true)}>Ubah suara</Button>
          <Button variant="outline" onClick={handleReset} loading={isResetting} loadingText="Mereset...">Reset ke default</Button>
        </div>
      </div>

      <SoundSelector isOpen={showSoundSelector} onClose={() => setShowSoundSelector(false)} />
    </div>
  )
}
