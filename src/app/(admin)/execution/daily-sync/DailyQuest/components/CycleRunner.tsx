"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, PictureInPicture2, Volume2 } from 'lucide-react';
import { useTimer } from '@/stores/timerStore';
import { getFocusDuration, getTotalSeconds, getProgress, formatTime } from '@/lib/timerDisplay';
import { useDocumentPiP } from '@/hooks/useDocumentPiP';
import { isTimerDisabled } from '@/lib/timerDevUtils';
import FloatingTimer from '../../PomodoroTimer/components/FloatingTimer';
import JournalFields from '../../Journal/JournalFields';
import SoundSelector from '../../PomodoroTimer/components/SoundSelector';
import { classifyCycle, cycleLabel } from '../utils/workCycles';
import { CYCLES } from '../utils/dailyFocus';
import { selectStyle } from '../utils/selectStyle';
import type { DailyPlanItem } from '@/types/daily-plan';

const BREAK_LABEL = { SHORT: 'Istirahat 5', MEDIUM: 'Istirahat 10', LONG: 'Istirahat 15' } as const;

/**
 * Baris Siklus Kerja yang sedang berjalan, membesar jadi panel (app-mgsb): task (bisa diganti), hitung mundur,
 * jeda/stop, durasi, +30 mnt, dan catatan teks bebas. Saat break, catatan disorot: "1 menit: tulis perkembangan".
 */
