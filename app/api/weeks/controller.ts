import { getData, postData } from "@/utils/apiClient";

interface FetchFilter {
  periodName?: string;
  week?: number;
}

export async function fetchWeeks(params: FetchFilter = {}): Promise<any> {
  try {
    return await getData({
      url: "/weeks",
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
      url: `/weeks`,
    });
  } catch (error) {
    console.error("Error creating week:", error);
    throw new Error("Failed to create week");
  }
}
