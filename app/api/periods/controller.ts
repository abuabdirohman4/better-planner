import { getData, postData } from "@/utils/apiClient";

interface FetchFilter {
  name?: string;
  year?: number;
  quarter?: number;
}

export async function fetchPeriods(params: FetchFilter): Promise<any> {
  try {
    return await getData({
      url: "/periods",
      params,
    });
  } catch (error) {
    console.error("Error fetching periods:", error);
    throw new Error("Failed to fetch periods");
  }
}

export async function createPeriod({ year }: { year: number }) {
  try {
    return await postData({
      url: `/periods`,
      payload: { year },
    });
  } catch (error) {
    console.error("Error creating period:", error);
    throw new Error("Failed to create period");
  }
}
