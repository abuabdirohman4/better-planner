"use client";
import { useState, useEffect, SVGProps } from 'react';
import { Ban } from 'lucide-react';

import Button from '@/components/ui/button/Button';
import { useTimer } from '@/stores/timerStore';
import { useSoundStore } from '@/stores/soundStore';
import { useTimerPersistence } from './hooks/useTimerPersistence';
import { useGlobalTimer } from './hooks/useGlobalTimer';
import { useBackgroundTimer } from './hooks/useBackgroundTimer';
import { useLiveTimerNotification } from './hooks/useLiveTimerNotification';
import SoundSelector from './components/SoundSelector';
import Spinner from '@/components/ui/spinner/Spinner';
import AudioPermissionPrompt from '@/app/(admin)/execution/daily-sync/PomodoroTimer/components/AudioPermissionPrompt';
import { checkAudioPermission, initializeAudioContext } from '@/lib/soundUtils';
import { isTimerDisabled, getTimerDevStatusMessage } from '@/lib/timerDevUtils';
import DebugTimer from './components/DebugTimer';
import BreakPrompt from './components/BreakPrompt';

const isDev = process.env.NODE_ENV === 'development';
const SHORT_BREAK_DURATION = isDev ? 30 : 5 * 60;
const MEDIUM_BREAK_DURATION = isDev ? 45 : 10 * 60;
const LONG_BREAK_DURATION = isDev ? 60 : 15 * 60;

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function CircularTimer({
  progress,
  size = 90,
  stroke = 4,
  isBreak = false
}: {
  progress: number;
  size?: number;
  stroke?: number;
  isBreak?: boolean;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);
  return (
    <svg className="absolute top-0 left-0" width={size} height={size}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb" // gray-200
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={isBreak ? "#fb2c36" : "#3b82f6"} // brand-500 (blue)
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.25s ease-out" }}
      />
    </svg>
  );
}

const PlayIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <polygon points="20,16 32, 24 20,32" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const PauseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 48 48" fill="none" {...props}>
    <rect x="17" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="27" y="16" width="4" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const BreakIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="-12 -12 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10 2v2" />
    <path d="M14 2v2" />
    <path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1" />
    <path d="M6 2v2" />
  </svg>
);

