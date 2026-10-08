"use client";

import React, { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import type { ActivityLogItem } from '@/types/activity-log';
import { useActivityLogs } from '../ActivityLog/hooks/useActivityLogs';
import { classifyCycle, cycleLabel } from '../DailyQuest/utils/workCycles';
import { kindLabel } from '../DailyQuest/utils/dailyFocus';
import DailyCardShell from '../DailyQuest/components/DailyCardShell';
import BrainDumpSection from '../BrainDump/BrainDumpSection';
import JournalFields from './JournalFields';
import { groupCycles, type CycleGroup } from './groupCycles';

const timeWIB = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

/** Satu siklus: jam + jenis siklus, lalu dua isian OMJ yang diedit di tempat. */
function CycleNote({ log }: { log: ActivityLogItem }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  return (
    <li data-testid={`journal-cycle-${log.id}`}>
      <p className="mb-1.5 flex items-baseline justify-between gap-3 text-xs tabular-nums text-gray-500">
        <span>
          {timeWIB(log.start_time)}–{timeWIB(log.end_time)} · {cycleLabel(classifyCycle(log.duration_minutes))}
        </span>
        <span className="text-gray-400">{state === 'saving' ? 'Menyimpan…' : state === 'saved' ? 'Tersimpan' : ''}</span>
      </p>
      <JournalFields logId={log.id} whatDone={log.what_done} whatThink={log.what_think} onStatus={setState} compact />
    </li>
  );
}

/** Satu task: judul sekali, garis kiri berwarna menurut jenis quest, siklus-siklusnya di bawahnya. */
function TaskGroup({ group }: { group: CycleGroup }) {
  const hfg = group.taskType === 'MAIN_QUEST';
  return (
    <section
      data-testid="journal-task-group"
      className={`border-l-4 pl-4 ${hfg ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600'}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h4 className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white" title={group.title}>
          {group.title}
        </h4>
        {group.taskType && (
          <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider ${hfg ? 'text-brand-600 dark:text-brand-300' : 'text-gray-400'}`}>
            {kindLabel(group.taskType)}
          </span>
        )}
      </div>
      <ul className="space-y-4">
        {group.logs.map((l) => <CycleNote key={l.id} log={l} />)}
      </ul>
    </section>
  );
}

/**
 * Halaman kanan buku (app-2pxn): One Minute Journal per siklus hari itu, urut jam, lalu Brain Dump.
 * Catatan = activity_logs.what_done, yang juga ditulis dari panel timer (app-mgsb).
 */
export default function JournalTab({ date }: { date: string }) {
  const { logs, isLoading } = useActivityLogs({ date });
  const groups = groupCycles(logs);

  // OMJ selebar halaman (dua pertanyaan berdampingan di desktop), Brain Dump di bawahnya.
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <DailyCardShell
        testId="journal-omj"
        icon={<NotebookPen className="h-5 w-5" />}
        title="One Minute Journal"
        hint="Jurnalkan jawaban atas pertanyaan berikut setiap kali Anda selesai menjalani Siklus Kerja 90/15 dan 60/10 · tersimpan otomatis"
      >
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        ) : groups.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">Belum ada siklus hari ini</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => <TaskGroup key={g.key} group={g} />)}
          </div>
        )}
      </DailyCardShell>

      <BrainDumpSection date={date} />
    </div>
  );
}
