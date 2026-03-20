// NO "use server" — pure functions, no DB calls

export function buildTitleMap(tasks: { id: string; title: string }[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const task of tasks) {
    map[task.id] = task.title;
  }
  return map;
}

export function resolveWeekDate(weekDate?: string): string {
  return weekDate || new Date().toISOString().split('T')[0];
}
