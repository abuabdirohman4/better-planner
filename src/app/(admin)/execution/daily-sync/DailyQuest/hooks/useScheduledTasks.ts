import useSWR from "swr";
import { getScheduledTasksByDate } from "../actions/scheduleActions";

export function useScheduledTasks(date: string) {
  const { data, error, isLoading, mutate } = useSWR(
    date ? `scheduled-tasks-${date}` : null,
    () => getScheduledTasksByDate(date),
    {
      revalidateOnFocus: true, // Auto update when switching tabs/windows
    }
  );

  return {
    scheduledTasks: data || [],
    isLoading,
    error,
    mutate,
  };
}