export default function PomodoroTimer() {
  const {
    timerState,
    secondsElapsed,
    activeTask,
    breakType,
    startFocusSession,
    startBreak,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isProcessingCompletion,
    waitingForBreak,
    lastFocusDuration,
    dismissBreakPrompt,
    lastActiveTask, // ✅ Get last active task
    resumeLastTask, // ✅ New action
    checkDailyReset // ✅ New action for daily reset
  } = useTimer();

  // Initialize timer persistence
  const { isOnline, isRecovering } = useTimerPersistence();

  // Initialize global timer (this handles the actual timer counting and focus sound)
  useGlobalTimer();

  // Initialize background timer for notifications and completion handling
  useBackgroundTimer();

  // Initialize live timer notifications for PWA
  useLiveTimerNotification();

  // Reset timer if day changed
  useEffect(() => {
    checkDailyReset();
  }, [checkDailyReset]);

  // ✅ DEV CONTROL: Check if timer is disabled in development
  const timerDisabled = isTimerDisabled();
  const devStatusMessage = getTimerDevStatusMessage();

  // Get sound settings to check if user wants audio
  const { focusSettings, settings, loadSettings } = useSoundStore();

  const [showSoundSelector, setShowSoundSelector] = useState(false);
  const [showAudioPermissionPrompt, setShowAudioPermissionPrompt] = useState(false);
  const [audioPermissionChecked, setAudioPermissionChecked] = useState(false);

  // Check audio permission on component mount (only once)
  // useEffect(() => {
  //   const checkPermission = async () => {
  //     try {
  //       // Force refresh settings from database first
  //       await loadSettings();

  //       // Get fresh settings after refresh
  //       const freshSettings = useSoundStore.getState().settings;

  //       // Check if user wants to use focus sound (only this needs browser permission)
  //       const wantsFocusSound = freshSettings.focusSoundId !== 'none';

  //       // Only check permission if user wants to use focus sound (background audio)
  //       if (wantsFocusSound) {
  //         const hasPermission = await checkAudioPermission();

  //         if (!hasPermission) {
  //           setShowAudioPermissionPrompt(true);
  //         }
  //       } else {
  //         // Force hide prompt if user doesn't want focus sound
  //         setShowAudioPermissionPrompt(false);
  //       }
  //       setAudioPermissionChecked(true);
  //     } catch (error) {
  //       console.error('Error checking audio permission:', error);
  //       setAudioPermissionChecked(true);
  //     }
  //   };

  //   // Only check once when component mounts
  //   if (!audioPermissionChecked) {
  //     checkPermission();
  //   }
  // }, [settings.focusSoundId, audioPermissionChecked, loadSettings]); // Add loadSettings dependency

  const handleAudioPermissionGranted = () => {
    setShowAudioPermissionPrompt(false);
    // Initialize audio context after permission granted
    initializeAudioContext().catch(console.error);
  };

  const handleSkipAudioPermission = () => {
    setShowAudioPermissionPrompt(false);
  };

  // Check if any loading state is active
  const isLoading = isRecovering || isProcessingCompletion;

  // Helper to get total seconds for progress
  const focusDuration = activeTask?.focus_duration
    ? activeTask.focus_duration * 60
    : (lastActiveTask?.focus_duration ? lastActiveTask.focus_duration * 60 : 25 * 60);

  let totalSeconds = 0;
  if (timerState === 'FOCUSING') totalSeconds = focusDuration;
  else if (timerState === 'BREAK' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'BREAK' && breakType === 'MEDIUM') totalSeconds = MEDIUM_BREAK_DURATION;
  else if (timerState === 'BREAK' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'SHORT') totalSeconds = SHORT_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'MEDIUM') totalSeconds = MEDIUM_BREAK_DURATION;
  else if (timerState === 'PAUSED' && breakType === 'LONG') totalSeconds = LONG_BREAK_DURATION;
  else if (timerState === 'PAUSED') totalSeconds = focusDuration;
  else totalSeconds = focusDuration; // fallback/idle logic uses last active or default

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
  let iconAction = () => {
    if (activeTask) startFocusSession(activeTask);
    else if (lastActiveTask) resumeLastTask();
  };

  if (timerState === 'FOCUSING') {
    IconComponent = PauseIcon;
    iconColor = 'text-orange-500';
    iconAction = pauseTimer;
  } else if (timerState === 'PAUSED') {
    IconComponent = PlayIcon;
    iconColor = 'text-brand-500';
    iconAction = resumeTimer;
  } else if (timerState === 'BREAK') {
    IconComponent = BreakIcon;
    iconColor = 'text-red-500';
    iconAction = resumeTimer;
  } else if (timerState === 'IDLE' && lastActiveTask) {
    // Explicitly handle "Resume Old Task" state
    IconComponent = PlayIcon;
    iconColor = 'text-brand-500';
    iconAction = resumeLastTask;
  }

  // Display Task Title Logic
  const displayTask = activeTask || lastActiveTask;
  const displayTitle = timerState === 'BREAK'
    ? `Break Time (${breakType === 'SHORT' ? '5m' : breakType === 'MEDIUM' ? '10m' : '15m'})`
    : displayTask?.title || 'Ready to Focus';

  // Display Progress Info
  const showProgress = !activeTask && lastActiveTask && timerState === 'IDLE';
  const progressText = displayTask?.completed_sessions !== undefined && displayTask?.target_sessions
    ? `${displayTask.completed_sessions}/${displayTask.target_sessions} today's target`
    : null;

  // New: Determine if interaction is possible and appropriate
  const isActionable = timerState !== 'IDLE' || !!lastActiveTask;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Audio Permission Prompt */}
      {showAudioPermissionPrompt && (
        <AudioPermissionPrompt
          onPermissionGranted={handleAudioPermissionGranted}
          onSkip={handleSkipAudioPermission}
        />
      )}
      <div className="absolute right-[68px] top-[24px]">
        {/* Sound Settings */}
        <button
          onClick={() => setShowSoundSelector(true)}
          className="flex items-center space-x-2 text-gray-500 hover:text-brand-500 transition-colors"
          title="Sound Settings"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.808L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.808a1 1 0 011.617.808zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Sound Settings</span>
        </button>
      </div>

      {/* Status indicators */}
      {timerDisabled && devStatusMessage && (
        <div className="mb-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
          🚧 {devStatusMessage}
        </div>
      )}
      {/* {isRecovering && (
        <div className="mb-2 flex items-center justify-center space-x-2 text-xs text-blue-500">
          <Spinner size={14} className="mr-2" /> Recovering timer session...
        </div>
      )} */}
      {!isOnline && (
        <div className="mb-2 text-xs text-orange-500">
          ⚠️ You're offline - timer will sync when online
        </div>
      )}
      {isProcessingCompletion && (
        <div className="mb-2 flex items-center justify-center space-x-2 text-xs text-green-500">
          <Spinner size={14} colorClass='border-green-500' className="mr-2" /> Processing completion...
        </div>
      )}

      {/* Break Prompt Overlay */}
      <BreakPrompt
        isVisible={waitingForBreak}
        lastFocusDuration={lastFocusDuration}
        onStartBreak={startBreak}
        onSkip={dismissBreakPrompt}
      />

      {/* Timer lingkaran dan kontrol play/pause */}
      <div className={`flex items-center gap-6`}>
        {/* Timer Circle - Fixed position di kiri */}
        <div className="relative w-[90px] h-[90px] flex flex-col items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
          {activeTask || timerState === 'BREAK' ? (
            <div className="pointer-events-none absolute inset-0">
              <CircularTimer progress={progress} size={90} stroke={5} isBreak={timerState === 'BREAK'} />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0">
              <CircularTimer progress={progress} size={90} stroke={5} isBreak={false} />
            </div>
          )}
          {(!activeTask && !lastActiveTask && timerState !== 'BREAK') ? (
            <span className="text-lg select-none">00:00</span>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center -mt-2">
                <IconComponent 
                  className={`w-16 h-16 ${iconColor} ${isActionable ? 'cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95' : ''}`} 
                  onClick={() => {
                    if (isActionable) iconAction();
                  }}
                />
                <span className="-mt-3 text-sm select-none">{timeDisplay}</span>
              </div>
            </>
          )}
        </div>

        {/* Right side content - Task title dan button */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          {/* Task Title */}
          <div className="text-left text-xl font-medium break-words leading-tight">
            {displayTitle}
          </div>

          {/* Progress Info (Only in Idle/Resume state) */}
          {showProgress && progressText && (
            <div className="text-left text-sm text-gray-600">
              {progressText}
            </div>
          )}

          {/* Stop Button */}
          {(timerState === 'FOCUSING' || timerState === 'PAUSED') && (
            <div className="flex justify-start mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-orange-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation(); // Prevent triggering parent onClick
                  stopTimer();
                }}
              >
                <Ban className="w-3 h-3" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Debug Timer - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <DebugTimer />
      )}

      {/* Sound Selector Modal */}
      <SoundSelector
        isOpen={showSoundSelector}
        onClose={() => setShowSoundSelector(false)}
      />
    </div>
  );
}
