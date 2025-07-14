"use client";
import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/button/Button';

interface PomodoroTimerProps {
  activeTask?: {
    id: string;
    title: string;
    item_type: string;
  } | null;
  onSessionComplete?: (sessionData: {
    taskId: string;
    taskTitle: string;
    duration: number;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  }) => void;
  shouldStart?: boolean;
  onStarted?: () => void;
}

type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK' | 'BREAK_TIME';

const FOCUS_DURATION = 0.25 * 60; // 25 minutes in seconds
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes in seconds

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const playNotificationSound = () => {
  try {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.log('Error playing notification sound:', err);
  }
};

function CircularTimer({
  progress,
  size = 90,
  stroke = 4
}: {
  progress: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <svg className="absolute top-0 left-0" width={size} height={size}>
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#e5e7eb" // gray-200
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        stroke="#3b82f6" // brand-500 (blue)
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s linear" }}
      />
    </svg>
  );
}

// Tambahkan PlayIcon dan PauseIcon lokal
// Ganti tipe props PlayIcon dan PauseIcon
// PlayIcon tanpa lingkaran, segitiga outline
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <polygon points="20,16 32, 24 20,32" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
// PauseIcon tanpa lingkaran
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <rect x="17" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="27" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function PomodoroTimer({ activeTask, onSessionComplete, shouldStart, onStarted }: PomodoroTimerProps) {
  console.log('activeTask', activeTask)
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [breakType, setBreakType] = useState<'SHORT' | 'LONG' | null>(null);
  const [sessionJustCompleted, setSessionJustCompleted] = useState<null | 'FOCUS' | 'BREAK'>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto start timer if shouldStart is true
  useEffect(() => {
    if (shouldStart && activeTask && timerState !== 'FOCUSING') {
      setTimerState('FOCUSING');
      setSecondsElapsed(0);
      setSessionJustCompleted(null);
      if (onStarted) onStarted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStart, activeTask]);

  // Timer logic
  useEffect(() => {
    if (timerState === 'FOCUSING' || timerState === 'BREAK') {
      intervalRef.current = setInterval(() => {
        setSecondsElapsed(prev => {
          const newSeconds = prev + 1;
          // Check if timer is complete
          const maxDuration = timerState === 'FOCUSING' ? FOCUS_DURATION : 
                             breakType === 'SHORT' ? SHORT_BREAK_DURATION : LONG_BREAK_DURATION;
          if (newSeconds >= maxDuration) {
            // Timer completed
            playNotificationSound();
            if (timerState === 'FOCUSING') {
              // Focus session completed
              if (activeTask && onSessionComplete) {
                onSessionComplete({
                  taskId: activeTask.id,
                  taskTitle: activeTask.title,
                  duration: FOCUS_DURATION,
                  type: 'FOCUS'
                });
              }
              setTimerState('BREAK_TIME');
              setSessionJustCompleted('FOCUS');
              // setSecondsElapsed(0); // JANGAN reset, biarkan di max
            } else {
              // Break completed
              if (onSessionComplete) {
                onSessionComplete({
                  taskId: activeTask?.id || '',
                  taskTitle: activeTask?.title || 'Break',
                  duration: breakType === 'SHORT' ? SHORT_BREAK_DURATION : LONG_BREAK_DURATION,
                  type: breakType === 'SHORT' ? 'SHORT_BREAK' : 'LONG_BREAK'
                });
              }
              setTimerState('IDLE');
              setSessionJustCompleted('BREAK');
              // setSecondsElapsed(0); // JANGAN reset, biarkan di max
              setBreakType(null);
            }
            return prev; // Biarkan di max
          }
          return newSeconds;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState, breakType, activeTask, onSessionComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startFocusSession = () => {
    if (!activeTask) {
      alert('Pilih tugas terlebih dahulu untuk memulai sesi fokus');
      return;
    }
    setTimerState('FOCUSING');
    setSecondsElapsed(0);
    setSessionJustCompleted(null);
  };

  const pauseTimer = () => {
    setTimerState('PAUSED');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const resumeTimer = () => {
    setTimerState(breakType ? 'BREAK' : 'FOCUSING');
  };

  // Handler untuk reset ke idle setelah break selesai
  // const handleReset = () => {
  //   setTimerState('IDLE');
  //   setSecondsElapsed(0);
  //   setBreakType(null);
  //   setSessionJustCompleted(null);
  // };

  // Helper to get total seconds for progress
  let totalSeconds = 0;
  if (timerState === 'FOCUSING') totalSeconds = FOCUS_DURATION;
  else if (timerState === 'BREAK' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'BREAK' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED') totalSeconds = FOCUS_DURATION;
  else if (timerState === 'BREAK_TIME' && sessionJustCompleted === 'FOCUS') totalSeconds = FOCUS_DURATION;
  else if (timerState === 'IDLE' && sessionJustCompleted === 'BREAK') totalSeconds = breakType === 'LONG' ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION;
  else totalSeconds = FOCUS_DURATION; // fallback/idle

  // Progress calculation
  let progress = 0;
  if (timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED') {
    progress = secondsElapsed / totalSeconds;
  } else if (timerState === 'BREAK_TIME' && sessionJustCompleted === 'FOCUS') {
    progress = 1;
  } else if (timerState === 'IDLE' && sessionJustCompleted === 'BREAK') {
    progress = 1;
  } else {
    progress = 0;
  }

  // Tampilkan waktu (naik dari 00:00 ke totalSeconds, atau tetap di max saat selesai)
  let timeDisplay = '';
  if (timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED') {
    timeDisplay = formatTime(secondsElapsed);
  } else if (timerState === 'BREAK_TIME' && sessionJustCompleted === 'FOCUS') {
    timeDisplay = formatTime(totalSeconds);
  } else if (timerState === 'IDLE' && sessionJustCompleted === 'BREAK') {
    timeDisplay = formatTime(totalSeconds);
  } else {
    timeDisplay = formatTime(0);
  }

  // Pilih ikon & handler sesuai state
  let IconComponent = PlayIcon;
  let iconColor = 'text-brand-500';
  let iconAction = startFocusSession;
  if (timerState === 'FOCUSING') {
    IconComponent = PauseIcon;
    iconColor = 'text-orange-500';
    iconAction = pauseTimer;
  } else if (timerState === 'PAUSED') {
    IconComponent = PlayIcon;
    iconColor = 'text-brand-500';
    iconAction = resumeTimer;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Timer lingkaran dan kontrol play/pause */}
      <div className="relative w-[90px] h-[90px] flex flex-col items-center justify-center mx-auto">
        {activeTask ? (
          <CircularTimer progress={progress} size={90} stroke={5} />
        ) : (
          <svg className="absolute top-0 left-0 w-full h-full" width={90} height={90}>
          <circle
            cx={45}
            cy={45}
            r={41}
            stroke="#e5e7eb"
            strokeWidth={4}
            fill="none"
          />
        </svg>
        )}
        { !activeTask ? (
          <span className="text-lg select-none">00:00</span>
        ) : (
          <>
            {/* Saat selesai fokus, tampilkan progress 100% dan waktu max, serta tombol break */}
            {timerState === 'BREAK_TIME' && sessionJustCompleted === 'FOCUS' ? (
              <>
                <Button variant="plain" size="sm" className='-mt-2 !p-0 cursor-pointer z-10' onClick={iconAction}>
                  <IconComponent className={`w-16 h-16 ${iconColor}`} />
                </Button>
                <span className="-mt-3 text-sm text-brand-500 select-none">{formatTime(FOCUS_DURATION)}</span>
              </>
            ) : timerState === 'IDLE' && sessionJustCompleted === 'BREAK' ? (
              <>
                {/* <Button variant="plain" size="sm" className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 !p-0 cursor-pointer z-10" onClick={handleReset}>
                  <PlayIcon className="w-10 h-10 text-brand-500" />
                </Button>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-green-500 select-none">{breakType === 'LONG' ? formatTime(LONG_BREAK_DURATION) : formatTime(SHORT_BREAK_DURATION)}</span>
                <div className="absolute left-1/2 top-[70%] -translate-x-1/2">
                  <Button size="sm" variant="outline" onClick={handleReset}>Selesai</Button>
                </div> */}
              </>
            ) : (
              <>
                <Button variant="plain" size="sm" className='-mt-2 !p-0 cursor-pointer z-10' onClick={iconAction}>
                  <IconComponent className={`w-16 h-16 ${iconColor}`} />
                </Button>
                <span className="-mt-3 text-sm select-none">{timeDisplay}</span>
              </>
            )}
          </>
        )}
      </div>
      {/* Judul dan subjudul */}
      {activeTask && (
        <div className="text-base text-gray-500 dark:text-gray-300 my-3 text-center font-medium">{activeTask.title}</div>
      )}
      {/* Tombol Jeda & Hentikan saat FOCUSING */}
      {/* {timerState === 'FOCUSING' && (
        <div className="flex gap-4 w-full max-w-xs mx-auto mt-2">
          <button
            onClick={handlePause}
            className="flex-1 px-0 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-lg shadow transition-colors"
          >
            Jeda
          </button>
          <button
            onClick={() => { setTimerState('IDLE'); setSecondsElapsed(0); setBreakType(null); }}
            className="flex-1 px-0 py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow transition-colors"
          >
            Hentikan
          </button>
        </div>
      )} */}
    </div>
  );
} 