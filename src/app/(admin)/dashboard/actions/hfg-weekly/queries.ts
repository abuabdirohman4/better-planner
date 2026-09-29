import type { SupabaseClient } from '@supabase/supabase-js';
import type { HfgWeeklyRow } from './logic';

export async function rpcHfgWeeklyStatus(supabase: SupabaseClient, userId: string): Promise<HfgWeeklyRow[]> {
  const { data, error } = await supabase.rpc('hfg_weekly_status', { p_user_id: userId });
  if (error) throw error;
  return (data ?? []) as HfgWeeklyRow[];
}
