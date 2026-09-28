"use server";

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getQuarterDates, createdAtForQuarter, quarterOfDate } from '@/lib/quarterUtils';
import {
  buildGroups,
  buildCopyRow,
  type CarryOverType,
  type CarryOverGroup,
} from './logic';
import {
  queryTopTasksBefore,
  queryTopTasksInRange,
  queryTasksByIds,
  queryChildren,
  insertTasks,
} from './queries';

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

export async function getCarryOverGroups(type: CarryOverType, year: number, quarter: number): Promise<CarryOverGroup[]> {
  const { supabase, userId } = await requireUser();
  const [startIso, endIso] = rangeIso(year, quarter);
  const source = await queryTopTasksBefore(supabase, userId, type, startIso);
  const target = await queryTopTasksInRange(supabase, userId, type, startIso, endIso);
  const isWork = type === 'WORK_QUEST';
  const sourceChildren = isWork ? await queryChildren(supabase, userId, source.map(s => s.id)) : [];
  const targetChildren = isWork ? await queryChildren(supabase, userId, target.map(t => t.id)) : [];
  return buildGroups(type, source, sourceChildren, target, targetChildren, iso => quarterOfDate(new Date(iso)));
}

export async function carryOverQuests(type: CarryOverType, ids: string[], year: number, quarter: number): Promise<number> {
  if (ids.length === 0) return 0;
  if (type === 'WORK_QUEST') {
    throw new Error('Use carryOverWorkQuests');
  }
  const { supabase, userId } = await requireUser();
  const createdAt = createdAtForQuarter(year, quarter);
  const sources = await queryTasksByIds(supabase, userId, type, ids);

  await insertTasks(supabase, sources.map(s => buildCopyRow(type, s, userId, createdAt)));
  revalidatePath(PATHS[type]);
  return sources.length;
}

export interface WorkSelection { projectId: string; taskIds: string[]; }

export async function carryOverWorkQuests(selections: WorkSelection[], year: number, quarter: number): Promise<number> {
  if (selections.length === 0) return 0;
  const { supabase, userId } = await requireUser();
  const createdAt = createdAtForQuarter(year, quarter);
  const [startIso, endIso] = rangeIso(year, quarter);

  const projects = await queryTasksByIds(supabase, userId, 'WORK_QUEST', selections.map(s => s.projectId));
  const tasks = await queryTasksByIds(supabase, userId, 'WORK_QUEST', selections.flatMap(s => s.taskIds));
  const parents = await queryTasksByIds(supabase, userId, 'WORK_QUEST', [...new Set(tasks.map(t => t.parent_task_id!).filter(Boolean))]);
  const target = await queryTopTasksInRange(supabase, userId, 'WORK_QUEST', startIso, endIso);
  const norm = (s: string) => s.trim().toLowerCase();

  let copied = 0;
  for (const sel of selections) {
    const project = projects.find(p => p.id === sel.projectId && !p.parent_task_id);
    if (!project) continue;
    // Keamanan: task hanya sah kalau induknya project dengan judul sama (D4) milik user ini.
    const validTasks = tasks.filter(t =>
      sel.taskIds.includes(t.id) &&
      parents.some(p => p.id === t.parent_task_id && norm(p.title) === norm(project.title))
    );
    const existing = target.find(t => norm(t.title) === norm(project.title));
    const targetId = existing
      ? existing.id
      : (await insertTasks(supabase, [buildCopyRow('WORK_QUEST', project, userId, createdAt)]))[0].id;
    if (validTasks.length > 0) {
      await insertTasks(supabase, validTasks.map(t => buildCopyRow('WORK_QUEST', t, userId, createdAt, targetId)));
    }
    copied += existing ? 0 : 1;
    copied += validTasks.length;
  }
  revalidatePath('/quests/work-quests');
  return copied;
}
