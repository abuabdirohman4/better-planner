// app-8438: strip Siklus Kerja — dibentuk otomatis dari log timer FOCUS hari itu (read-only).

export type CycleClass = 90 | 60 | 25;

export interface FocusLog {
  id: string;
  type: string;
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
  /** task_type log (MAIN_QUEST/WORK_QUEST/…), untuk label jenis di kotak. */
  taskType: string | null;
  start: string;
  end: string;
}

export interface WorkCycles {
  /** Satu kotak 90/15, hanya untuk siklus 90 task HFG. */
  hfg: FilledCycle | null;
  /** Kotak 60/10: siklus 60 + siklus 90 non-HFG (dan 90 HFG berikutnya). Minimal 3 kotak tampil. */
  routine: FilledCycle[];
  /** Siklus utama selesai (maks 4: 1 HFG + 3 routine). */
  mainDone: number;
  /** Siklus 25/5: jumlah, total menit, per task (urut sesi terbanyak). */
  short: { count: number; minutes: number; tasks: { title: string; count: number; minutes: number }[] };
}

export const ROUTINE_SLOTS = 3;

/** Label siklus: 90 → "90/15", 60 → "60/10", 25 → "25/5". */
export const cycleLabel = (cls: CycleClass) => `${cls}/${cls === 90 ? 15 : cls === 60 ? 10 : 5}`;

/** Ambang durasi (keputusan Abu 5 Okt 2026): >=80 menit = 90/15, >=50 = 60/10, sisanya 25/5. */
export function classifyCycle(minutes: number): CycleClass {
  if (minutes >= 80) return 90;
  if (minutes >= 50) return 60;
  return 25;
}

export function buildWorkCycles(logs: FocusLog[]): WorkCycles {
  const focus = logs
    .filter((l) => l.type === 'FOCUS')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  let hfg: FilledCycle | null = null;
  const routine: FilledCycle[] = [];
  const shortTasks = new Map<string, { count: number; minutes: number }>();
  let shortCount = 0;
  let shortMinutes = 0;

  for (const l of focus) {
    const title = l.task_title?.trim() || 'Tanpa judul';
    const cls = classifyCycle(l.duration_minutes);
    const cycle = { id: l.id, title, cls, taskType: l.task_type ?? null, start: l.start_time, end: l.end_time };
    if (cls === 90 && l.task_type === 'MAIN_QUEST' && !hfg) hfg = cycle;
    else if (cls === 90 || cls === 60) routine.push(cycle);
    else {
      shortCount += 1;
      shortMinutes += l.duration_minutes;
      const t = shortTasks.get(title) ?? { count: 0, minutes: 0 };
      shortTasks.set(title, { count: t.count + 1, minutes: t.minutes + l.duration_minutes });
    }
  }

  return {
    hfg,
    routine,
    mainDone: (hfg ? 1 : 0) + Math.min(routine.length, ROUTINE_SLOTS),
    short: {
      count: shortCount,
      minutes: shortMinutes,
      tasks: [...shortTasks.entries()]
        .map(([title, t]) => ({ title, ...t }))
        .sort((a, b) => b.count - a.count || b.minutes - a.minutes),
    },
  };
}
