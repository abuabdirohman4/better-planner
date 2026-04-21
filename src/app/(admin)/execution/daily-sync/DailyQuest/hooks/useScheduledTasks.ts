import useSWR from "swr";
import { getScheduledTasksByDate } from "../actions";

export function useScheduledTasks(date: string) {
  const { data, error, isLoading, mutate } = useSWR(
    date ? `scheduled-tasks-${date}` : null,
    () => getScheduledTasksByDate(date),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000, // 5 menit
    }
  );

  return {
    scheduledTasks: data || [],
    isLoading,
    error,
    mutate,
  };
}
