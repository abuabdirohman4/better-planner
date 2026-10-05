import { getQuarterFromWeek, getWeekAndYearFromDate } from '@/lib/quarterUtils';

export function greetingFor(hourWIB: number): string {
  if (hourWIB >= 4 && hourWIB < 11) return 'Selamat pagi';
  if (hourWIB >= 11 && hourWIB < 15) return 'Selamat siang';
  if (hourWIB >= 15 && hourWIB < 18) return 'Selamat sore';
  return 'Selamat malam';
}

// today = "YYYY-MM-DD" WIB. Minggu 13 (dan 14 di Q4 tahun 53 minggu) = minggu istirahat.
export function weekInfo(today: string): { year: number; quarter: number; weekInQuarter: number; label: string } {
  const [y, m, d] = today.split('-').map(Number);
  const { weekNumber, year } = getWeekAndYearFromDate(new Date(y, m - 1, d, 12));
  const quarter = getQuarterFromWeek(weekNumber);
  const weekInQuarter = weekNumber - (quarter - 1) * 13;
  const label = weekInQuarter > 12
    ? `Minggu istirahat · Q${quarter} ${year}`
    : `Minggu ${weekInQuarter} dari 12 · Q${quarter} ${year}`;
  return { year, quarter, weekInQuarter, label };
}

export interface VisionSlide { area: string; t35: string | null; t10: string | null }

// Semua area yang punya minimal satu teks visi; carousel menyaring per jangka.
export function buildVisionSlides(
  visions: { life_area: string; vision_3_5_year: string | null; vision_10_year: string | null }[],
): VisionSlide[] {
  return visions
    .map((v) => ({ area: v.life_area, t35: v.vision_3_5_year?.trim() || null, t10: v.vision_10_year?.trim() || null }))
    .filter((v) => v.t35 || v.t10);
}

export interface StepMilestone { id: string; quest_id: string; title: string; display_order: number | null }
export interface StepTask { id: string; milestone_id: string; title: string; status: string | null; display_order: number | null }

export interface HfgStepCard {
  questId: string;
  title: string;
  motivation: string | null;
  done: number;
  total: number;
  percent: number;
  next: { taskId: string; title: string; milestoneTitle: string; planned: boolean } | null;
}

// Langkah = task langsung di bawah milestone (subtask sudah dibuang di query).
export function buildHfgStepCards(
  quests: { id: string; title: string; motivation?: string | null }[],
  milestones: StepMilestone[],
  tasks: StepTask[],
  plannedTaskIds: Set<string>,
): HfgStepCard[] {
  return quests.map((q) => {
    const ms = milestones
      .filter((m) => m.quest_id === q.id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const steps = ms.flatMap((m) =>
      tasks
        .filter((t) => t.milestone_id === m.id)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
        .map((t) => ({ ...t, milestoneTitle: m.title })),
    );
    const done = steps.filter((t) => t.status === 'DONE').length;
    const next = steps.find((t) => t.status !== 'DONE');
    return {
      questId: q.id,
      title: q.title,
      motivation: q.motivation?.trim() || null,
      done,
      total: steps.length,
      percent: steps.length ? Math.round((done / steps.length) * 100) : 0,
      next: next
        ? { taskId: next.id, title: next.title, milestoneTitle: next.milestoneTitle, planned: plannedTaskIds.has(next.id) }
        : null,
    };
  });
}

export interface HabitDay { date: string; done: number; scheduled: number; percent: number }

// dates urut lama → baru. Habit dihitung mulai hari dibuat; habit negatif tidak ikut (selesai = tidak dilakukan).
export function buildHabitDays(
  habits: { id: string; tracking_type: string; daily_target: number; target_days: number[] | null; created_at: string }[],
  completions: { habit_id: string; date: string }[],
  dates: string[],
  isScheduledOn: (h: { target_days: number[] | null }, date: string) => boolean,
): HabitDay[] {
  const counts = new Map<string, number>();
  for (const c of completions) {
    const k = `${c.habit_id}:${c.date}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const positive = habits.filter((h) => h.tracking_type === 'positive');
  return dates.map((date) => {
    const due = positive.filter((h) => h.created_at.slice(0, 10) <= date && isScheduledOn(h, date));
    const done = due.filter((h) => (counts.get(`${h.id}:${date}`) ?? 0) >= Math.max(1, h.daily_target)).length;
    return { date, done, scheduled: due.length, percent: due.length ? Math.round((done / due.length) * 100) : 0 };
  });
}

// N tanggal terakhir sampai today, urut lama → baru.
export function lastNDates(today: string, n: number): string[] {
  const base = Date.parse(today + 'T00:00:00Z');
  return Array.from({ length: n }, (_, i) => new Date(base - (n - 1 - i) * 86400000).toISOString().slice(0, 10));
}
