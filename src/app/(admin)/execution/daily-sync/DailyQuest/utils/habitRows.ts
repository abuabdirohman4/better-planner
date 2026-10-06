// Kartu Daily Ritual: 4 pilar ritual pagi dari habits.ritual_pillar (app-70vs, app-fj81).
// Pure — no fetching, no React. Habit tidak pernah menyentuh daily_plan_items.
import type { Habit, RitualPillar } from '@/types/habit';
import { isScheduledOn } from '@/app/(admin)/habits/actions/habits/logic';

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
  /** Pilar tersentuh hari itu = minimal 1 habitnya selesai (buku: ceklis 4 kotak, app-fj81). */
  isDone: boolean;
}

/** Empat pilar ritual pagi: habit aktif + terjadwal di `date`, dikelompokkan per pilar. */
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
    return { pillar, label, habits: list, doneCount, isDone: doneCount > 0 };
  });
}
