"use client";

import React from 'react';
import Link from 'next/link';
import { Sunrise, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDailySyncHabits } from '../hooks/useDailySyncHabits';
import DailyCardShell from './DailyCardShell';

/**
 * Daily Rutin ala buku: 4 kotak pilar (Tubuh · Pikiran · Spiritual · SDC). Kotak tercentang otomatis
 * bila >=1 habit pilar itu selesai; yang diklik hanya chip habit (habit_completions) — app-fj81.
 */
export default function DailyRitualCard({ selectedDate }: { selectedDate: string }) {
  const { date, pillars, isCompleted, toggleCompletion } = useDailySyncHabits(selectedDate);

  const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isFuture = date > todayWIB;
  // SDC menunggu fitur SDC tersendiri (tabelnya sudah ada): tampil nonaktif, tidak dihitung.
  const DISABLED_PILLARS = ['sdc'];
  const active = pillars.filter((p) => !DISABLED_PILLARS.includes(p.pillar));
  const touched = active.filter((p) => p.isDone).length;

  const toggle = async (habitId: string) => {
    try {
      await toggleCompletion(habitId, date);
    } catch {
      toast.error('Gagal memperbarui kebiasaan');
    }
  };

  return (
    <DailyCardShell
      testId="daily-sync-ritual-section"
      icon={<Sunrise className="h-5 w-5" />}
      title="Daily Ritual"
      hint="Ritual pagi — 60 menit pertama setelah bangun"
      action={
        <span className="whitespace-nowrap rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold tabular-nums text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {touched}/{active.length} pilar
        </span>
      }
    >
      <ul>
        {pillars.map((block) => DISABLED_PILLARS.includes(block.pillar) ? (
          <li
            key={block.pillar}
            data-testid={`ritual-pillar-${block.pillar}`}
            aria-disabled
            className="flex items-center gap-3 py-2.5 opacity-50 last:pb-0"
          >
            <span className="h-6 w-6 flex-shrink-0 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600" aria-hidden />
            <span className="w-20 flex-shrink-0 text-sm font-semibold text-gray-500">{block.label}</span>
            <span className="text-xs text-gray-400">Segera hadir — terhubung ke fitur SDC</span>
          </li>
        ) : (
          <li
            key={block.pillar}
            data-testid={`ritual-pillar-${block.pillar}`}
            data-done={block.isDone}
            className="flex items-start gap-3 border-b border-gray-100 py-2.5 first:pt-0 last:border-0 last:pb-0 dark:border-gray-800"
          >
            <span
              role="img"
              aria-label={`${block.label} ${block.isDone ? 'tersentuh' : 'belum'}`}
              className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 ${
                block.isDone
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {block.isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
            </span>
            <span className="mt-0.5 w-20 flex-shrink-0 text-sm font-semibold text-gray-800 dark:text-gray-100">
              {block.label}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {block.habits.length === 0 ? (
                <Link href="/habits/today" className="mt-0.5 text-xs text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-300">
                  atur di Habit Tracker
                </Link>
              ) : (
                block.habits.map((h) => {
                  const done = isCompleted(h.id, date, h.daily_target ?? 1);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      data-testid={`ritual-habit-${h.id}`}
                      onClick={() => toggle(h.id)}
                      disabled={isFuture}
                      aria-pressed={done}
                      className={`flex max-w-full items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        done
                          ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400'
                          : 'border-gray-200 text-gray-700 hover:border-green-300 dark:border-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={3} /> : null}
                      <span className="truncate">{h.name}</span>
                      {(h.daily_target ?? 1) > 1 ? <span className="text-gray-400">{h.daily_target}x</span> : null}
                    </button>
                  );
                })
              )}
            </div>
          </li>
        ))}
      </ul>
    </DailyCardShell>
  );
}
