import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';

// Define key for SWR
const timeAnalysisKey = (date: string) => ['daily-sync', 'time-analysis', date];

async function fetchTimeAnalysis(date: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { focusTime: 0, breakTime: 0, sessionCount: 0 };

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('type, duration_minutes')
    .eq('user_id', user.id)
    .eq('local_date', date);

  if (error) throw error;

  let focus = 0;
  let breaks = 0;
  let sessions = 0;

  logs?.forEach(log => {
    if (log.type === 'FOCUS') {
      focus += (log.duration_minutes || 0);
      sessions++;
    } else if (['SHORT_BREAK', 'LONG_BREAK', 'BREAK'].includes(log.type)) {
      breaks += (log.duration_minutes || 0);
    }
  });

  return { focusTime: focus, breakTime: breaks, sessionCount: sessions };
}

export function useTimeAnalysis(date: string) {
  const { data, error, isLoading } = useSWR(
    date ? timeAnalysisKey(date) : null,
    () => fetchTimeAnalysis(date),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true
    }
  );

  return {
    focusTime: data?.focusTime || 0,
    breakTime: data?.breakTime || 0,
    sessionCount: data?.sessionCount || 0,
    isLoading,
    error
  };
}
