import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPreferencesState {
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  toggleShowCompletedTasks: () => void;
  
  // Card collapse states
  cardCollapsed: {
    pomodoroTimer: boolean;
    mainQuest: boolean;
    sideQuest: boolean;
    activityLog: boolean;
    brainDump: boolean;
  };
  setCardCollapsed: (cardId: keyof UIPreferencesState['cardCollapsed'], collapsed: boolean) => void;
  toggleCardCollapsed: (cardId: keyof UIPreferencesState['cardCollapsed']) => void;
}

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    (set) => ({
      showCompletedTasks: true, // Default to show completed tasks
      setShowCompletedTasks: (show: boolean) => 
        set({ showCompletedTasks: show }),
      toggleShowCompletedTasks: () => 
        set((state) => ({ showCompletedTasks: !state.showCompletedTasks })),
      
      // Card collapse states - all cards start expanded (false = not collapsed)
      cardCollapsed: {
        pomodoroTimer: false,
        mainQuest: false,
        sideQuest: false,
        activityLog: false,
        brainDump: false,
      },
      setCardCollapsed: (cardId, collapsed) => 
        set((state) => ({
          cardCollapsed: {
            ...state.cardCollapsed,
            [cardId]: collapsed,
          },
        })),
      toggleCardCollapsed: (cardId) => 
        set((state) => ({
          cardCollapsed: {
            ...state.cardCollapsed,
            [cardId]: !state.cardCollapsed[cardId],
          },
        })),
    }),
    {
      name: 'ui-preferences-storage', // unique name for localStorage key
      // Persist both showCompletedTasks and cardCollapsed states
      partialize: (state) => ({ 
        showCompletedTasks: state.showCompletedTasks,
        cardCollapsed: state.cardCollapsed,
      }),
    }
  )
);
