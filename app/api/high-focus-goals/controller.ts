import { HighFocusGoal } from "@/types";
import { getData, postData, putData, deleteData } from "@/utils/apiClient";

interface FetchFilter {
  periodName?: string;
}

export async function fetchHighFocusGoals(params: FetchFilter): Promise<any> {
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

export async function fetchHighFocusGoal(id: number): Promise<any> {
  try {
    return await getData({
      url: `/high-focus-goals/${id}`,
    });
  } catch (error) {
    console.error("Error fetching high focus goal:", error);
    throw new Error("Failed to fetch high focus goal");
  }
}

export async function createHighFocusGoal(
  payload: HighFocusGoal
): Promise<any> {
  try {
    return await postData({
      url: "/high-focus-goals",
      payload,
    });
  } catch (error) {
    console.error("Error creating high focus goal:", error);
    throw new Error("Failed to create high focus goal");
  }
}

export async function updateHighFocusGoal(
  id: number,
  payload: HighFocusGoal
): Promise<any> {
  try {
    return await putData({
      url: `/high-focus-goals/${id}`,
      payload,
    });
  } catch (error) {
    console.error("Error updating high focus goal:", error);
    throw new Error("Failed to update high focus goal");
  }
}

export async function deleteHighFocusGoal(id: number): Promise<any> {
  try {
    await deleteData({
      url: `/high-focus-goals/${id}`,
    });
  } catch (error) {
    console.error("Error deleting high focus goal:", error);
    throw new Error("Failed to delete high focus goal");
  }
}
