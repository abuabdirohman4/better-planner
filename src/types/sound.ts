export interface SoundSettings {
  soundId: string
  volume: number
  taskCompletionSoundId: string
  focusSoundId: string
}

export interface SoundOption {
  id: string
  name: string
  type: 'custom'
  description: string
  emoji: string
  filePath: string
}
