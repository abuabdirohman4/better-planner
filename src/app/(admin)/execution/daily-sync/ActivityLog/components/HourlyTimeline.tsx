'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../actions/calendar/logic';
import { getLocalDateString } from '@/lib/dateUtils';
import { getHourlyNotes, saveHourlyNote } from '../actions/hourly-notes/actions';
import { hourWIB, visibleHours } from '../actions/hourly-notes/logic';

export interface CycleChip {
  id: string;
  hour: number;
  title: string;
  minutes: number;
  live?: boolean;
}

interface HourlyTimelineProps {
  date: string;
  chips: CycleChip[];
  /** Rencana (task_schedules) per jam, tampil samar di baris yang belum diisi. */
  plans: Record<number, string>;
  onDeleteChip: (logId: string) => void;
  /** Acara Google Calendar (read-only). */
  events: CalendarEvent[];
  startHour: number;
  endHour: number;
}

/** Chip siklus; klik = tawarkan hapus (log salah tetap bisa dibuang). Siklus yang berjalan tidak bisa dihapus. */
function Chip({ chip, onDelete }: { chip: CycleChip; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <span className="flex items-center gap-1 text-[11px]">
        <button type="button" onClick={() => onDelete(chip.id)} className="rounded-full bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700">
          Hapus
        </button>
        <button type="button" onClick={() => setConfirm(false)} className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700 dark:bg-gray-600 dark:text-gray-200">
          Batal
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      data-testid="hour-cycle-chip"
      disabled={chip.live}
      onClick={() => setConfirm(true)}
      title={`${chip.title} · ${chip.minutes} menit`}
      className={`max-w-[10rem] truncate rounded-full px-2 py-0.5 text-[11px] font-medium ${chip.live
        ? 'animate-pulse bg-brand-500 text-white'
        : 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-500/20 dark:text-brand-300'}`}
    >
      {chip.title} · {chip.minutes}m
    </button>
  );
}

const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;

function HourRow({ hour, saved, plan, chips, events, isNow, onSave, onDeleteChip }: {
  hour: number;
  saved: string;
  plan?: string;
  chips: CycleChip[];
  isNow: boolean;
  events: CalendarEvent[];
  onSave: (hour: number, content: string) => void;
  onDeleteChip: (logId: string) => void;
}) {
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);

  const commit = () => {
    if (value.trim() !== saved) onSave(hour, value);
  };

  return (
    <li
      data-testid={`hour-row-${hour}`}
      className={`flex items-center gap-2 border-b border-gray-100 py-1 last:border-0 dark:border-gray-700 ${isNow ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''}`}
    >
      <span className={`w-11 flex-shrink-0 text-xs tabular-nums ${isNow ? 'font-semibold text-brand-600' : 'text-gray-400'}`}>
        {pad(hour)}
      </span>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder={plan ?? ''}
        aria-label={`Catatan jam ${pad(hour)}`}
        className="min-w-0 flex-1 rounded bg-transparent px-1.5 py-1 text-sm text-gray-900 placeholder:text-gray-400 placeholder:italic focus:bg-gray-50 focus:outline-none dark:text-gray-100 dark:focus:bg-gray-700"
      />
      {events.length > 0 && (
        <span
          data-testid="hour-calendar-event"
          title={events.map(e => e.title).join(' · ')}
          className="flex min-w-0 max-w-[40%] flex-shrink items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400"
        >
          <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" aria-label="Google Calendar" />
          <span className="truncate">{events.map(e => e.title).join(' · ')}</span>
        </span>
      )}
      {chips.length > 0 && (
        <span className="flex max-w-[45%] flex-shrink-0 flex-wrap justify-end gap-1">
          {chips.map(c => <Chip key={c.id} chip={c} onDelete={onDeleteChip} />)}
        </span>
      )}
    </li>
  );
}

/** Timeline harian = catatan per jam yang diketik langsung; siklus timer tampil otomatis (app-6god). */
export default function HourlyTimeline({ date, chips, plans, onDeleteChip, events, startHour, endHour }: HourlyTimelineProps) {
  const { data: notes = [], mutate } = useSWR(['hourly-notes', date], () => getHourlyNotes(date), {
    revalidateOnFocus: false,
  });

  const byHour = new Map(notes.map(n => [n.hour, n.content]));
  const hours = visibleHours([
    ...notes.map(n => n.hour),
    ...chips.map(c => c.hour),
    ...Object.keys(plans).map(Number),
    ...events.map(e => e.hour),
  ], startHour, endHour);
  const nowHour = date === getLocalDateString(new Date()) ? hourWIB(new Date().toISOString()) : -1;

  const handleSave = async (hour: number, content: string) => {
    const text = content.trim();
    const next = [...notes.filter(n => n.hour !== hour), ...(text ? [{ hour, content: text }] : [])];
    mutate(next, false);
    try {
      await saveHourlyNote(date, hour, text);
    } catch {
      toast.error('Gagal menyimpan catatan jam');
      mutate();
    }
  };

  return (
    <ul data-testid="hourly-timeline">
      {hours.map(h => (
        <HourRow
          key={h}
          hour={h}
          saved={byHour.get(h) ?? ''}
          plan={plans[h]}
          chips={chips.filter(c => c.hour === h)}
          events={events.filter(e => e.hour === h)}
          isNow={h === nowHour}
          onSave={handleSave}
          onDeleteChip={onDeleteChip}
        />
      ))}
    </ul>
  );
}
