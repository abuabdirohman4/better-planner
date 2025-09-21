"use client";
import React from 'react';

import Button from '@/components/ui/button/Button';
import { useTimer } from '@/stores/timerStore';

const SHORT_BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <polygon points="20,16 32, 24 20,32" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <rect x="17" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="27" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);

export default function PomodoroTimer() {
  const {
    timerState,
    secondsElapsed,
    activeTask,
    breakType,
    startFocusSession,
    pauseTimer,
    resumeTimer,
    stopTimer,
  } = useTimer();

  // Helper to get total seconds for progress
  const focusDuration = activeTask?.focus_duration ? activeTask.focus_duration * 60 : 25 * 60; // Default 25 minutes
  let totalSeconds = 0;
  if (timerState === 'FOCUSING') totalSeconds = focusDuration;
  else if (timerState === 'BREAK' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'BREAK' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED') totalSeconds = focusDuration;
  else totalSeconds = focusDuration; // fallback/idle

  // Progress calculation
  let progress = 0;
  if (timerState === 'FOCUSING' || timerState === 'BREAK' || timerState === 'PAUSED') {
    progress = secondsElapsed / totalSeconds;
  } else {
    progress = 1;
  }

  // Tampilkan waktu
  const timeDisplay = formatTime(secondsElapsed);

  // Pilih ikon & handler sesuai state
  let IconComponent = PlayIcon;
  let iconColor = 'text-brand-500';
  let iconAction = () => activeTask && startFocusSession(activeTask);
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
        {!activeTask ? (
          <span className="text-lg select-none">00:00</span>
        ) : (
          <>
            <Button variant="plain" size="sm" className='-mt-2 !p-0 cursor-pointer z-10' onClick={iconAction}>
              <IconComponent className={`w-16 h-16 ${iconColor}`} />
            </Button>
            <span className="-mt-3 text-sm select-none">{timeDisplay}</span>
          </>
        )}
      </div>
      {/* Judul dan subjudul */}
      {activeTask ? <div className="text-base text-gray-500 dark:text-gray-300 my-3 text-center font-medium">{activeTask.title}</div> : null}
      {/* Tombol Cancel */}
      {(timerState === 'FOCUSING' || timerState === 'PAUSED') && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={stopTimer}
        >
          Cancel
        </Button>
      )}
    </div>
  );
}
