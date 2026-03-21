import type { UserProfile } from '@/types/user-profile';
import type { SoundSettings } from '@/types/sound';

export const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  soundId: 'children',
  volume: 0.5,
  taskCompletionSoundId: 'none',
  focusSoundId: 'none',
};

export function mergeSoundSettings(
  current: SoundSettings,
  updates: Partial<SoundSettings>
): SoundSettings {
  return { ...current, ...updates };
}
