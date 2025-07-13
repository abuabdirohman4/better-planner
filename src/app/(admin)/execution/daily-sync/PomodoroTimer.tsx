"use client";
import React, { useState, useEffect, useRef } from 'react';

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
}

type TimerState = 'IDLE' | 'FOCUSING' | 'PAUSED' | 'BREAK' | 'BREAK_TIME';

const FOCUS_DURATION = 25 * 60; // 25 minutes in seconds
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

export default function PomodoroTimer({ activeTask, onSessionComplete }: PomodoroTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>('IDLE');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [breakType, setBreakType] = useState<'SHORT' | 'LONG' | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const startBreak = (type: 'SHORT' | 'LONG') => {
    setTimerState('BREAK');
    setBreakType(type);
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

  const stopTimer = () => {
    setTimerState('IDLE');
    setSecondsElapsed(0);
    setBreakType(null);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const skipBreak = () => {
    setTimerState('IDLE');
    setSecondsElapsed(0);
    setBreakType(null);
  };

  // Render different UI based on timer state
  const renderIdleState = () => (
    <div className="text-center">
      <div className="text-6xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-8">
        {formatTime(0)}
      </div>
      
      <div className="space-y-4">
        <button
          onClick={startFocusSession}
          disabled={!activeTask}
          className="w-full px-8 py-4 bg-brand-500 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {activeTask ? 'Mulai Sesi Fokus' : 'Pilih Tugas Terlebih Dahulu'}
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={() => startBreak('SHORT')}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Mulai Istirahat Pendek
          </button>
          <button
            onClick={() => startBreak('LONG')}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Mulai Istirahat Panjang
          </button>
        </div>
      </div>
      
      {sessionCount > 0 && (
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          Sesi fokus hari ini: {sessionCount}
        </div>
      )}
    </div>
  );

  const renderFocusingState = () => (
    <div className="text-center">
      {activeTask && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sedang Bekerja
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTask.title}
          </p>
        </div>
      )}
      
      <div className="text-6xl font-mono font-bold text-brand-500 mb-8">
        {formatTime(secondsElapsed)}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
        <div 
          className="bg-brand-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${(secondsElapsed / FOCUS_DURATION) * 100}%` }}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={pauseTimer}
          className="flex-1 px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Jeda
        </button>
        <button
          onClick={stopTimer}
          className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
        >
          Hentikan
        </button>
      </div>
    </div>
  );

  const renderPausedState = () => (
    <div className="text-center">
      {activeTask && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Sesi Dijeda
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {activeTask.title}
          </p>
        </div>
      )}
      
      <div className="text-6xl font-mono font-bold text-yellow-500 mb-8">
        {formatTime(secondsElapsed)}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
        <div 
          className="bg-yellow-500 h-2 rounded-full"
          style={{ width: `${(secondsElapsed / FOCUS_DURATION) * 100}%` }}
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={resumeTimer}
          className="flex-1 px-6 py-3 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors"
        >
          Lanjutkan
        </button>
        <button
          onClick={stopTimer}
          className="flex-1 px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
        >
          Hentikan
        </button>
      </div>
    </div>
  );

  const renderBreakTimeState = () => (
    <div className="text-center">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
          🎉 Sesi Fokus Selesai!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Selamat! Anda telah menyelesaikan sesi fokus 25 menit.
        </p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={() => startBreak('SHORT')}
          className="w-full px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
        >
          Mulai Istirahat Pendek (5 menit)
        </button>
        
        <button
          onClick={() => startBreak('LONG')}
          className="w-full px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          Mulai Istirahat Panjang (15 menit)
        </button>
        
        <button
          onClick={skipBreak}
          className="w-full px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Lewati Istirahat
        </button>
      </div>
    </div>
  );

  const renderBreakState = () => (
    <div className="text-center">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Istirahat {breakType === 'SHORT' ? 'Pendek' : 'Panjang'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {breakType === 'SHORT' ? '5 menit' : '15 menit'}
        </p>
      </div>
      
      <div className="text-6xl font-mono font-bold text-green-500 mb-8">
        {formatTime(secondsElapsed)}
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-1000"
          style={{ 
            width: `${(secondsElapsed / (breakType === 'SHORT' ? SHORT_BREAK_DURATION : LONG_BREAK_DURATION)) * 100}%` 
          }}
        />
      </div>
      
      <button
        onClick={stopTimer}
        className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
      >
        Hentikan Istirahat
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-gray-100">
        Pomodoro Timer
      </h3>
      
      {timerState === 'IDLE' && renderIdleState()}
      {timerState === 'FOCUSING' && renderFocusingState()}
      {timerState === 'PAUSED' && renderPausedState()}
      {timerState === 'BREAK_TIME' && renderBreakTimeState()}
      {timerState === 'BREAK' && renderBreakState()}
    </div>
  );
} 