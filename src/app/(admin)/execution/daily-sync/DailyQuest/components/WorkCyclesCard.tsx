"use client";

import React, { useEffect, useState } from 'react';
import { RefreshCw, Play, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { DailyPlanItem } from '@/types/daily-plan';
import { useTimer } from '@/stores/timerStore';
import { dailySyncKeys, swrMutate } from '@/lib/swr';
import { useActivityLogs } from '../../ActivityLog/hooks/useActivityLogs';
import { saveCyclePlan } from '../actions';
import {
  buildWorkCycles, classifyCycle, cycleLabel, DEFAULT_CYCLE_PLAN, type CyclePlanRow, type FilledCycle,
} from '../utils/workCycles';
import DailyCardShell from './DailyCardShell';
import CycleRunner from './CycleRunner';

const timeWIB = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

/** Pilihan task baris siklus: yang belum selesai, plus yang sudah terpilih di baris itu. */
const openTasks = (list: DailyPlanItem[], selected: string | null) =>
  list.filter((t) => t.status !== 'DONE' || t.item_id === selected);

const formatMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}j${m % 60 ? `${m % 60}m` : ''}` : `${m}m`);

function Box({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 ${
        done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
    </span>
  );
}

function DoneRow({ cycle }: { cycle: FilledCycle }) {
  return (
    <div className="flex items-center gap-3 py-2" data-testid="cycle-row-done">
      <Box done />
      <span className="w-12 flex-shrink-0 text-sm font-semibold tabular-nums text-gray-500">{cycleLabel(cycle.cls)}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200" title={cycle.title}>{cycle.title}</span>
      <span className="flex-shrink-0 text-xs tabular-nums text-gray-400">{timeWIB(cycle.start)}–{timeWIB(cycle.end)}</span>
    </div>
  );
}

interface WorkCyclesCardProps {
  date: string;
  /** Pilihan task baris 90/60 = Daily Focus hari itu. */
  tasks: DailyPlanItem[];
  /** Tugas Lain: grup kedua di pilihan baris; Alternatif 25/5 = Daily Focus + Tugas Lain. */
  otherTasks: DailyPlanItem[];
  /** daily_plans.cycle_plan; null = bawaan 90 + 3x60. */
  plan: CyclePlanRow[] | null;
}

/**
 * Siklus Kerja seperti buku (app-8438, app-mgsb): baris "☐ 90/15 ……", isi task dari Daily Focus, ▶ menjalankan
 * timer dan baris itu membesar jadi panel. Kotak tercentang otomatis dari log timer.
 */
export default function WorkCyclesCard({ date, tasks, otherTasks, plan }: WorkCyclesCardProps) {
  const altTasks = [...tasks, ...otherTasks];
  const { logs } = useActivityLogs({ date });
  const { timerState, startFocusSession, cycleSlot, setCycleSlot } = useTimer();
  const normalize = (p: CyclePlanRow[] | null) => (p?.length ? p : DEFAULT_CYCLE_PLAN);
  const [rows, setRows] = useState<CyclePlanRow[]>(normalize(plan));
  useEffect(() => {
    setRows(normalize(plan));
  }, [plan, date]);

  const c = buildWorkCycles(logs, rows);
  const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const running = timerState === 'FOCUSING' || timerState === 'PAUSED' || timerState === 'BREAK';
  const canStart = date === todayWIB && !running;
  const runnerRow = running && cycleSlot != null && cycleSlot >= 0 && cycleSlot < c.rows.length && !c.rows[cycleSlot].done ? cycleSlot : null;

  const save = async (next: CyclePlanRow[]) => {
    setRows(next);
    try {
      await saveCyclePlan(date, next);
      await swrMutate(dailySyncKeys.dailyPlan(date));
    } catch {
      toast.error('Gagal menyimpan rencana siklus');
    }
  };
  const setItem = (i: number, itemId: string | null) => save(rows.map((r, j) => (j === i ? { ...r, item_id: itemId } : r)));
  const addRow = (minutes: number) => save([...rows, { minutes, item_id: null }]);
  const removeRow = (i: number) => save(rows.filter((_, j) => j !== i));

  const play = (i: number) => {
    const row = rows[i];
    const t = altTasks.find((x) => x.item_id === row.item_id);
    if (!t) return;
    setCycleSlot(i);
    startFocusSession({ id: t.item_id, title: t.title || 'Task', item_type: t.item_type, focus_duration: row.minutes });
  };

  return (
    <DailyCardShell
      testId="daily-sync-work-cycles"
      icon={<RefreshCw className="h-5 w-5" />}
      title="Siklus Kerja"
      hint="Ritme kerja, bukan to-do — isi task, lalu ▶"
      action={
        <span className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {c.done}/{c.rows.filter((r) => r.minutes >= 50).length}
        </span>
      }
    >
      {running && runnerRow == null && (
        <div className="mb-2">
          <CycleRunner tasks={altTasks} />
        </div>
      )}

      <div>
        {c.rows.map((row, i) =>
          row.done && row.minutes < 50 ? null : row.done ? (
            <DoneRow key={i} cycle={row.done} />
          ) : i === runnerRow ? (
            <div key={i} className="py-2">
              <CycleRunner tasks={altTasks} fixedDuration={row.minutes < 50} />
            </div>
          ) : (
            <div key={i} className="flex items-center gap-3 py-2" data-testid={`cycle-row-${i}`}>
              <Box done={false} />
              <span className="w-12 flex-shrink-0 text-sm font-semibold tabular-nums text-gray-700 dark:text-gray-200">
                {cycleLabel(classifyCycle(row.minutes))}
              </span>
              <select
                aria-label={`Task siklus ${i + 1}`}
                data-testid={`cycle-row-select-${i}`}
                value={row.item_id ?? ''}
                onChange={(e) => setItem(i, e.target.value || null)}
                className="min-w-0 flex-1 appearance-none truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{altTasks.length ? 'Pilih task' : 'Belum ada Daily Focus'}</option>
                {openTasks(tasks, row.item_id).length > 0 && (
                  <optgroup label="Daily Focus">
                    {openTasks(tasks, row.item_id).map((t) => (
                      <option key={t.id} value={t.item_id}>{t.title}</option>
                    ))}
                  </optgroup>
                )}
                {openTasks(otherTasks, row.item_id).length > 0 && (
                  <optgroup label="Tugas Lain">
                    {openTasks(otherTasks, row.item_id).map((t) => (
                      <option key={t.id} value={t.item_id}>{t.title}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                data-testid={`cycle-row-play-${i}`}
                onClick={() => play(i)}
                disabled={!canStart || !row.item_id}
                aria-label="Mulai siklus"
                title={date !== todayWIB ? 'Siklus hanya bisa dimulai hari ini' : running ? 'Ada siklus yang sedang berjalan' : 'Mulai siklus'}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-opacity hover:bg-brand-600 disabled:opacity-30"
              >
                <Play className="h-4 w-4" />
              </button>
              {i >= DEFAULT_CYCLE_PLAN.length && (
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  aria-label="Hapus baris siklus"
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ),
        )}
        {c.extra.map((cycle) => (
          <DoneRow key={cycle.id} cycle={cycle} />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="cycle-add-60"
          onClick={() => addRow(60)}
          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300"
        >
          + Tambah 60/10
        </button>
        <button
          type="button"
          data-testid="cycle-add-25"
          onClick={() => addRow(25)}
          className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300"
        >
          + Tambah 25/5
        </button>
      </div>

      {c.short.count > 0 && (
      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800" data-testid="work-cycles-short">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Alternatif 25/5 · {c.short.count} siklus · {formatMinutes(c.short.minutes)}
        </p>
        {c.short.tasks.length > 0 && (
          <ul className="mt-2 grid gap-x-6 gap-y-1.5 md:grid-cols-2">
            {c.short.tasks.map((t) => (
              <li key={t.title} className="flex min-w-0 items-center gap-2.5 text-sm">
                <span className="flex w-10 shrink-0 items-center gap-1" aria-label={`${t.count} siklus`}>
                  {t.count <= 4 ? (
                    Array.from({ length: t.count }, (_, i) => <span key={i} className="h-2 w-2 rounded-full bg-brand-500" />)
                  ) : (
                    <span className="text-xs font-semibold tabular-nums text-brand-600 dark:text-brand-300">{t.count}×</span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200" title={t.title}>{t.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">{formatMinutes(t.minutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      )}
    </DailyCardShell>
  );
}
