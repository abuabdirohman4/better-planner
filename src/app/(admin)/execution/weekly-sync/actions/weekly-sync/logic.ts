// NO "use server" — pure functions, no DB calls

export interface WeeklySyncResult {
  goals: any[];
  rules: any[];
}

export function normalizeWeeklySyncData(data: any): WeeklySyncResult {
  return {
    goals: data?.goals || [],
    rules: data?.rules || [],
  };
}
