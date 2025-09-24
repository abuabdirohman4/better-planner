import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { updateSoundSettings, getSoundSettings, resetSoundSettings as resetServerSettings } from '@/app/(admin)/settings/profile/actions/userProfileActions';

export interface SoundSettings {
  soundId: string;
  volume: number;
  enabled: boolean;
}

interface SoundStoreState {
  settings: SoundSettings;
  isLoading: boolean;
  updateSettings: (settings: Partial<SoundSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  soundId: 'chime',
  volume: 0.5,
  enabled: true
};

export const useSoundStore = create<SoundStoreState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SOUND_SETTINGS,
      isLoading: false,
      
      updateSettings: async (newSettings) => {
        set({ isLoading: true });
        
        try {
          // Update local state immediately (optimistic update)
          set((state) => ({
            settings: { ...state.settings, ...newSettings }
          }));
          
          // Sync to server
          await updateSoundSettings(newSettings);
        } catch (error) {
          console.error('Failed to update sound settings:', error);
          // Revert local state on error
          const currentSettings = get().settings;
          set({ settings: { ...currentSettings } });
        } finally {
          set({ isLoading: false });
        }
      },
      
      resetSettings: async () => {
        set({ isLoading: true });
        
        try {
          // Update local state
          set({ settings: DEFAULT_SOUND_SETTINGS });
          
          // Sync to server
          await resetServerSettings();
        } catch (error) {
          console.error('Failed to reset sound settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      loadSettings: async () => {
        set({ isLoading: true });
        
        try {
          const serverSettings = await getSoundSettings();
          set({ settings: serverSettings });
        } catch (error) {
          console.error('Failed to load sound settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'sound-settings',
      partialize: (state) => ({
        settings: state.settings
      }),
    }
  )
);
