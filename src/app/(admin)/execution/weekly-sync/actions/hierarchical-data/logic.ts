// NO "use server" — pure functions, no DB calls

export function buildMilestoneMap(
  milestones: { id: string; title: string; quest_id: string }[]
): Map<string, typeof milestones> {
  const map = new Map<string, typeof milestones>();
  for (const m of milestones) {
    const arr = map.get(m.quest_id) || [];
    arr.push(m);
    map.set(m.quest_id, arr);
  }
  return map;
}

export function buildTaskMap(
  tasks: { id: string; title: string; status: string; milestone_id: string }[]
): Map<string, typeof tasks> {
  const map = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const arr = map.get(t.milestone_id) || [];
    arr.push(t);
    map.set(t.milestone_id, arr);
  }
  return map;
}

export function buildSubtaskMap(
  subtasks: { id: string; title: string; status: string; parent_task_id: string }[]
): Map<string, typeof subtasks> {
  const map = new Map<string, typeof subtasks>();
  for (const s of subtasks) {
    const arr = map.get(s.parent_task_id) || [];
    arr.push(s);
    map.set(s.parent_task_id, arr);
  }
  return map;
}

export function assembleHierarchy(
  quests: { id: string; title: string }[],
  milestoneMap: Map<string, any[]>,
  taskMap: Map<string, any[]>,
  subtaskMap: Map<string, any[]>
): any[] {
  return quests.map((quest) => ({
    ...quest,
    milestones: (milestoneMap.get(quest.id) || []).map((milestone) => ({
      ...milestone,
      tasks: (taskMap.get(milestone.id) || []).map((task) => ({
        ...task,
        subtasks: subtaskMap.get(task.id) || [],
      })),
    })),
  }));
}
