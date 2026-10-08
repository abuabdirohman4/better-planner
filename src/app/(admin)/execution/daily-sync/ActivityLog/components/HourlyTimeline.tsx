'use client';
import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { CalendarDays } from 'lucide-react';
import type { CalendarEvent } from '../actions/calendar/logic';
import { getLocalDateString } from '@/lib/dateUtils';
import { getHourlyNotes, saveHourlyNote } from '../actions/hourly-notes/actions';
import { hourWIB, layoutBlocks, minuteOfDayWIB, visibleHours } from '../actions/hourly-notes/logic';

export interface CycleChip {
  id: string;
  hour: number;
  /** Waktu mulai (UTC ISO); blok digambar dari menit ini sepanjang `minutes`. */
  start: string;
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

/** Tinggi satu baris jam (px); posisi blok siklus dihitung dari sini. */
const ROW_H = 36;
/** Lebar satu jalur blok (% lebar timeline). */
const LANE_PCT = 34;

const pad = (h: number) => `${String(h).padStart(2, '0')}:00`;
const clock = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Blok siklus memanjang sesuai menit mulai-selesai; klik = tawarkan hapus. Siklus yang berjalan tidak bisa dihapus. */
function CycleBlock({ chip, top, height, lane, onDelete }: {
  chip: CycleChip; top: number; height: number; lane: number; onDelete: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const startMin = minuteOfDayWIB(chip.start);
  const range = `${clock(startMin)}–${clock(startMin + chip.minutes)}`;
  return (
    <div
      data-testid="hour-cycle-chip"
      title={`${chip.title} · ${range} · ${chip.minutes} menit`}
      className={`absolute overflow-hidden rounded-md px-2 py-0.5 text-[11px] leading-tight ${chip.live
        ? 'animate-pulse bg-brand-500 text-white'
        : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'}`}
      style={{ top, height, right: `${lane * (LANE_PCT + 1)}%`, width: `${LANE_PCT}%`, pointerEvents: 'auto' }}
    >
      {confirm ? (
        <span className="flex items-center gap-1 py-0.5">
          <button type="button" onClick={() => onDelete(chip.id)} className="rounded bg-red-600 px-1.5 font-medium text-white hover:bg-red-700">Hapus</button>
          <button type="button" onClick={() => setConfirm(false)} className="rounded bg-gray-200 px-1.5 text-gray-700 dark:bg-gray-600 dark:text-gray-200">Batal</button>
        </span>
      ) : (
        <button type="button" disabled={chip.live} onClick={() => setConfirm(true)} className="block h-full w-full text-left">
          <span className="block truncate font-medium">{chip.title}</span>
          {height >= 36 && <span className="block truncate opacity-75">{range} · {chip.minutes}m</span>}
        </button>
      )}
    </div>
  );
}

function HourRow({ hour, saved, plan, events, isNow, reserve, onSave }: {
  hour: number;
  saved: string;
  plan?: string;
  events: CalendarEvent[];
  isNow: boolean;
  /** Ruang kanan (%) yang dipakai blok siklus. */
  reserve: number;
  onSave: (hour: number, content: string) => void;
}) {
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);

  const commit = () => {
    if (value.trim() !== saved) onSave(hour, value);
  };

  return (
    <li
      data-testid={`hour-row-${hour}`}
      className={`flex items-center gap-2 border-b border-gray-100 last:border-b-0 dark:border-gray-700 ${isNow ? 'bg-brand-50/60 dark:bg-brand-500/10' : ''}`}
      style={{ height: ROW_H, paddingRight: `${reserve}%` }}
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
          className="flex min-w-0 max-w-[40%] flex-shrink items-center gap-1 truncate pr-1 text-xs text-gray-500 dark:text-gray-400"
        >
          <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" aria-label="Google Calendar" />
          <span className="truncate">{events.map(e => e.title).join(' · ')}</span>
        </span>
      )}
    </li>
  );
}

/** Timeline harian = catatan per jam yang diketik langsung; siklus timer tampil otomatis sebagai blok (app-6god). */
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

  // Blok siklus: posisi dari menit WIB relatif ke baris pertama; lewat tengah malam dipotong di baris terakhir.
  const firstMin = hours[0] * 60;
  const endMin = (hours[hours.length - 1] + 1) * 60;
  const blocks = chips.map(c => {
    const start = minuteOfDayWIB(c.start);
    return { id: c.id, start, minutes: Math.max(1, Math.min(c.minutes, endMin - start)) };
  });
  const { lanes, lane } = layoutBlocks(blocks);
  const reserve = lanes * (LANE_PCT + 1);

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
    <div className="relative">
      <ul data-testid="hourly-timeline">
        {hours.map(h => (
          <HourRow
            key={h}
            hour={h}
            saved={byHour.get(h) ?? ''}
            plan={plans[h]}
            events={events.filter(e => e.hour === h)}
            isNow={h === nowHour}
            reserve={reserve}
            onSave={handleSave}
          />
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-0">
        {chips.map((c, i) => {
          const b = blocks[i];
          return (
            <CycleBlock
              key={c.id}
              chip={c}
              top={((b.start - firstMin) / 60) * ROW_H + 1}
              height={Math.max(18, (b.minutes / 60) * ROW_H - 2)}
              lane={lane[c.id]}
              onDelete={onDeleteChip}
            />
          );
        })}
      </div>
    </div>
  );
}
