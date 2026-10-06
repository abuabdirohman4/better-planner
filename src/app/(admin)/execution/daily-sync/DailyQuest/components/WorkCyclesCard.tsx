"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useActivityLogs } from '../../ActivityLog/hooks/useActivityLogs';
import { buildWorkCycles, cycleLabel, ROUTINE_SLOTS, type FilledCycle } from '../utils/workCycles';
import { kindLabel } from '../utils/dailyFocus';
import DailyCardShell from './DailyCardShell';

const timeWIB = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

const formatMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}j${m % 60 ? `${m % 60}m` : ''}` : `${m}m`);

const gridCls = 'grid grid-cols-2 gap-2.5 md:grid-cols-4';

function Tile({ label, emptyHint = 'Belum ada', cycle, variant }: { label: string; emptyHint?: string; cycle: FilledCycle | null; variant: 'hfg' | 'routine' | 'extra' }) {
  if (!cycle) {
    return (
      <div className="flex min-h-[104px] min-w-0 flex-col gap-1 rounded-xl border-[1.5px] border-dashed border-gray-200 p-3 text-gray-400 dark:border-gray-700 dark:text-gray-500">
        <span className="text-xl font-bold tabular-nums">{label}</span>
        <span className="text-xs">{emptyHint}</span>
      </div>
    );
  }
  const tone =
    variant === 'hfg'
      ? 'bg-brand-700 text-white'
      : variant === 'routine'
        ? 'bg-brand-500 text-white'
        : 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300';
  return (
    <div className={`relative flex min-w-0 flex-col gap-1 rounded-xl p-3 ${variant === 'extra' ? 'min-h-[76px]' : 'min-h-[104px]'} ${tone}`}>
      {variant === 'extra' && <span className="absolute right-3 top-2 text-sm font-bold" aria-hidden>+</span>}
      {cycle.taskType && (
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-85">{kindLabel(cycle.taskType)}</span>
      )}
      <span className={`font-bold tabular-nums ${variant === 'extra' ? 'text-base' : 'text-xl'}`}>{cycleLabel(cycle.cls)}</span>
      <span className="line-clamp-2 text-xs leading-snug" title={cycle.title}>{cycle.title}</span>
      <span className="mt-auto text-[11px] tabular-nums opacity-85">{timeWIB(cycle.start)}–{timeWIB(cycle.end)}</span>
    </div>
  );
}

/** Siklus Kerja hari itu (app-8438): 1 HFG 90/15 + 3 × 60/10, sisanya "Tambahan". Terisi otomatis dari timer. */
export default function WorkCyclesCard({ date }: { date: string }) {
  const { logs } = useActivityLogs({ date });
  const c = buildWorkCycles(logs);
  const extra = c.routine.slice(ROUTINE_SLOTS);

  return (
    <DailyCardShell
      testId="daily-sync-work-cycles"
      icon={<RefreshCw className="h-5 w-5" />}
      title="Siklus Kerja"
      hint="Terisi otomatis dari timer"
      action={
        <span className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {c.mainDone}/{1 + ROUTINE_SLOTS}{extra.length > 0 ? ` +${extra.length}` : ''}
        </span>
      }
    >
      <div className={gridCls}>
        <Tile label="90/15" emptyHint="Pagi, untuk HFG" cycle={c.hfg} variant="hfg" />
        {Array.from({ length: ROUTINE_SLOTS }, (_, i) => (
          <Tile key={i} label="60/10" cycle={c.routine[i] ?? null} variant="routine" />
        ))}
      </div>

      {extra.length > 0 && (
        <div data-testid="work-cycles-extra">
          <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Tambahan</p>
          <div className={gridCls}>
            {extra.map((cycle) => (
              <Tile key={cycle.id} label="60/10" cycle={cycle} variant="extra" />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4" data-testid="work-cycles-short">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          25/5 · {c.short.count === 0 ? 'belum ada' : `${c.short.count} siklus · ${formatMinutes(c.short.minutes)}`}
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
    </DailyCardShell>
  );
}
