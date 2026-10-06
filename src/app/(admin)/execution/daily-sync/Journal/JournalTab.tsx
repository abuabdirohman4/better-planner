"use client";

import React, { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import type { ActivityLogItem } from '@/types/activity-log';
import { useActivityLogs } from '../ActivityLog/hooks/useActivityLogs';
import { classifyCycle, cycleLabel, type CycleClass } from '../DailyQuest/utils/workCycles';
import DailyCardShell from '../DailyQuest/components/DailyCardShell';
import BrainDumpSection from '../BrainDump/BrainDumpSection';
import JournalFields from './JournalFields';

const timeWIB = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

/** Satu siklus: task + jam + dua isian OMJ yang diedit di tempat. */
function CycleNote({ log }: { log: ActivityLogItem }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  return (
    <li className="border-b border-gray-100 py-3 last:border-0 dark:border-gray-800" data-testid={`journal-cycle-${log.id}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white" title={log.task_title ?? ''}>
          {log.task_title || 'Tanpa judul'}
        </span>
        <span className="flex-shrink-0 text-xs tabular-nums text-gray-400">
          {state === 'saving' ? 'menyimpan… · ' : state === 'saved' ? 'tersimpan · ' : ''}
          {timeWIB(log.start_time)}–{timeWIB(log.end_time)}
        </span>
      </div>
      <JournalFields logId={log.id} whatDone={log.what_done} whatThink={log.what_think} onStatus={setState} />
    </li>
  );
}

const GROUPS: { cls: CycleClass; title: string }[] = [
  { cls: 90, title: '90/15' },
  { cls: 60, title: '60/10' },
];

/**
 * Halaman kanan buku (app-2pxn): One Minute Journal per siklus hari itu, lalu Brain Dump.
 * Catatan = activity_logs.what_done, yang juga ditulis dari panel timer (app-mgsb).
 */
export default function JournalTab({ date }: { date: string }) {
  const { logs, isLoading } = useActivityLogs({ date });
  const focus = logs
    .filter((l) => l.type === 'FOCUS')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const byClass = (cls: CycleClass) => focus.filter((l) => classifyCycle(l.duration_minutes) === cls);
  const short = byClass(25);

  return (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-6">
      <DailyCardShell
        testId="journal-omj"
        icon={<NotebookPen className="h-5 w-5" />}
        title="One Minute Journal"
        hint="Dua pertanyaan singkat tiap siklus · tersimpan otomatis"
      >
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ) : focus.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Belum ada siklus hari ini</p>
        ) : (
          <div className="space-y-4">
            {GROUPS.map(({ cls, title }) => {
              const list = byClass(cls);
              if (!list.length) return null;
              return (
                <section key={cls}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {title} · {list.length} siklus
                  </p>
                  <ul>
                    {list.map((l) => <CycleNote key={l.id} log={l} />)}
                  </ul>
                </section>
              );
            })}
            {short.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {cycleLabel(25)} · {short.length} siklus
                </summary>
                <ul>
                  {short.map((l) => <CycleNote key={l.id} log={l} />)}
                </ul>
              </details>
            )}
          </div>
        )}
      </DailyCardShell>

      <BrainDumpSection date={date} />
    </div>
  );
}
