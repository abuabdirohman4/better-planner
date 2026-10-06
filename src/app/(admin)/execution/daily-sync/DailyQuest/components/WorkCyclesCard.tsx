"use client";

import React, { useEffect, useRef, useState } from 'react';
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
import { selectStyle } from '../utils/selectStyle';
import DailyCardShell from './DailyCardShell';
import CycleRunner from './CycleRunner';

const timeWIB = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

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

/** Dropdown kecil daftar task; memilih = siklus 25/5 langsung jalan. */
function AltPicker({ tasks, onPick, disabled }: { tasks: DailyPlanItem[]; onPick: (t: DailyPlanItem) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        data-testid="cycle-alt-start"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-40 dark:bg-brand-500/15 dark:text-brand-300"
      >
        <Play className="h-3 w-3" /> Mulai 25/5
      </button>
      {open && (
        <ul className="absolute right-0 z-20 mt-1 max-h-64 w-64 max-w-[80vw] overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {tasks.length === 0 ? (
            <li className="px-3 py-2 text-xs text-gray-500">Belum ada task di Daily Focus / Tugas Lain</li>
          ) : (
            tasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onPick(t); }}
                  className="w-full truncate px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-white/5"
                >
                  {t.title}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
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
  // Baris hanya 90/60; rencana 25 menit lama dibuang supaya indeks baris = indeks tampilan.
  const normalize = (p: CyclePlanRow[] | null) => {
    const r = (p ?? []).filter((x) => x.minutes >= 50);
    return r.length ? r : DEFAULT_CYCLE_PLAN;
  };
  const [rows, setRows] = useState<CyclePlanRow[]>(normalize(plan));
  useEffect(() => {
    setRows(normalize(plan));
  }, [plan, date]);

  const c = buildWorkCycles(logs, rows);
  const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const running = timerState === 'FOCUSING' || timerState === 'PAUSED' || timerState === 'BREAK';
  const canStart = date === todayWIB && !running;
  const runnerRow = running && cycleSlot != null && cycleSlot >= 0 && cycleSlot < c.rows.length && !c.rows[cycleSlot].done ? cycleSlot : null;
  const runnerInAlt = running && cycleSlot === -1;
  const startAlt = (t: DailyPlanItem) => {
    setCycleSlot(-1);
    startFocusSession({ id: t.item_id, title: t.title || 'Task', item_type: t.item_type, focus_duration: 25 });
  };

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
          {c.done}/{c.rows.length}
        </span>
      }
    >
      {running && runnerRow == null && !runnerInAlt && (
        <div className="mb-2">
          <CycleRunner tasks={altTasks} />
        </div>
      )}

      <div>
        {c.rows.map((row, i) =>
          row.done ? (
            <DoneRow key={i} cycle={row.done} />
          ) : i === runnerRow ? (
            <div key={i} className="py-2">
              <CycleRunner tasks={altTasks} />
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
                style={selectStyle}
                className="min-w-0 flex-1 appearance-none truncate rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{altTasks.length ? 'Pilih task' : 'Belum ada Daily Focus'}</option>
                {tasks.length > 0 && (
                  <optgroup label="Daily Focus">
                    {tasks.map((t) => (
                      <option key={t.id} value={t.item_id}>{t.title}</option>
                    ))}
                  </optgroup>
                )}
                {otherTasks.length > 0 && (
                  <optgroup label="Tugas Lain">
                    {otherTasks.map((t) => (
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
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800" data-testid="work-cycles-short">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Alternatif 25/5{c.short.count > 0 ? ` · ${c.short.count} siklus · ${formatMinutes(c.short.minutes)}` : ''}
          </p>
          <AltPicker tasks={altTasks.filter((t) => t.status !== 'DONE')} onPick={startAlt} disabled={!canStart} />
        </div>
        {runnerInAlt && (
          <div className="mt-2">
            <CycleRunner tasks={altTasks} fixedDuration />
          </div>
        )}
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
    </DailyCardShell>
  );
}
