// NO "use server" — pure functions
import { getLocalDateString, getLocalTimeString } from '@/lib/dateUtils';
import { DAY_CODES } from '@/lib/best-week/constants';
import type { BlockColors, DayCode } from '@/lib/best-week/types';
import type { RawTask, RawMilestone } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';
import type { RawWeekSchedule } from './queries';

export type HfgRank = 0 | 1 | 2 | 3;

// Palet slot Weekly Sync (questColors biru/hijau/oranye) dalam hex; 0 = bukan HFG.
export const HFG_COLORS: Record<HfgRank, BlockColors> = {
  0: { color: '#374151', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
  1: { color: '#1D4ED8', bgColor: '#DBEAFE', borderColor: '#93C5FD' },
  2: { color: '#15803D', bgColor: '#DCFCE7', borderColor: '#86EFAC' },
  3: { color: '#C2410C', bgColor: '#FFEDD5', borderColor: '#FDBA74' },
};

export interface RealWeekBlock {
  id: string;
  days: DayCode[];
  start_time: string; // "HH:MM" WIB
  end_time: string;   // "HH:MM" WIB, "24:00" kalau lewat tengah malam
  title: string;
  hfgRank: HfgRank;
  colors: BlockColors;
}

/** Senin (YYYY-MM-DD) minggu berjalan menurut kalender WIB. */
export function getWeekStartWib(now: Date): string {
  const d = new Date(`${getLocalDateString(now)}T00:00:00Z`);
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** task → milestone → quest; sub task memakai milestone parent-nya. */
export function resolveQuestId(
  taskId: string,
  taskMap: Map<string, RawTask>,
  milestoneMap: Map<string, RawMilestone>
): string | null {
  const task = taskMap.get(taskId);
  if (!task) return null;
  const parent = task.parent_task_id ? taskMap.get(task.parent_task_id) : undefined;
  const milestoneId = task.milestone_id ?? parent?.milestone_id;
  return (milestoneId && milestoneMap.get(milestoneId)?.quest_id) || null;
}

export function schedulesToBlocks(
  schedules: RawWeekSchedule[],
  weekStart: string,
  taskMap: Map<string, RawTask>,
  milestoneMap: Map<string, RawMilestone>,
  hfgQuestIds: string[]
): RealWeekBlock[] {
  const weekDates = DAY_CODES.map((_, i) => addDays(weekStart, i));
  const blocks: RealWeekBlock[] = [];

  for (const s of schedules) {
    const start = new Date(s.scheduled_start_time);
    const end = new Date(s.scheduled_end_time);
    const startDate = getLocalDateString(start);
    const dayIndex = weekDates.indexOf(startDate);
    if (dayIndex === -1) continue;

    const taskId = s.daily_plan_items?.item_id;
    const questId = taskId ? resolveQuestId(taskId, taskMap, milestoneMap) : null;
    const hfgRank = (questId ? hfgQuestIds.indexOf(questId) + 1 : 0) as HfgRank;

    blocks.push({
      id: s.id,
      days: [DAY_CODES[dayIndex]],
      start_time: getLocalTimeString(start),
      end_time: getLocalDateString(end) === startDate ? getLocalTimeString(end) : '24:00',
      title: (taskId && taskMap.get(taskId)?.title) || 'Untitled Task',
      hfgRank,
      colors: HFG_COLORS[hfgRank],
    });
  }
  return blocks;
}
