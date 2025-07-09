"use server"

import { createClient } from '@/lib/supabase/server';

// Ambil semua item goal mingguan user untuk minggu tertentu
export async function getWeeklyGoalItems(year: number, weekNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;

  // 1. Ambil weekly_goals user (select id dan goal_slot)
  const { data: weeklyGoals, error: wgError } = await supabase
    .from('weekly_goals')
    .select('id, goal_slot')
    .eq('user_id', user_id)
    .eq('year', year)
    .eq('week_number', weekNumber);

  if (wgError) throw wgError;
  if (!weeklyGoals?.length) return [];

  const weeklyGoalIdToSlot: Record<string, number> = {};
  weeklyGoals.forEach(g => { weeklyGoalIdToSlot[g.id] = g.goal_slot; });

  const weeklyGoalIds = weeklyGoals.map(g => g.id);

  // 2. Ambil semua weekly_goal_items
  const { data: items, error: itemsError } = await supabase
    .from('weekly_goal_items')
    .select('id, weekly_goal_id, item_id, item_type')
    .in('weekly_goal_id', weeklyGoalIds);

  if (itemsError) throw itemsError;
  if (!items?.length) return [];

  // 3. Ambil data judul dari semua tabel item terkait
  const questIds = items.filter(i => i.item_type === 'QUEST').map(i => i.item_id);
  const milestoneIds = items.filter(i => i.item_type === 'MILESTONE').map(i => i.item_id);
  const taskIds = items.filter(i => i.item_type === 'TASK' || i.item_type === 'SUBTASK').map(i => i.item_id);

  const [quests, milestones, tasks] = await Promise.all([
    questIds.length
      ? supabase.from('quests').select('id, title').in('id', questIds)
      : { data: [] },
    milestoneIds.length
      ? supabase.from('milestones').select('id, title, quest_id').in('id', milestoneIds)
      : { data: [] },
    taskIds.length
      ? supabase.from('tasks').select('id, title, milestone_id, parent_task_id').in('id', taskIds)
      : { data: [] },
  ]);

  const questMap = Object.fromEntries((quests.data || []).map(q => [q.id, q]));
  const milestoneMap = Object.fromEntries((milestones.data || []).map(m => [m.id, m]));
  const taskMap = Object.fromEntries((tasks.data || []).map(t => [t.id, t]));

  const result = items.map(item => {
    let title = '';
    let main_quest_id = null;
    let main_quest_title = '';
    if (item.item_type === 'QUEST') {
      title = questMap[item.item_id]?.title || '';
      main_quest_id = item.item_id;
      main_quest_title = title;
    } else if (item.item_type === 'MILESTONE') {
      const m = milestoneMap[item.item_id];
      title = m?.title || '';
      main_quest_id = m?.quest_id || null;
      main_quest_title = questMap[m?.quest_id]?.title || '';
    } else if (item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
      const t = taskMap[item.item_id];
      title = t?.title || '';
      const milestone = t?.milestone_id ? milestoneMap[t.milestone_id] : null;
      main_quest_id = milestone?.quest_id || null;
      main_quest_title = questMap[milestone?.quest_id]?.title || '';
    }
    return {
      id: item.item_id,
      type: item.item_type,
      title,
      main_quest_id,
      main_quest_title,
      goal_slot: weeklyGoalIdToSlot[item.weekly_goal_id] ?? 0,
    };
  });

  return result;
}

// Ambil daily plan dan itemnya untuk tanggal tertentu
export async function getDailyPlan(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;
  const { data: plan, error } = await supabase
    .from('daily_plans')
    .select('*, daily_plan_items(*)')
    .eq('plan_date', date)
    .eq('user_id', user_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  return plan;
}

// Upsert daily plan dan set itemnya
export async function setDailyPlan(date: string, selectedItems: { item_id: string; item_type: string }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  const user_id = user.id;
  // Upsert daily_plans
  const { data: plan, error: upsertError } = await supabase
    .from('daily_plans')
    .upsert({ user_id, plan_date: date }, { onConflict: 'user_id,plan_date' })
    .select()
    .single();
  if (upsertError) throw upsertError;
  const daily_plan_id = plan.id;
  // Hapus semua daily_plan_items lama
  await supabase.from('daily_plan_items').delete().eq('daily_plan_id', daily_plan_id);
  // Insert baru
  if (selectedItems.length > 0) {
    const itemsToInsert = selectedItems.map((item) => ({ ...item, daily_plan_id }));
    await supabase.from('daily_plan_items').insert(itemsToInsert);
  }
  return { success: true };
} 