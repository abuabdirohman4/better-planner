import { Task } from "@/types";
import { getData, postData } from "@/utils/apiClient";

interface TaskFilter {
  periodName?: string;
  highFocusGoalId?: number;
  milestoneId?: number;
}

export async function fetchTask(filter: TaskFilter = {}): Promise<any> {
  try {
    const params: Record<string, any> = {};
    if (filter.periodName !== undefined) params.periodName = filter.periodName;
    if (filter.highFocusGoalId !== undefined)
      params.highFocusGoalId = filter.highFocusGoalId;
    if (filter.milestoneId !== undefined)
      params.milestoneId = filter.milestoneId;

    return await getData({
      url: "/high-focus-goal",
      params,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    throw new Error("Failed to fetch task");
  }
}

export async function createTask(payload: Task) {
  try {
    return await postData({
      url: `/task`,
      payload: payload,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    throw new Error("Failed to create task");
  }
}
