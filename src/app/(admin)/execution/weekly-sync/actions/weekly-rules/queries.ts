// NO "use server" — importable in tests
import { SupabaseClient } from '@supabase/supabase-js';

export async function queryLastRuleDisplayOrder(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number,
  weekNumber: number
): Promise<number | undefined> {
  const { data, error } = await supabase
    .from('weekly_rules')
    .select('display_order')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .eq('week_number', weekNumber)
    .order('display_order', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.display_order;
}

export async function insertWeeklyRule(
  supabase: SupabaseClient,
  data: {
    userId: string;
    ruleText: string;
    year: number;
    quarter: number;
    weekNumber: number;
    displayOrder: number;
  }
): Promise<{ id: string }> {
  const { data: inserted, error } = await supabase
    .from('weekly_rules')
    .insert({
      user_id: data.userId,
      rule_text: data.ruleText,
      year: data.year,
      quarter: data.quarter,
      week_number: data.weekNumber,
      display_order: data.displayOrder,
    })
    .select('id')
    .single();
  if (error) throw error;
  return inserted;
}

export async function updateWeeklyRuleText(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  newText: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_rules')
    .update({ rule_text: newText })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteWeeklyRuleById(
  supabase: SupabaseClient,
  id: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_rules')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateRuleDisplayOrder(
  supabase: SupabaseClient,
  id: string,
  displayOrder: number
): Promise<void> {
  const { error } = await supabase
    .from('weekly_rules')
    .update({ display_order: displayOrder })
    .eq('id', id);
  if (error) throw error;
}
