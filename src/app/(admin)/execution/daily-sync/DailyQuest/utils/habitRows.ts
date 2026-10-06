// app-cr6i: which habits belong in the Daily Quest card, and what the reminder line says.
// Pure — no fetching, no React. Habits never touch daily_plan_items; this is display-layer only.
import type { Habit, RitualPillar } from '@/types/habit';
import { isScheduledOn } from '@/app/(admin)/habits/actions/habits/logic';

/**
 * "Habit lain hari ini": opted in, active, scheduled on `date`. Habit ritual (punya pilar)
 * tampil di blok pilarnya, jadi tidak didobel di sini (app-70vs).
 */
export function selectDailySyncHabits(habits: Habit[], date: string): Habit[] {
  return habits.filter(
    (h) => h.show_in_daily_sync && !h.ritual_pillar && !h.is_archived && isScheduledOn(h, date)
  );
}

export const PILLAR_LABELS: { pillar: RitualPillar; label: string }[] = [
  { pillar: 'tubuh', label: 'Tubuh' },
  { pillar: 'pikiran', label: 'Pikiran' },
  { pillar: 'spiritual', label: 'Spiritual' },
  { pillar: 'sdc', label: 'SDC' },
];

export interface PillarBlock {
  pillar: RitualPillar;
  label: string;
  habits: Habit[];
  doneCount: number;
  /** Tuntas = punya habit dan semuanya selesai hari itu. Pilar kosong tidak pernah tuntas. */
  isDone: boolean;
}

/** Empat blok pilar ritual pagi: habit aktif + terjadwal di `date`, dikelompokkan per pilar. */
export function groupRitualPillars(
  habits: Habit[],
  date: string,
  isCompleted: (habitId: string, date: string, dailyTarget: number) => boolean
): PillarBlock[] {
  return PILLAR_LABELS.map(({ pillar, label }) => {
    const list = habits.filter(
      (h) => h.ritual_pillar === pillar && !h.is_archived && isScheduledOn(h, date)
    );
    const doneCount = list.filter((h) => isCompleted(h.id, date, h.daily_target ?? 1)).length;
    return { pillar, label, habits: list, doneCount, isDone: list.length > 0 && doneCount === list.length };
  });
}

/**
 * The other habits (not opted in) that are scheduled on `date` but still unfinished —
 * the number in "🔁 N kebiasaan lain belum selesai hari ini".
 */
export function countPendingOtherHabits(
  habits: Habit[],
  date: string,
  isCompleted: (habitId: string, date: string, dailyTarget: number) => boolean
): number {
  return habits.filter(
    (h) =>
      !h.show_in_daily_sync &&
      !h.is_archived &&
      isScheduledOn(h, date) &&
      !isCompleted(h.id, date, h.daily_target ?? 1)
  ).length;
}

/** Total "other" habits scheduled on `date`, done or not — lets the UI tell empty from all-done. */
export function countScheduledOtherHabits(habits: Habit[], date: string): number {
  return habits.filter(
    (h) => !h.show_in_daily_sync && !h.ritual_pillar && !h.is_archived && isScheduledOn(h, date)
  ).length;
}