export default function CycleRunner({ tasks, fixedDuration = false }: { tasks: DailyPlanItem[]; /** Alternatif 25/5: durasi tidak bisa diubah. */ fixedDuration?: boolean }) {
  const {
    timerState, secondsElapsed, activeTask, lastActiveTask, breakType, cycleNotes, lastCycle, notesStatus,
    pauseTimer, resumeTimer, stopTimer, setFocusMinutes, switchActiveTask, setCycleNotes,
  } = useTimer();
  const pip = useDocumentPiP();
  const [showSound, setShowSound] = useState(false);
  const [breakSave, setBreakSave] = useState<'idle' | 'saving' | 'saved'>('idle');
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const isBreak = timerState === 'BREAK';
  const isPaused = timerState === 'PAUSED';
  const focusSeconds = getFocusDuration(activeTask, lastActiveTask);
  const total = getTotalSeconds(timerState, breakType, focusSeconds);
  const remaining = Math.max(0, total - secondsElapsed);
  const progress = getProgress(timerState, secondsElapsed, total);
  const focusMinutes = Math.round(focusSeconds / 60);
  const notes = isBreak ? lastCycle?.notes ?? '' : cycleNotes;

  // Kotak catatan tumbuh mengikuti isi, tanpa scroll sendiri.
  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [notes]);

  const taskOptions = tasks.map((t) => ({ id: t.item_id, title: t.title || 'Task', item_type: t.item_type }));
  if (activeTask && !taskOptions.some((t) => t.id === activeTask.id)) {
    taskOptions.unshift({ id: activeTask.id, title: activeTask.title, item_type: activeTask.item_type });
  }
  const durationOptions: number[] = [...CYCLES.map((c) => c.focus as number), ...(process.env.NODE_ENV === 'development' ? [1] : [])];
  if (!durationOptions.includes(focusMinutes)) durationOptions.unshift(focusMinutes);


  return (
    <div
      data-testid="cycle-runner"
      className={`rounded-xl p-3 ${isBreak ? 'bg-green-50 dark:bg-green-950/30' : 'bg-brand-50 dark:bg-brand-500/15'}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex-shrink-0 whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold tabular-nums text-white ${isBreak ? 'bg-green-500' : 'bg-brand-500'}`}>
          {isBreak && breakType ? BREAK_LABEL[breakType] : cycleLabel(classifyCycle(focusMinutes))}
        </span>
        {isBreak ? (
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">Break — jauh dari layar sebentar</span>
        ) : (
          <select
            aria-label="Task siklus ini"
            data-testid="cycle-task-select"
            value={activeTask?.id ?? ''}
            onChange={(e) => {
              const t = taskOptions.find((o) => o.id === e.target.value);
              if (t) switchActiveTask(t);
            }}
            className="min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent py-1 text-sm font-semibold text-gray-900 hover:border-brand-200 focus:border-brand-400 focus:outline-none dark:text-white"
          >
            {taskOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={() => setShowSound(true)}
          title="Suara fokus"
          data-testid="cycle-sound"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-white/70 dark:hover:bg-white/10"
        >
          <Volume2 className="h-4 w-4" />
        </button>
        {pip.supported && (
          <button
            type="button"
            onClick={() => (pip.isOpen ? pip.close() : pip.open())}
            title="Timer melayang"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-white/70 dark:hover:bg-white/10"
          >
            <PictureInPicture2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className={`text-4xl font-bold tabular-nums ${isPaused ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {formatTime(remaining)}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {!isBreak && (
            <>
              {!fixedDuration && <select
                aria-label="Durasi siklus"
                data-testid="cycle-duration-select"
                value={focusMinutes}
                onChange={(e) => setFocusMinutes(Number(e.target.value))}
                style={selectStyle}
                className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold tabular-nums text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {durationOptions.map((m) => (
                  // Durasi yang sudah terlewati tidak bisa dipilih: siklus akan langsung selesai dengan menit yang salah.
                  <option key={m} value={m} disabled={m !== focusMinutes && m * 60 <= secondsElapsed}>{m} mnt</option>
                ))}
              </select>}
              <button
                type="button"
                data-testid="cycle-pause"
                onClick={isPaused ? resumeTimer : pauseTimer}
                aria-label={isPaused ? 'Lanjutkan' : 'Jeda'}
                className="rounded-lg bg-brand-500 p-2 text-white hover:bg-brand-600"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
            </>
          )}
          <button
            type="button"
            data-testid="cycle-stop"
            onClick={stopTimer}
            aria-label={isBreak ? 'Lewati break' : 'Hentikan siklus'}
            title={isBreak ? 'Lewati break' : 'Hentikan siklus'}
            className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ${isBreak ? 'bg-green-500' : 'bg-brand-500'}`}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>

      {isTimerDisabled() && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Timer dimatikan di dev (NEXT_PUBLIC_ENABLE_TIMER_DEV=false)</p>
      )}

      {isBreak && lastCycle?.logId ? (
        // One Minute Journal saat break: dua pertanyaan buku, langsung ke log siklus tadi.
        <div className="mt-3 rounded-lg ring-2 ring-green-300 p-3 dark:ring-green-700" data-testid="cycle-break-journal">
          <p className="mb-2 text-xs font-semibold text-green-700 dark:text-green-400">1 menit: One Minute Journal siklus tadi</p>
          <JournalFields logId={lastCycle.logId} whatDone={lastCycle.notes} whatThink={null} onStatus={setBreakSave} />
          <p className="mt-1 text-right text-xs text-gray-400" data-testid="cycle-break-journal-status">
            {breakSave === 'saving' ? 'Menyimpan…' : breakSave === 'saved' ? 'Tersimpan' : ''}
          </p>
        </div>
      ) : (
      <>
      <textarea
          ref={notesRef}
          rows={2}
          value={notes}
          onChange={(e) => setCycleNotes(e.target.value)}
          data-testid="cycle-notes"
          aria-label="Catatan siklus"
          placeholder={isBreak ? '1 menit: apa yang selesai di siklus tadi?' : 'Apa yang sedang dikerjakan? Catat progres, ide, atau hambatan…'}
          className={`mt-3 w-full resize-none overflow-hidden rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-gray-100 ${
            isBreak
              ? 'border-green-400 ring-2 ring-green-300 focus:ring-green-400 dark:border-green-600'
              : 'border-gray-200 focus:border-brand-400 focus:ring-brand-500/20 dark:border-gray-700'
          }`}
        />
  
        <p className="mt-1 text-right text-xs text-gray-400" data-testid="cycle-notes-status">
          {notesStatus === 'saving' ? 'Menyimpan…' : notesStatus === 'saved' ? 'Tersimpan' : ''}
        </p>
      </>
      )}

      {pip.pipWindow && <FloatingTimer pipWindow={pip.pipWindow} />}
      <SoundSelector isOpen={showSound} onClose={() => setShowSound(false)} />
    </div>
  );
}
