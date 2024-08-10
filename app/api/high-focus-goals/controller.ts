import { getData } from "@/utils/apiClient";

interface HighFocusGoalFilter {
  periodName?: string;
}

export async function fetchHighFocusGoals(
  params: HighFocusGoalFilter = {}
): Promise<any> {
  try {
    return await getData({
      url: "/high-focus-goals",
      params,
    });
  } catch (error) {
    console.error("Error fetching high focus goals:", error);
    throw new Error("Failed to fetch high focus goals");
  }
}
