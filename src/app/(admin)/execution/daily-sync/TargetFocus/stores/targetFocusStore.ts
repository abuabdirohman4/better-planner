import { create } from 'zustand';

interface TargetFocusItem {
  itemId: string;
  itemType: string;
  sessionTarget: number;
  focusDuration: number;
  totalTimeTarget: number;
}

interface TargetFocusData {
  targets: TargetFocusItem[];
  totalTimeTarget: number;
}

interface TargetFocusStore {
  // Data
  targetsData: TargetFocusData | null;
  totalTimeActual: number;
  totalSessionsActual: number;
  
  // Actions
  setTargetsData: (data: TargetFocusData | null) => void;
  setTotalTimeActual: (time: number) => void;
  setTotalSessionsActual: (sessions: number) => void;
  
  // Optimistic update function
  updateTargetOptimistically: (itemId: string, newTarget: number) => void;
  
  // ✅ NEW: Optimistic update for checklist/quest conversion
  updateChecklistModeOptimistically: (itemId: string, isChecklist: boolean) => void;
  
  // ✅ NEW: Optimistic update for item removal
  removeItemOptimistically: (itemId: string) => void;
}

export const useTargetFocusStore = create<TargetFocusStore>((set, get) => ({
  // Initial state
  targetsData: null,
  totalTimeActual: 0,
  totalSessionsActual: 0,
  
  // Actions
  setTargetsData: (data) => set({ targetsData: data }),
  setTotalTimeActual: (time) => set({ totalTimeActual: time }),
  setTotalSessionsActual: (sessions) => set({ totalSessionsActual: sessions }),
  
  // Optimistic update function
  updateTargetOptimistically: (itemId: string, newTarget: number) => {
    const { targetsData } = get();
    
    if (!targetsData || !targetsData.targets) {
      return;
    }

    const updatedTargets = targetsData.targets.map((item) => {
      return item.itemId === itemId 
        ? { ...item, sessionTarget: newTarget, totalTimeTarget: newTarget * item.focusDuration }
        : item;
    });

    const newTotalTimeTarget = updatedTargets.reduce((sum, item) => sum + item.totalTimeTarget, 0);

    set({
      targetsData: {
        targets: updatedTargets,
        totalTimeTarget: newTotalTimeTarget
      }
    });
  },
  
  // ✅ NEW: Optimistic update for checklist/quest conversion
  // Immediately updates target focus when task is converted to/from checklist
  updateChecklistModeOptimistically: (itemId: string, isChecklist: boolean) => {
    const { targetsData } = get();
    
    if (!targetsData || !targetsData.targets) {
      return;
    }

    const updatedTargets = targetsData.targets.map((item) => {
      if (item.itemId === itemId) {
        if (isChecklist) {
          // Convert to checklist: set both to 0
          return {
            ...item,
            sessionTarget: 0,
            focusDuration: 0,
            totalTimeTarget: 0
          };
        } else {
          // Convert to quest: restore defaults (25 min focus, 1 session)
          return {
            ...item,
            sessionTarget: 1,
            focusDuration: 25,
            totalTimeTarget: 25 // 1 session * 25 minutes
          };
        }
      }
      return item;
    });

    const newTotalTimeTarget = updatedTargets.reduce((sum, item) => sum + item.totalTimeTarget, 0);

    set({
      targetsData: {
        targets: updatedTargets,
        totalTimeTarget: newTotalTimeTarget
      }
    });
  },
  
  // ✅ NEW: Optimistic update for item removal
  // Immediately removes item from target focus when task is removed from daily plan
  removeItemOptimistically: (itemId: string) => {
    const { targetsData } = get();
    
    if (!targetsData || !targetsData.targets) {
      return;
    }

    // Filter out the removed item
    const updatedTargets = targetsData.targets.filter((item) => item.itemId !== itemId);

    const newTotalTimeTarget = updatedTargets.reduce((sum, item) => sum + item.totalTimeTarget, 0);

    set({
      targetsData: {
        targets: updatedTargets,
        totalTimeTarget: newTotalTimeTarget
      }
    });
  },
}));
