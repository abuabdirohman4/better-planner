// NO "use server" — pure functions, no DB calls

export function buildExistingStatusMap(
  items: { item_id: string; status: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    map.set(item.item_id, item.status);
  }
  return map;
}

export function deduplicateItems<T extends { id: string }>(items: T[]): T[] {
  return items.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));
}

export function buildGoalItemsToInsert(
  items: { id: string; type: string }[],
  weeklyGoalId: string,
  statusMap: Map<string, string>
): { weekly_goal_id: string; item_id: string; status: string }[] {
  return items.map((item) => ({
    weekly_goal_id: weeklyGoalId,
    item_id: item.id,
    status: statusMap.get(item.id) || 'TODO',
  }));
}
