import type { ActivityLogItem } from '@/types/activity-log';

export interface CycleGroup {
  key: string;
  title: string;
  taskType: string;
  logs: ActivityLogItem[];
}

/** Siklus FOCUS urut jam; siklus berturut-turut dengan task yang sama jadi satu grup. */
export function groupCycles(logs: ActivityLogItem[]): CycleGroup[] {
  const focus = logs
    .filter((l) => l.type === 'FOCUS')
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const groups: CycleGroup[] = [];
  for (const l of focus) {
    const last = groups[groups.length - 1];
    if (last && l.task_id && last.logs[0].task_id === l.task_id) last.logs.push(l);
    else groups.push({ key: l.id, title: l.task_title || 'Tanpa judul', taskType: l.task_type ?? '', logs: [l] });
  }
  return groups;
}
