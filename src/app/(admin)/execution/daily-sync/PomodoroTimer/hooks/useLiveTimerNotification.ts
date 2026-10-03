// Sticky timer notification for the PWA (Android).
// Web notifications cannot tick every second, so the notification shows a static
// "selesai HH:MM" and is refreshed only on state changes (start/pause/resume/break/stop).
// When the session ends with the app closed, the server push (tag 'timer', see pushDue.ts)
// replaces this notification with "Timer selesai".
// Call this hook ONCE per page (daily-sync page.tsx) — PomodoroTimer is mounted twice (mobile + desktop).

import { useEffect } from 'react';
import { useTimer, useTimerStore, BREAK_DURATIONS } from '@/stores/timerStore';

const TAG = 'timer';
const LIVE_KIND = 'timer-live';

type TimerAction = 'pause' | 'resume' | 'stop';

function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

async function clearLiveNotification() {
  const reg = await getRegistration();
  if (!reg) return;
  const list = await reg.getNotifications({ tag: TAG });
  // Only close our own sticky notification, never the server "Timer selesai" push
  list.filter((n) => n.data?.kind === LIVE_KIND).forEach((n) => n.close());
}

async function showLiveNotification() {
  const reg = await getRegistration();
  if (!reg) return;

  const { timerState, activeTask, breakType, startTime, secondsElapsed } = useTimerStore.getState();
  const isBreak = !!breakType;
  const totalSeconds = isBreak
    ? BREAK_DURATIONS[breakType!]
    : (activeTask?.focus_duration || 25) * 60;
  const taskTitle = activeTask?.title || 'Sesi fokus';

  let title: string;
  let body: string;
  let actions: { action: TimerAction; title: string }[];
  let timestamp: number | undefined;

  if (timerState === 'PAUSED') {
    title = isBreak ? '⏸️ Istirahat dijeda' : '⏸️ Timer dijeda';
    body = `${isBreak ? 'Istirahat' : taskTitle} · sisa ${formatRemaining(totalSeconds - secondsElapsed)}`;
    actions = [
      { action: 'resume', title: '▶️ Lanjut' },
      { action: 'stop', title: '⏹️ Stop' },
    ];
  } else {
    const startMs = startTime ? new Date(startTime).getTime() : Date.now() - secondsElapsed * 1000;
    const endMs = startMs + totalSeconds * 1000;
    timestamp = endMs;
    title = isBreak ? '☕ Istirahat' : `🎯 ${taskTitle}`;
    body = `Selesai ${formatClock(endMs)} WIB`;
    actions = isBreak
      ? [{ action: 'stop', title: '⏹️ Stop' }]
      : [
          { action: 'pause', title: '⏸️ Pause' },
          { action: 'stop', title: '⏹️ Stop' },
        ];
  }

  await reg.showNotification(title, {
    body,
    tag: TAG,
    icon: '/images/logo/icon-192.png',
    badge: '/images/logo/icon-192.png',
    requireInteraction: true,
    silent: true,
    renotify: false,
    timestamp,
    actions,
    data: { kind: LIVE_KIND, url: '/execution/daily-sync' },
  } as NotificationOptions);
}

// Apply an action tapped in the notification. `at` = tap time, because a backgrounded
// page may receive the message late; elapsed time is pinned to the tap, not to delivery.
function handleNotificationAction(action: TimerAction, at: number) {
  const store = useTimerStore.getState();
  const pinElapsed = () => {
    if (!store.startTime) return;
    const elapsed = Math.max(0, Math.floor((at - new Date(store.startTime).getTime()) / 1000));
    useTimerStore.setState({ secondsElapsed: elapsed });
  };

  switch (action) {
    case 'pause':
      if (store.timerState === 'FOCUSING' || store.timerState === 'BREAK') {
        pinElapsed();
        store.pauseTimer();
      }
      break;
    case 'resume':
      if (store.timerState === 'PAUSED') store.resumeTimer();
      break;
    case 'stop':
      if (store.timerState !== 'IDLE') {
        pinElapsed();
        store.stopTimer();
      }
      break;
  }
}

export function useLiveTimerNotification() {
  const { timerState, activeTask, startTime, breakType } = useTimer();

  // Refresh only on state transitions — not every second
  useEffect(() => {
    if (timerState === 'IDLE') {
      clearLiveNotification().catch(() => {});
    } else {
      showLiveNotification().catch(() => {});
    }
  }, [timerState, activeTask?.id, startTime, breakType]);

  // Actions forwarded by sw-custom.js (notificationclick)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIMER_ACTION') {
        handleNotificationAction(event.data.action, event.data.at ?? Date.now());
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);
}
