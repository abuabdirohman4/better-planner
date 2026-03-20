export interface SoundSettings {
  soundId: string;
  volume: number;
  taskCompletionSoundId: string;
  focusSoundId: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  sound_settings: SoundSettings;
  created_at: string;
  updated_at: string;
}
