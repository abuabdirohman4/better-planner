import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SoundSettings {
  soundId: string;
  volume: number;
  enabled: boolean;
}

interface SoundStoreState {
  settings: SoundSettings;
  updateSettings: (settings: Partial<SoundSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  soundId: 'chime',
  volume: 0.5,
  enabled: true
};

export const useSoundStore = create<SoundStoreState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SOUND_SETTINGS,
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      resetSettings: () => set({ settings: DEFAULT_SOUND_SETTINGS }),
    }),
    {
      name: 'sound-settings',
      partialize: (state) => ({
        settings: state.settings
      }),
    }
  )
);
