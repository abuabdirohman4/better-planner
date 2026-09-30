"use server";

import { createClient } from '@/lib/supabase/server';
import { quarterOfDate } from '@/lib/quarterUtils';
import { wibDateToUtcRange } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/schedule/logic';
import { queryTasksByIds, queryMilestonesByIds } from '@/app/(admin)/execution/daily-sync/DailyQuest/actions/weekly-tasks/queries';
import { queryCommittedQuests } from '@/app/(admin)/planning/main-quests/actions/quests/queries';
import { queryWeekSchedules } from './queries';
import { addDays, schedulesToBlocks, type RealWeekBlock } from './logic';

export interface RealWeekData {
  blocks: RealWeekBlock[];
  hfgs: { rank: number; title: string }[];
}

export async function getRealWeekSchedules(weekStart: string): Promise<RealWeekData> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error('Invalid weekStart');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { startUTC } = wibDateToUtcRange(weekStart);
  const { endUTC } = wibDateToUtcRange(addDays(weekStart, 6));
  // Minggu berjalan milik quarter berjalan, bukan quarter yang sedang dipilih di header.
  const { year, quarter } = quarterOfDate(new Date(`${weekStart}T12:00:00+07:00`));

  const [schedules, hfgQuests] = await Promise.all([
    queryWeekSchedules(supabase, user.id, startUTC, endUTC),
    queryCommittedQuests(supabase, user.id, year, quarter, true, 3),
  ]);

  const taskIds = [...new Set(schedules.map(s => s.daily_plan_items?.item_id).filter((id): id is string => !!id))];
  const tasks = taskIds.length ? await queryTasksByIds(supabase, taskIds) : [];
  const parentIds = [...new Set(
    tasks.map(t => t.parent_task_id).filter((id): id is string => !!id && !taskIds.includes(id))
  )];
  const parents = parentIds.length ? await queryTasksByIds(supabase, parentIds) : [];
  const taskMap = new Map([...tasks, ...parents].map(t => [t.id, t]));

  const milestoneIds = [...new Set([...taskMap.values()].map(t => t.milestone_id).filter((id): id is string => !!id))];
  const milestones = await queryMilestonesByIds(supabase, milestoneIds);
  const milestoneMap = new Map(milestones.map(m => [m.id, m]));

  return {
    blocks: schedulesToBlocks(schedules, weekStart, taskMap, milestoneMap, hfgQuests.map(q => q.id)),
    hfgs: hfgQuests.map((q, i) => ({ rank: i + 1, title: q.title })),
  };
}
