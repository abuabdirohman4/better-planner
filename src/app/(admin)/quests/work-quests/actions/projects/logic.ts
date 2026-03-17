// NO "use server" — pure functions only, fully testable
import { WorkQuestProject, WorkQuestTask } from '../../types';
import { RawTaskRow, WorkQuestStatus } from './queries';

export function toWorkQuestTask(row: RawTaskRow): WorkQuestTask {
  return {
    id: row.id,
    parent_task_id: row.parent_task_id!,
    title: row.title,
    description: row.description || undefined,
    status: row.status as WorkQuestStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function toWorkQuestProject(
  projectRow: RawTaskRow,
  allTasks: RawTaskRow[]
): WorkQuestProject {
  const projectTasks = allTasks
    .filter(t => t.parent_task_id === projectRow.id)
    .map(toWorkQuestTask);

  return {
    id: projectRow.id,
    title: projectRow.title,
    description: projectRow.description || undefined,
    status: projectRow.status as WorkQuestStatus,
    created_at: projectRow.created_at,
    updated_at: projectRow.updated_at,
    tasks: projectTasks,
  };
}

export function buildTasksMap(tasks: RawTaskRow[]): Map<string, RawTaskRow[]> {
  const map = new Map<string, RawTaskRow[]>();
  for (const task of tasks) {
    if (!task.parent_task_id) continue;
    const existing = map.get(task.parent_task_id) ?? [];
    existing.push(task);
    map.set(task.parent_task_id, existing);
  }
  return map;
}

export function assembleProjects(
  projectRows: RawTaskRow[],
  taskRows: RawTaskRow[]
): WorkQuestProject[] {
  const tasksMap = buildTasksMap(taskRows);

  return projectRows.map(projectRow => {
    const tasks = (tasksMap.get(projectRow.id) ?? []).map(toWorkQuestTask);
    return {
      id: projectRow.id,
      title: projectRow.title,
      description: projectRow.description || undefined,
      status: projectRow.status as WorkQuestStatus,
      created_at: projectRow.created_at,
      updated_at: projectRow.updated_at,
      tasks,
    };
  });
}

export function collectAllTaskIds(projectId: string, taskIds: string[]): string[] {
  return [projectId, ...taskIds];
}
