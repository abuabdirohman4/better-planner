"use server";

import { createClient } from '@/lib/supabase/server';
import { rpcHfgWeeklyStatus } from './queries';
import { buildHfgSummary, type HfgWeeklySummary } from './logic';

export type { HfgWeeklySummary };

export async function getHfgWeeklyStatus(): Promise<HfgWeeklySummary> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { weekLabel: null, cards: [] };
  return buildHfgSummary(await rpcHfgWeeklyStatus(supabase, user.id));
}
