import { getData } from "@/utils/apiClient";

interface HighFocusGoalFilter {
  periodName?: string;
}

export async function fetchHighFocusGoal(filter: HighFocusGoalFilter = {}): Promise<any> {
  try {
    const params: Record<string, any> = {};
    if (filter.periodName !== undefined) params.periodName = filter.periodName;

    return await getData({
      url: "/high-focus-goal",
      params,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    throw new Error("Failed to fetch task");
  }
}