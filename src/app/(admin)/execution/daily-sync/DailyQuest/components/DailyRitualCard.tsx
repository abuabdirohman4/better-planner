"use client";

import React from 'react';
import Link from 'next/link';
import { Sunrise, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDailySyncHabits } from '../hooks/useDailySyncHabits';
import HabitQuestRow from './HabitQuestRow';
import DailyCardShell from './DailyCardShell';
import AddItemMenu from './AddItemMenu';
import type { DailyPlanItem } from '@/types/daily-plan';

/**
 * Morning ritual 4 pilar (Tubuh · Pikiran · Spiritual · SDC). Mencentang memakai mekanisme habit
 * yang sama dengan /habits/today (habit_completions, cache SWR yang sama) — app-70vs.
 */
interface DailyRitualCardProps {
  selectedDate: string;
  routine: DailyPlanItem[];
  renderItem: (item: DailyPlanItem) => React.ReactNode;
  onAddDaily: () => void;
}

export default function DailyRitualCard({ selectedDate, routine, renderItem, onAddDaily }: DailyRitualCardProps) {
  const {
    date,
    habits: otherHabits,
    pillars,
    isCompleted,
    toggleCompletion,
    streakOf,
    pendingOtherCount,
    scheduledOtherCount,
  } = useDailySyncHabits(selectedDate);

  const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isFuture = date > todayWIB;

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
        <Link
          href="/habits/today"
          className="flex-shrink-0 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-200 dark:bg-brand-500/15 dark:text-brand-300"
        >
          Buka Habit Tracker →
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {pillars.map((block) => (
          <div
            key={block.pillar}
            data-testid={`ritual-pillar-${block.pillar}`}
            data-done={block.isDone}
            className={`rounded-xl border p-3 ${
              block.isDone
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
                : 'border-gray-200 dark:border-gray-800'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{block.label}</span>
              {block.isDone ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                  <Check className="h-4 w-4" /> Tuntas
                </span>
              ) : block.habits.length > 0 ? (
                <span className="text-xs font-semibold text-gray-500">
                  {block.doneCount}/{block.habits.length}
                </span>
              ) : null}
            </div>

            {block.habits.length === 0 ? (
              <p className="text-xs text-gray-500">
                Belum ada habit —{' '}
                <Link href="/habits/today" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                  atur di Habit Tracker
                </Link>
              </p>
            ) : (
              <ul className="space-y-1.5">
                {block.habits.map((h) => {
                  const done = isCompleted(h.id, date, h.daily_target ?? 1);
                  return (
                    <li key={h.id} data-testid={`ritual-habit-${h.id}`} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggle(h.id)}
                        disabled={isFuture}
                        aria-pressed={done}
                        aria-label={`Tandai ${h.name} selesai`}
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          done
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 bg-white hover:border-green-400 dark:border-gray-500 dark:bg-gray-700'
                        }`}
                      >
                        {done ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                      </button>
                      <span
                        className={`min-w-0 flex-1 text-sm ${
                          done ? 'text-green-700 line-through dark:text-green-400' : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {h.name}
                        {(h.daily_target ?? 1) > 1 ? (
                          <span className="ml-1 text-xs text-gray-500">{h.daily_target}x</span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4" data-testid="ritual-routine">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rutinitas</p>
          <AddItemMenu kinds={['DAILY_QUEST']} onPick={onAddDaily} label="Pilih Daily" testId="routine-add" />
        </div>
        {routine.length === 0 ? (
          <p className="text-xs text-gray-500">Belum ada rutinitas hari ini</p>
        ) : (
          routine.map((item) => <div key={item.id}>{renderItem(item)}</div>)
        )}
      </div>

      {otherHabits.length > 0 ? (
        <div className="mt-4 space-y-3" data-testid="ritual-other-habits">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Habit lain hari ini</p>
          {otherHabits.map((habit) => (
            <HabitQuestRow
              key={habit.id}
              habit={habit}
              isCompleted={isCompleted(habit.id, date, habit.daily_target ?? 1)}
              currentStreak={streakOf(habit.id)}
              onToggle={() => toggle(habit.id)}
              disabled={isFuture}
            />
          ))}
        </div>
      ) : null}

      {scheduledOtherCount > 0 ? (
        <Link
          href="/habits/today"
          data-testid="daily-quest-habit-reminder"
          className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
        >
          <span aria-hidden="true">🔁</span>
          <span className="flex-1">
            {pendingOtherCount > 0
              ? `${pendingOtherCount} kebiasaan lain belum selesai hari ini`
              : `${scheduledOtherCount} kebiasaan lain sudah selesai hari ini`}
          </span>
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </DailyCardShell>
  );
}
