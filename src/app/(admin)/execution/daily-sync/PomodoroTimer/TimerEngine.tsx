"use client";

import { useEffect } from 'react';
import { useTimer } from '@/stores/timerStore';
import { useTimerPersistence } from './hooks/useTimerPersistence';
import { useBackgroundTimer } from './hooks/useBackgroundTimer';

/** Mesin timer tanpa UI (dulu menumpang di kartu Pomodoro): simpan, pulihkan, realtime, notifikasi, reset harian — app-mgsb. */
export default function TimerEngine() {
  const { checkDailyReset } = useTimer();
  useTimerPersistence();
  useBackgroundTimer();
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);
  return null;
}
