import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

// Tipe state timer
export type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK' | 'BREAK_TIME';

export interface Task {
  id: string;
  title: string;
  item_type: string;
}

interface TimerContextType {
  timerState: TimerState;
  secondsElapsed: number;
  activeTask: Task | null;
  sessionCount: number;
  breakType: 'SHORT' | 'LONG' | null;
  startFocusSession: (task: Task) => void;
  startBreak: (type: 'SHORT' | 'LONG') => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Durasi default (detik)
const FOCUS_DURATION = 25 * 60;
const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

const LOCAL_STORAGE_KEY = 'better-planner-timer-state-v1';

function loadPersistedState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistState(state: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [breakType, setBreakType] = useState<'SHORT' | 'LONG' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load state dari localStorage saat mount
  useEffect(() => {
    const persisted = loadPersistedState();
    if (persisted) {
      setTimerState(persisted.timerState || 'IDLE');
      setSecondsElapsed(persisted.secondsElapsed || 0);
      setActiveTask(persisted.activeTask || null);
      setSessionCount(persisted.sessionCount || 0);
      setBreakType(persisted.breakType || null);
    }
  }, []);

  // Persist state ke localStorage setiap perubahan
  useEffect(() => {
    persistState({ timerState, secondsElapsed, activeTask, sessionCount, breakType });
  }, [timerState, secondsElapsed, activeTask, sessionCount, breakType]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'FOCUSING' || timerState === 'BREAK') {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerState]);

  // Otomatis stop timer jika waktu habis
  useEffect(() => {
    if (timerState === 'FOCUSING' && secondsElapsed >= FOCUS_DURATION) {
      setTimerState('BREAK_TIME');
      setSessionCount(c => c + 1);
    } else if (timerState === 'BREAK' && breakType === 'SHORT' && secondsElapsed >= SHORT_BREAK_DURATION) {
      setTimerState('IDLE');
      setBreakType(null);
    } else if (timerState === 'BREAK' && breakType === 'LONG' && secondsElapsed >= LONG_BREAK_DURATION) {
      setTimerState('IDLE');
      setBreakType(null);
    }
  }, [timerState, secondsElapsed, breakType]);

  // Kontrol
  const startFocusSession = (task: Task) => {
    setActiveTask(task);
    setTimerState('FOCUSING');
    setSecondsElapsed(0);
    setBreakType(null);
  };
  const startBreak = (type: 'SHORT' | 'LONG') => {
    setTimerState('BREAK');
    setBreakType(type);
    setSecondsElapsed(0);
  };
  const pauseTimer = () => {
    setTimerState('PAUSED');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const resumeTimer = () => {
    setTimerState(breakType ? 'BREAK' : 'FOCUSING');
  };
  const stopTimer = () => {
    setTimerState('IDLE');
    setSecondsElapsed(0);
    setActiveTask(null);
    setBreakType(null);
  };
  const resetTimer = () => {
    setTimerState('IDLE');
    setSecondsElapsed(0);
    setBreakType(null);
    setActiveTask(null);
  };

  const value: TimerContextType = {
    timerState,
    secondsElapsed,
    activeTask,
    sessionCount,
    breakType,
    startFocusSession,
    startBreak,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
} 