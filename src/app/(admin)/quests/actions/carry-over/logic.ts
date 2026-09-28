// NO "use server" — pure functions only
export type CarryOverType = 'DAILY_QUEST' | 'SIDE_QUEST' | 'WORK_QUEST';

export interface SourceTask {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  is_archived?: boolean | null;
  focus_duration?: number | null;
  parent_task_id?: string | null;
}

export interface CarryOverCandidate {
  id: string;
  title: string;
  detail: string | null;    // Work: "3 tugas belum selesai"; lainnya null
  alreadyExists: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();

export function isCandidate(type: CarryOverType, t: SourceTask): boolean {
  if (type === 'DAILY_QUEST') return !t.is_archived;
  return t.status !== 'DONE';
}

export function buildCandidates(
  type: CarryOverType,
  sourceTop: SourceTask[],
  sourceChildren: SourceTask[],
  targetTitles: string[]
): CarryOverCandidate[] {
  const existing = new Set(targetTitles.map(norm));
  return sourceTop.filter(t => isCandidate(type, t)).map(t => {
    const openChildren = sourceChildren.filter(c => c.parent_task_id === t.id && c.status !== 'DONE').length;
    return {
      id: t.id,
      title: t.title,
      detail: type === 'WORK_QUEST' ? `${openChildren} tugas belum selesai` : null,
      alreadyExists: existing.has(norm(t.title)),
    };
  });
}

export function buildCopyRow(type: CarryOverType, t: SourceTask, userId: string, createdAt: string, parentId: string | null = null) {
  const row: Record<string, unknown> = {
    user_id: userId,
    title: t.title,
    description: t.description ?? null,
    type,
    status: 'TODO',
    milestone_id: null,
    parent_task_id: parentId,
    created_at: createdAt,
  };
  if (type === 'DAILY_QUEST') row.focus_duration = t.focus_duration ?? 25;
  return row;
}
