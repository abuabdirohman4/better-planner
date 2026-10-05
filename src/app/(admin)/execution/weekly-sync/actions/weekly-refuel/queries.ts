// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';
import type { WeeklyRefuel } from '@/types/weekly-sync';

export async function queryWeeklyRefuel(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number
): Promise<WeeklyRefuel | null> {
  const { data, error } = await supabase
    .from('weekly_refuels')
    .select('activities, achievements')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('week_number', weekNumber)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertWeeklyRefuel(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number,
  values: WeeklyRefuel
): Promise<void> {
  const { error } = await supabase.from('weekly_refuels').upsert(
    {
      user_id: userId,
      year,
      quarter,
      week_number: weekNumber,
      ...values,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,year,quarter,week_number' }
  );
  if (error) throw error;
}

import type { FocusLogRow, FocusTaskRow } from './logic';

const chunk = <T,>(a: T[], n = 80): T[][] => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const TASK_COLS = 'id, title, type, milestone_id, parent_task_id';

/** Log fokus Sen–Min + tugas (beserta parent-nya) + milestone milik quest HFG. */
export async function queryFocusWeek(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string,
  hfgQuestIds: string[]
): Promise<{ logs: FocusLogRow[]; tasks: FocusTaskRow[]; hfgMilestones: string[] }> {
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('task_id, local_date, duration_minutes')
    .eq('user_id', userId)
    .eq('type', 'FOCUS')
    .gte('local_date', fromDate)
    .lte('local_date', toDate);
  if (error) throw error;

  const taskIds = [...new Set((logs ?? []).map((l) => l.task_id).filter(Boolean))] as string[];
  const tasks: FocusTaskRow[] = [];
  for (const ids of chunk(taskIds)) {
    const { data, error: e } = await supabase.from('tasks').select(TASK_COLS).eq('user_id', userId).in('id', ids);
    if (e) throw e;
    tasks.push(...(data ?? []));
  }
  const have = new Set(tasks.map((t) => t.id));
  const parentIds = [...new Set(tasks.map((t) => t.parent_task_id).filter((p): p is string => !!p && !have.has(p)))];
  for (const ids of chunk(parentIds)) {
    const { data, error: e } = await supabase.from('tasks').select(TASK_COLS).eq('user_id', userId).in('id', ids);
    if (e) throw e;
    tasks.push(...(data ?? []));
  }

  let hfgMilestones: string[] = [];
  if (hfgQuestIds.length) {
    const { data, error: e } = await supabase.from('milestones').select('id').in('quest_id', hfgQuestIds);
    if (e) throw e;
    hfgMilestones = (data ?? []).map((m) => m.id);
  }
  return { logs: logs ?? [], tasks, hfgMilestones };
}
