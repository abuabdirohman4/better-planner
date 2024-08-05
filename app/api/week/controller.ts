import { getData, postData } from "@/utils/apiClient";

interface WeekFilter {
  periodName?: string;
  week?: number;
}

export async function fetchWeek(filter: WeekFilter = {}): Promise<any> {
  try {
    const params: Record<string, any> = {};
    if (filter.periodName !== undefined) params.periodName = filter.periodName;
    if (filter.week !== undefined) params.week = filter.week;

    console.log("params", params);
    return await getData({
      url: "/week",
      params,
    });
  } catch (error) {
    console.error("Error fetching week:", error);
    throw new Error("Failed to fetch week");
  }
}

export async function createWeek() {
  try {
    return await postData({
      url: `/week`,
    });
  } catch (error) {
    console.error("Error creating week:", error);
    throw new Error("Failed to create week");
  }
}
