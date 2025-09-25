import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPreferencesState {
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  toggleShowCompletedTasks: () => void;
}

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      showCompletedTasks: true, // Default to show completed tasks
      setShowCompletedTasks: (show: boolean) => 
        set({ showCompletedTasks: show }),
      toggleShowCompletedTasks: () => 
        set((state) => ({ showCompletedTasks: !state.showCompletedTasks })),
    }),
    {
      name: 'ui-preferences-storage', // unique name for localStorage key
      // Only persist the showCompletedTasks value
      partialize: (state) => ({ showCompletedTasks: state.showCompletedTasks }),
    }
  )
);
