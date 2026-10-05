// NO "use server" — pure functions, no DB calls

/** Teks kosong/spasi saja -> null. */
export function normalizeText(value: string | null | undefined): string | null {
  const t = (value ?? '').trim();
  return t === '' ? null : t;
}


// ---------- Ringkasan usaha (fokus) mingguan ----------

export const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
export const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export type FocusCategory = 'HFG' | 'WORK' | 'SIDE' | 'DAILY' | 'OTHER';
export const CATEGORY_ORDER: FocusCategory[] = ['HFG', 'WORK', 'SIDE', 'DAILY', 'OTHER'];
export const CATEGORY_LABELS: Record<FocusCategory, string> = {
  HFG: 'HFG', WORK: 'Work Quest', SIDE: 'Side Quest', DAILY: 'Daily Quest', OTHER: 'Lainnya',
};

export interface FocusLogRow { task_id: string | null; local_date: string; duration_minutes: number | null }
export interface FocusTaskRow { id: string; title: string | null; type: string | null; milestone_id: string | null; parent_task_id: string | null }

export interface FocusSummary {
  totalMinutes: number;
  sessions: number;
  distinctTasks: number;
  days: { date: string; label: string; name: string; minutes: number; sessions: number }[];
  best: { name: string; minutes: number } | null;
  categories: { key: FocusCategory; label: string; minutes: number }[]; // HFG selalu ada; lainnya hanya bila > 0
  tasks: { id: string; title: string; category: FocusCategory; minutes: number; sessions: number }[]; // semua, menit terbanyak dulu
}

/** 7 tanggal YYYY-MM-DD (Senin..Minggu) dari komponen tanggal lokal Senin; aritmetika UTC agar tidak geser zona. */
export function weekDateStrings(monday: Date): string[] {
  const base = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate());
  return Array.from({ length: 7 }, (_, i) => new Date(base + i * 86400000).toISOString().slice(0, 10));
}

/** "35j 36m", "45m", "2j", "0m". */
export function formatDuration(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  return r === 0 ? `${h}j` : `${h}j ${r}m`;
}

function categoryOf(task: FocusTaskRow | undefined, root: FocusTaskRow | undefined, hfgMilestones: Set<string>): FocusCategory {
  const ms = [task?.milestone_id, root?.milestone_id].filter(Boolean) as string[];
  if (ms.some((m) => hfgMilestones.has(m))) return 'HFG';
  const type = root?.type ?? task?.type;
  if (type === 'WORK_QUEST') return 'WORK';
  if (type === 'SIDE_QUEST') return 'SIDE';
  if (type === 'DAILY_QUEST') return 'DAILY';
  return 'OTHER';
}

export function summarizeFocus(
  logs: FocusLogRow[],
  tasks: FocusTaskRow[],
  weekDates: string[],
  hfgMilestones: Set<string>
): FocusSummary {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const dayIdx = new Map(weekDates.map((d, i) => [d, i]));
  const days = weekDates.map((date, i) => ({ date, label: DAY_LABELS[i], name: DAY_NAMES[i], minutes: 0, sessions: 0 }));
  const cat = new Map<FocusCategory, number>();
  const perTask = new Map<string, { title: string; category: FocusCategory; minutes: number; sessions: number }>();
  let totalMinutes = 0;
  let sessions = 0;

  for (const l of logs) {
    const i = dayIdx.get(l.local_date);
    if (i === undefined) continue;
    const min = l.duration_minutes ?? 0;
    totalMinutes += min;
    sessions += 1;
    days[i].minutes += min;
    days[i].sessions += 1;

    const task = l.task_id ? byId.get(l.task_id) : undefined;
    const root = task?.parent_task_id ? byId.get(task.parent_task_id) ?? task : task;
    const c = categoryOf(task, root, hfgMilestones);
    cat.set(c, (cat.get(c) ?? 0) + min);

    if (l.task_id) {
      // Daily quest membuat tugas baru tiap hari dengan judul sama — gabung per jenis + judul.
      const title = root?.title?.trim() || 'Tanpa judul';
      const key = `${c}|${title.toLowerCase()}`;
      const cur = perTask.get(key) ?? { title, category: c, minutes: 0, sessions: 0 };
      cur.minutes += min;
      cur.sessions += 1;
      perTask.set(key, cur);
    }
  }

  const best = days.reduce((a, d) => (d.minutes > a.minutes ? d : a), days[0]);
  return {
    totalMinutes,
    sessions,
    distinctTasks: perTask.size,
    days,
    best: best && best.minutes > 0 ? { name: best.name, minutes: best.minutes } : null,
    categories: CATEGORY_ORDER
      .filter((k) => k === 'HFG' || (cat.get(k) ?? 0) > 0)
      .map((k) => ({ key: k, label: CATEGORY_LABELS[k], minutes: cat.get(k) ?? 0 })),
    tasks: [...perTask.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}
