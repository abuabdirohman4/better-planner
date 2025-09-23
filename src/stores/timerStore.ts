import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playTimerCompleteSound } from '@/lib/soundUtils';
import { useSoundStore } from './soundStore';

export type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK';

export interface Task {
  id: string;
  title: string;
  item_type: string;
  focus_duration?: number; // Durasi fokus dalam menit
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
  startTime: string | null;
  startFocusSession: (task: Task) => void;
  startBreak: (type: 'SHORT' | 'LONG') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  setLastSessionComplete: (data: SessionCompleteData | null) => void;
  incrementSeconds: () => void;
  resumeFromDatabase: (sessionData: {
    taskId: string;
    taskTitle: string;
    startTime: string;
    currentDuration: number;
    status: string;
  }) => void;
}

// Durasi default (detik)
const FOCUS_DURATION = 25 * 60; // 25 menit default
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
      startTime: null,

      startFocusSession: (task: Task) => set({
        activeTask: task,
        timerState: 'FOCUSING',
        secondsElapsed: 0,
        breakType: null,
        startTime: new Date().toISOString(),
      }),

      startBreak: (type: 'SHORT' | 'LONG') => set({
        timerState: 'BREAK',
        breakType: type,
        secondsElapsed: 0,
        startTime: new Date().toISOString(),
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
        
        // Get focus duration from active task or use default
        const focusDuration = state.activeTask?.focus_duration ? state.activeTask.focus_duration * 60 : FOCUS_DURATION;
        
        // Auto-stop logic
        if (state.timerState === 'FOCUSING' && newSeconds >= focusDuration) {
          if (state.activeTask) {
            const now = new Date();
            const endTime = now.toISOString();
            const startTime = new Date(now.getTime() - focusDuration * 1000).toISOString();
            
            // Play completion sound
            const soundSettings = useSoundStore.getState().settings;
            if (soundSettings.enabled) {
              playTimerCompleteSound(
                soundSettings.soundId,
                soundSettings.volume,
                state.activeTask.title
              ).catch(console.error);
            }
            
            return {
              lastSessionComplete: {
                taskId: state.activeTask.id,
                taskTitle: state.activeTask.title,
                duration: Math.round(focusDuration),
                type: 'FOCUS',
                startTime,
                endTime
              },
              timerState: 'IDLE' as TimerState,
              sessionCount: state.sessionCount + 1,
              secondsElapsed: 0,
              activeTask: null,
              breakType: null,
            };
          }
          return {
            timerState: 'IDLE' as TimerState,
            sessionCount: state.sessionCount + 1,
            secondsElapsed: 0,
            activeTask: null,
            breakType: null,
          };
        } else if (state.timerState === 'BREAK' && state.breakType === 'SHORT' && newSeconds >= SHORT_BREAK_DURATION) {
          return {
            timerState: 'IDLE' as TimerState,
            breakType: null,
            secondsElapsed: 0,
          };
        } else if (state.timerState === 'BREAK' && state.breakType === 'LONG' && newSeconds >= LONG_BREAK_DURATION) {
          return {
            timerState: 'IDLE' as TimerState,
            breakType: null,
            secondsElapsed: 0,
          };
        }
        
        return { secondsElapsed: newSeconds };
      }),

      resumeFromDatabase: (sessionData) => set({
        activeTask: {
          id: sessionData.taskId,
          title: sessionData.taskTitle,
          item_type: 'MAIN_QUEST'
        },
        timerState: sessionData.status === 'PAUSED' ? 'PAUSED' : 'FOCUSING',
        secondsElapsed: sessionData.currentDuration,
        startTime: sessionData.startTime,
        breakType: null,
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
        startTime: state.startTime,
      }),
    }
  )
);

// Hook for easier usage
export const useTimer = () => {
  const store = useTimerStore();
  return store;
};
