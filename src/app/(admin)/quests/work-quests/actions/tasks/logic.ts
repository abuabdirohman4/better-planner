// NO "use server"
import { WorkQuestTask } from '../../types';
import { RawTaskRow } from './queries';

export function toWorkQuestTask(row: RawTaskRow): WorkQuestTask {
  return {
    id: row.id,
    parent_task_id: row.parent_task_id!,
    title: row.title,
    description: row.description || undefined,
    status: row.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
