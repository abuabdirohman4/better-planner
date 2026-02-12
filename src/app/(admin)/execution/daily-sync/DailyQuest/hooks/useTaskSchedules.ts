import useSWR from "swr";
import { getTaskSchedules } from "../actions/scheduleActions";

export function useTaskSchedules(taskId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    taskId ? `task-schedules-${taskId}` : null,
    () => getTaskSchedules(taskId),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    schedules: data || [],
    isLoading,
    error,
    mutate,
  };
}
