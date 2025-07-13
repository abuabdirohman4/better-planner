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
  time,
  progress,
  icon
}: {
  time: string;
  progress: number;
  icon?: React.ReactNode;
}) {
  const size = 112;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
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
      <div className="flex flex-col items-center justify-center z-10">
        {icon}
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{time}</span>
      </div>
    </div>
  );
}

export default function PomodoroTimer({ activeTask, onSessionComplete, shouldStart, onStarted }: PomodoroTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [breakType, setBreakType] = useState<'SHORT' | 'LONG' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto start timer if shouldStart is true
  useEffect(() => {
    if (shouldStart && activeTask && timerState !== 'FOCUSING') {
      setTimerState('FOCUSING');
      setSecondsElapsed(0);
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
              setSessionCount(prev => prev + 1);
              if (activeTask && onSessionComplete) {
                onSessionComplete({
                  taskId: activeTask.id,
                  taskTitle: activeTask.title,
                  duration: FOCUS_DURATION,
                  type: 'FOCUS'
                });
              }
              setTimerState('BREAK_TIME');
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
            }
            
            setSecondsElapsed(0);
            setBreakType(null);
            return 0;
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

  // Helper to get total seconds for progress
  let totalSeconds = 1500; // default 25 min
  if (timerState === 'BREAK' && breakType === 'SHORT') totalSeconds = 300;
  if (timerState === 'BREAK' && breakType === 'LONG') totalSeconds = 900;
  // Extract seconds from secondsElapsed for progress
  // (Assume secondsElapsed is always MM:SS)
  const progress = secondsElapsed / totalSeconds;

  // Handler untuk tombol
  const handleStart = () => startFocusSession();
  const handlePause = () => pauseTimer();
  const handleResume = () => resumeTimer();

  // Tambahkan PlayIcon dan PauseIcon lokal
  // Ganti tipe props PlayIcon dan PauseIcon
  // PlayIcon tanpa lingkaran, segitiga outline
  const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <polygon points="20,16 36,24 20,32" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
  // PauseIcon tanpa lingkaran
  const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" fill="none" {...props}>
      <rect x="17" y="16" width="4" height="16" rx="2" fill="currentColor"/>
      <rect x="27" y="16" width="4" height="16" rx="2" fill="currentColor"/>
    </svg>
  );

  // Pilih ikon & handler sesuai state
  let IconComponent = PlayIcon;
  let iconColor = 'text-brand-500';
  let iconAction = handleStart;
  if (timerState === 'FOCUSING') {
    IconComponent = PauseIcon;
    iconColor = 'text-orange-500';
    iconAction = handlePause;
  } else if (timerState === 'PAUSED') {
    IconComponent = PlayIcon;
    iconColor = 'text-brand-500';
    iconAction = handleResume;
  }

  // Tampilkan waktu (naik dari 00:00 ke totalSeconds)
  const timeDisplay = timerState === 'IDLE' ? formatTime(totalSeconds) : formatTime(secondsElapsed);

  return (
    <div className="relative w-[90px] h-[90px] flex flex-col items-center justify-center mx-auto">
      {/* Lingkaran background */}
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
      { !activeTask ? (
        <span className="text-sm select-none">00:00</span>
      ) : (
        <>
          <Button variant="plain" size="sm" className='-mt-2 !p-0 cursor-pointer z-10' onClick={iconAction}>
            <IconComponent className={`w-14 h-14 ${iconColor}`} />
          </Button>
          <span className="-mt-3 text-sm select-none">{timeDisplay}</span>
        </>
      )}
      {/* Sesi fokus hari ini */}
      {/* {sessionCount > 0 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-gray-500 dark:text-gray-400">
          Sesi fokus hari ini: {sessionCount}
        </div>
      )} */}
    </div>
  );
} 