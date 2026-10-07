export interface SoundSettings {
  soundId: string
  volume: number
  taskCompletionSoundId: string
  focusSoundId: string
  /** Suara saat istirahat habis; kosong = ikut soundId (selesai fokus). */
  breakEndSoundId?: string
}

export interface SoundOption {
  id: string
  name: string
  type: 'custom'
  description: string
  emoji: string
  filePath: string
}
