import useSWR from 'swr';
import { getRealWeekSchedules } from '../actions/real-week/actions';
import { getWeekStartWib } from '../actions/real-week/logic';

export function useRealWeekSchedules() {
  const weekStart = getWeekStartWib(new Date());
  const { data, isLoading, error } = useSWR(
    `best-week-real-${weekStart}`,
    () => getRealWeekSchedules(weekStart),
    // Jadwal diubah dari Daily Sync: ambil ulang tiap kali tab dibuka, jangan tunggu dedupe global 2 menit.
    { revalidateOnMount: true, dedupingInterval: 0 }
  );

  return {
    weekStart,
    blocks: data?.blocks ?? [],
    hfgs: data?.hfgs ?? [],
    isLoading,
    error,
  };
}
