import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK' | 'BREAK_TIME';

export interface Task {
  id: string;
  title: string;
  item_type: string;
}

interface SessionCompleteData {
  taskId: string;
  taskTitle: string;
  duration: number;
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  startTime: string;
  endTime: string;
}

interface TimerStoreState {
  timerState: TimerState;
  secondsElapsed: number;
  activeTask: Task | null;
  sessionCount: number;
  breakType: 'SHORT' | 'LONG' | null;
  lastSessionComplete: SessionCompleteData | null;
  startFocusSession: (task: Task) => void;
  startBreak: (type: 'SHORT' | 'LONG') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setLastSessionComplete: (data: SessionCompleteData | null) => void;
  incrementSeconds: () => void;
}

// Durasi default (detik)
const FOCUS_DURATION = 15;
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

export const useTimerStore = create<TimerStoreState>()(
  persist(
    (set, get) => ({
      timerState: 'IDLE',
      secondsElapsed: 0,
      activeTask: null,
      sessionCount: 0,
      breakType: null,
      lastSessionComplete: null,

      startFocusSession: (task: Task) => set({
        activeTask: task,
        timerState: 'FOCUSING',
        secondsElapsed: 0,
        breakType: null,
      }),

      startBreak: (type: 'SHORT' | 'LONG') => set({
        timerState: 'BREAK',
        breakType: type,
        secondsElapsed: 0,
      }),

      pauseTimer: () => set({ timerState: 'PAUSED' }),

      resumeTimer: () => set((state) => ({
        timerState: state.breakType ? 'BREAK' : 'FOCUSING'
      })),

      stopTimer: () => {
        const state = get();
        if (state.timerState === 'FOCUSING' && state.activeTask && state.secondsElapsed > 0) {
          const now = new Date();
          const endTime = now.toISOString();
          const startTime = new Date(now.getTime() - state.secondsElapsed * 1000).toISOString();
          set({
            lastSessionComplete: {
              taskId: state.activeTask.id,
              taskTitle: state.activeTask.title,
              duration: Math.round(state.secondsElapsed),
              type: 'FOCUS',
              startTime,
              endTime
            },
            timerState: 'IDLE',
            secondsElapsed: 0,
            activeTask: null,
            breakType: null,
          });
        } else {
          set({
            timerState: 'IDLE',
            secondsElapsed: 0,
            activeTask: null,
            breakType: null,
          });
        }
      },

      resetTimer: () => set({
        timerState: 'IDLE',
        secondsElapsed: 0,
        breakType: null,
        activeTask: null,
      }),

      setLastSessionComplete: (data: SessionCompleteData | null) => set({ lastSessionComplete: data }),

      incrementSeconds: () => set((state) => {
        const newSeconds = Math.round(state.secondsElapsed + 1);
        
        // Auto-stop logic
        if (state.timerState === 'FOCUSING' && newSeconds >= FOCUS_DURATION) {
          if (state.activeTask) {
            const now = new Date();
            const endTime = now.toISOString();
            const startTime = new Date(now.getTime() - FOCUS_DURATION * 1000).toISOString();
            return {
              lastSessionComplete: {
                taskId: state.activeTask.id,
                taskTitle: state.activeTask.title,
                duration: Math.round(FOCUS_DURATION),
                type: 'FOCUS',
                startTime,
                endTime
              },
              timerState: 'BREAK_TIME' as TimerState,
              sessionCount: state.sessionCount + 1,
              secondsElapsed: newSeconds,
            };
          }
          return {
            timerState: 'BREAK_TIME' as TimerState,
            sessionCount: state.sessionCount + 1,
            secondsElapsed: newSeconds,
          };
        } else if (state.timerState === 'BREAK' && state.breakType === 'SHORT' && newSeconds >= SHORT_BREAK_DURATION) {
          return {
            timerState: 'IDLE' as TimerState,
            breakType: null,
            secondsElapsed: newSeconds,
          };
        } else if (state.timerState === 'BREAK' && state.breakType === 'LONG' && newSeconds >= LONG_BREAK_DURATION) {
          return {
            timerState: 'IDLE' as TimerState,
            breakType: null,
            secondsElapsed: newSeconds,
          };
        }
        
        return { secondsElapsed: newSeconds };
      }),
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({
        timerState: state.timerState,
        secondsElapsed: state.secondsElapsed,
        activeTask: state.activeTask,
        sessionCount: state.sessionCount,
        breakType: state.breakType,
      }),
    }
  )
);

// Hook for easier usage
export const useTimer = () => {
  const store = useTimerStore();
  return store;
};
