import { createClient } from '@/lib/supabase/server';
import { getLocalDateString } from '@/lib/dateUtils';
import { formatQParam } from '@/lib/quarterUtils';
import { quoteOfDay, type Quote } from '@/lib/quotes';
import { queryCommittedQuests } from '@/app/(admin)/planning/main-quests/actions/quests/queries';
import { queryVisionsByUserId } from '@/app/(admin)/planning/vision/queries';
import { queryHabits } from '@/app/(admin)/habits/actions/habits/queries';
import { queryCompletionsInRange } from '@/app/(admin)/habits/actions/completions/queries';
import { isScheduledOn } from '@/app/(admin)/habits/actions/habits/logic';
import {
  greetingFor,
  weekInfo,
  buildVisionSlides,
  buildHfgStepCards,
  buildHabitDays,
  lastNDates,
  type HfgStepCard,
  type VisionSlide,
  type HabitDay,
} from './logic';

export interface DashboardHome {
  greeting: string;
  dateLabel: string;
  weekLabel: string;
  // Kuartal yang dilihat lewat QuarterSelector; bagian "hari ini" hanya berarti di kuartal berjalan.
  viewed: { year: number; quarter: number; label: string };
  isCurrentQuarter: boolean;
  currentQParam: string;
  quote: Quote;
  visions: VisionSlide[];
  hfg: HfgStepCard[];
  habitDays: HabitDay[];
  focusMinutesToday: number;
  tasksToday: { done: number; total: number };
}

export async function getDashboardHome(viewed: { year: number; quarter: number }): Promise<DashboardHome | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const now = new Date();
  const today = getLocalDateString(now);
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hourCycle: 'h23' }).format(now));
  const week = weekInfo(today);
  const dates = lastNDates(today, 14);
  const isCurrentQuarter = viewed.year === week.year && viewed.quarter === week.quarter;
  const name = (user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '').split(' ')[0];

  const [visions, quests, habits, completions, planned, focusLogs, planItems] = await Promise.all([
    queryVisionsByUserId(supabase, user.id),
    queryCommittedQuests(supabase, user.id, viewed.year, viewed.quarter, true, 3),
    queryHabits(supabase, user.id),
    queryCompletionsInRange(supabase, user.id, dates[0], today),
    supabase
      .from('weekly_goal_items')
      .select('item_id, weekly_goals!inner(user_id, year, quarter, week_number)')
      .eq('weekly_goals.user_id', user.id)
      .eq('weekly_goals.year', week.year)
      .eq('weekly_goals.quarter', week.quarter)
      .eq('weekly_goals.week_number', week.weekInQuarter),
    supabase
      .from('activity_logs')
      .select('duration_minutes')
      .eq('user_id', user.id)
      .eq('type', 'FOCUS')
      .eq('local_date', today),
    supabase
      .from('daily_plan_items')
      .select('status, daily_plans!inner(user_id, plan_date)')
      .eq('daily_plans.user_id', user.id)
      .eq('daily_plans.plan_date', today),
  ]);

  const questIds = quests.map((q) => q.id);
  const { data: milestones } = questIds.length
    ? await supabase.from('milestones').select('id, quest_id, title, display_order').in('quest_id', questIds)
    : { data: [] };
  const milestoneIds = (milestones ?? []).map((m) => m.id);
  const { data: tasks } = milestoneIds.length
    ? await supabase
        .from('tasks')
        .select('id, milestone_id, title, status, display_order')
        .in('milestone_id', milestoneIds)
        .is('parent_task_id', null)
        .or('is_archived.is.null,is_archived.eq.false')
    : { data: [] };

  return {
    greeting: name ? `${greetingFor(hour)}, ${name}` : greetingFor(hour),
    dateLabel: now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    weekLabel: week.label,
    viewed: { ...viewed, label: `Q${viewed.quarter} ${viewed.year}` },
    isCurrentQuarter,
    currentQParam: formatQParam(week.year, week.quarter),
    quote: quoteOfDay(today),
    visions: buildVisionSlides(visions),
    hfg: buildHfgStepCards(
      quests,
      milestones ?? [],
      tasks ?? [],
      new Set((planned.data ?? []).map((r) => r.item_id as string)),
    ),
    habitDays: buildHabitDays(habits, completions, dates, isScheduledOn),
    focusMinutesToday: (focusLogs.data ?? []).reduce((sum, l) => sum + (l.duration_minutes ?? 0), 0),
    tasksToday: {
      done: (planItems.data ?? []).filter((i) => i.status === 'DONE').length,
      total: (planItems.data ?? []).length,
    },
  };
}
