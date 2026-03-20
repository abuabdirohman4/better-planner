export interface ParsedActivityFormData {
  taskId: string;
  sessionType: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  date: string;
  startTime: string;
  endTime: string;
  whatDone: string | undefined;
  whatThink: string | undefined;
}

export function parseActivityFormData(formData: FormData): ParsedActivityFormData {
  const taskId = formData.get('taskId')?.toString();
  const sessionType = formData.get('sessionType')?.toString() as 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  const date = formData.get('date')?.toString();
  const startTime = formData.get('startTime')?.toString();
  const endTime = formData.get('endTime')?.toString();
  const whatDone = formData.get('whatDone')?.toString();
  const whatThink = formData.get('whatThink')?.toString();

  if (!taskId || !sessionType || !date || !startTime || !endTime) {
    throw new Error('Missing required fields');
  }

  return { taskId, sessionType, date, startTime, endTime, whatDone, whatThink };
}

export function calculateDurationMinutes(startTime: string, endTime: string): number {
  const durationInSeconds = Math.floor(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
  );
  return Math.max(1, Math.round(durationInSeconds / 60));
}

export function enrichLogsWithHierarchy<T extends { task_id?: string | null }>(
  logs: T[],
  tasks: Array<{ id: string; title: string; type: string; milestone_id?: string | null }>,
  milestones: Array<{ id: string; title: string; quest_id?: string | null }>,
  quests: Array<{ id: string; title: string }>,
): Array<T & {
  task_title: string | null;
  task_type: string | null;
  milestone_id: string | null;
  milestone_title: string | null;
  quest_id: string | null;
  quest_title: string | null;
}> {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const milestoneMap = new Map(milestones.map((m) => [m.id, m]));
  const questMap = new Map(quests.map((q) => [q.id, q]));

  return logs.map((log) => {
    let task_title: string | null = null;
    let task_type: string | null = null;
    let milestone_id: string | null = null;
    let milestone_title: string | null = null;
    let quest_id: string | null = null;
    let quest_title: string | null = null;

    if (log.task_id) {
      const task = taskMap.get(log.task_id);
      if (task) {
        task_title = task.title;
        task_type = task.type;
        milestone_id = task.milestone_id ?? null;
        if (milestone_id) {
          const milestone = milestoneMap.get(milestone_id);
          if (milestone) {
            milestone_title = milestone.title;
            quest_id = milestone.quest_id ?? null;
            if (quest_id) {
              const quest = questMap.get(quest_id);
              if (quest) quest_title = quest.title;
            }
          }
        }
      }
    }

    return { ...log, task_title, task_type, milestone_id, milestone_title, quest_id, quest_title };
  });
}
