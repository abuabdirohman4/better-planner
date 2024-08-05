import { getData, postData } from "@/utils/apiClient";

interface PeriodFilter {
  year?: number;
  quarter?: number;
}

export async function fetchPeriod(filter: PeriodFilter = {}): Promise<any> {
  try {
    const params: Record<string, any> = {};
    if (filter.year !== undefined) params.year = filter.year;
    if (filter.quarter !== undefined) params.quarter = filter.quarter;

    return await getData({
      url: "/period",
      params,
    });
  } catch (error) {
    console.error("Error fetching period:", error);
    throw new Error("Failed to fetch period");
  }
}

export async function createPeriod({ year }: { year: number }) {
  try {
    return await postData({
      url: `/period`,
      payload: { year },
    });
  } catch (error) {
    console.error("Error creating period:", error);
    throw new Error("Failed to create period");
  }
}
