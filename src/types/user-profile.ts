import type { SoundSettings } from '@/types/sound'

export interface UserProfile {
  id: string
  user_id: string
  sound_settings: SoundSettings
  created_at: string
  updated_at: string
}
