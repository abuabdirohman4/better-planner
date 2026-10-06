// Siklus Kerja: daftar baris seperti buku (app-8438, app-mgsb). Rencana per baris = daily_plans.cycle_plan,
// baris tercentang otomatis dari log timer FOCUS hari itu (read-only).

export type CycleClass = 90 | 60 | 25;

export interface FocusLog {
  id: string;
  type: string;
  task_id?: string | null;
  task_title?: string | null;
  task_type?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export interface FilledCycle {
  id: string;
  title: string;
  cls: CycleClass;
  start: string;
  end: string;
}

/** Satu baris rencana: durasi siklus + task yang direncanakan (item_id task, bukan id daily_plan_item). */
export interface CyclePlanRow {
  minutes: number;
  item_id: string | null;
}

export interface CycleRow extends CyclePlanRow {
  done: FilledCycle | null;
}

export interface WorkCycles {
  rows: CycleRow[];
  /** Siklus 60/90 yang tidak punya baris rencana. */
  extra: FilledCycle[];
  done: number;
  /** Alternatif 25/5: jumlah, total menit, per task (urut siklus terbanyak). */
  short: { count: number; minutes: number; tasks: { title: string; count: number; minutes: number }[] };
}

/** Bawaan buku: satu 90/15 lalu tiga 60/10. */
export const DEFAULT_CYCLE_PLAN: CyclePlanRow[] = [
  { minutes: 90, item_id: null },
  { minutes: 60, item_id: null },
  { minutes: 60, item_id: null },
  { minutes: 60, item_id: null },
];

/** Label siklus: 90 → "90/15", 60 → "60/10", 25 → "25/5". */
export const cycleLabel = (cls: CycleClass) => `${cls}/${cls === 90 ? 15 : cls === 60 ? 10 : 5}`;

/** Ambang durasi (keputusan Abu 5 Okt 2026): >=80 menit = 90/15, >=50 = 60/10, sisanya 25/5. */
export function classifyCycle(minutes: number): CycleClass {
  if (minutes >= 80) return 90;
  if (minutes >= 50) return 60;
  return 25;
}

/**
 * Daftar hanya berisi siklus 90/15 dan 60/10 (rencana < 50 menit diabaikan). Log mengisi baris:
 * (1) baris yang merencanakan task itu, asal durasinya setara/lebih panjang dari baris; (2) baris tanpa rencana
 * dengan durasi sama. Log 60/90 yang tak dapat baris jadi `extra`; semua log 25 menit masuk Alternatif 25/5.
 */
export function buildWorkCycles(logs: FocusLog[], plan: CyclePlanRow[] | null = null): WorkCycles {
  const planned = (plan ?? []).filter((r) => r.minutes >= 50);
  const rows: CycleRow[] = (planned.length ? planned : DEFAULT_CYCLE_PLAN).map((r) => ({ ...r, done: null }));
  const extra: FilledCycle[] = [];
  const shortTasks = new Map<string, { count: number; minutes: number }>();
  let shortCount = 0;
  let shortMinutes = 0;

  const focus = logs.filter((l) => l.type === 'FOCUS').sort((a, b) => a.start_time.localeCompare(b.start_time));
  for (const l of focus) {
    const title = l.task_title?.trim() || 'Tanpa judul';
    const cls = classifyCycle(l.duration_minutes);
    if (cls === 25) {
      shortCount += 1;
      shortMinutes += l.duration_minutes;
      const t = shortTasks.get(title) ?? { count: 0, minutes: 0 };
      shortTasks.set(title, { count: t.count + 1, minutes: t.minutes + l.duration_minutes });
      continue;
    }
    const cycle = { id: l.id, title, cls, start: l.start_time, end: l.end_time };
    const free = rows.filter((r) => !r.done);
    const row =
      free.find((r) => l.task_id && r.item_id === l.task_id && cls >= classifyCycle(r.minutes)) ??
      free.find((r) => !r.item_id && classifyCycle(r.minutes) === cls);
    if (row) row.done = cycle;
    else extra.push(cycle);
  }

  return {
    rows,
    extra,
    done: rows.filter((r) => r.done).length,
    short: {
      count: shortCount,
      minutes: shortMinutes,
      tasks: [...shortTasks.entries()]
        .map(([title, t]) => ({ title, ...t }))
        .sort((a, b) => b.count - a.count || b.minutes - a.minutes),
    },
  };
}
