"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getQuarterDates, getPrevQuarter, createdAtForQuarter } from '@/lib/quarterUtils';
import { buildCandidates, buildCopyRow, type CarryOverType, type CarryOverCandidate } from './logic';
import { queryTopTasksInRange, queryTasksByIds, queryChildren, insertTasks } from './queries';

const PATHS: Record<CarryOverType, string> = {
  DAILY_QUEST: '/quests/daily-quests',
  SIDE_QUEST: '/quests/side-quests',
  WORK_QUEST: '/quests/work-quests',
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return { supabase, userId: user.id };
}

function rangeIso(year: number, quarter: number) {
  const { startDate, endDate } = getQuarterDates(year, quarter);
  return [startDate.toISOString(), endDate.toISOString()] as const;
}

export async function getCarryOverCandidates(type: CarryOverType, year: number, quarter: number): Promise<CarryOverCandidate[]> {
  const { supabase, userId } = await requireUser();
  const prev = getPrevQuarter(year, quarter);
  const source = await queryTopTasksInRange(supabase, userId, type, ...rangeIso(prev.year, prev.quarter));
  const target = await queryTopTasksInRange(supabase, userId, type, ...rangeIso(year, quarter));
  const children = type === 'WORK_QUEST' ? await queryChildren(supabase, userId, source.map(s => s.id)) : [];
  return buildCandidates(type, source, children, target.map(t => t.title));
}

export async function carryOverQuests(type: CarryOverType, ids: string[], year: number, quarter: number): Promise<number> {
  if (ids.length === 0) return 0;
  const { supabase, userId } = await requireUser();
  const createdAt = createdAtForQuarter(year, quarter);
  const sources = await queryTasksByIds(supabase, userId, type, ids);

  if (type !== 'WORK_QUEST') {
    await insertTasks(supabase, sources.map(s => buildCopyRow(type, s, userId, createdAt)));
  } else {
    const children = await queryChildren(supabase, userId, sources.map(s => s.id));
    for (const project of sources) {
      const [created] = await insertTasks(supabase, [buildCopyRow(type, project, userId, createdAt)]);
      const openChildren = children.filter(c => c.parent_task_id === project.id && c.status !== 'DONE');
      if (openChildren.length > 0) {
        await insertTasks(supabase, openChildren.map(c => buildCopyRow(type, c, userId, createdAt, created.id)));
      }
    }
  }

  revalidatePath(PATHS[type]);
  return sources.length;
}
