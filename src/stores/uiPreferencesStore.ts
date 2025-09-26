import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIPreferencesState {
  // Separate show/hide completed tasks for main quest and side quest
  showCompletedMainQuest: boolean;
  showCompletedSideQuest: boolean;
  setShowCompletedMainQuest: (show: boolean) => void;
  setShowCompletedSideQuest: (show: boolean) => void;
  toggleShowCompletedMainQuest: () => void;
  toggleShowCompletedSideQuest: () => void;
  
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
      // Separate show/hide completed tasks for main quest and side quest
      showCompletedMainQuest: true, // Default to show completed main quest tasks
      showCompletedSideQuest: true, // Default to show completed side quest tasks
      setShowCompletedMainQuest: (show: boolean) => 
        set({ showCompletedMainQuest: show }),
      setShowCompletedSideQuest: (show: boolean) => 
        set({ showCompletedSideQuest: show }),
      toggleShowCompletedMainQuest: () => 
        set((state) => ({ showCompletedMainQuest: !state.showCompletedMainQuest })),
      toggleShowCompletedSideQuest: () => 
        set((state) => ({ showCompletedSideQuest: !state.showCompletedSideQuest })),
      
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
      // Persist both show completed states and cardCollapsed states
      partialize: (state) => ({ 
        showCompletedMainQuest: state.showCompletedMainQuest,
        showCompletedSideQuest: state.showCompletedSideQuest,
        cardCollapsed: state.cardCollapsed,
      }),
    }
  )
);
