// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/quarterUtils', () => ({
  getQuarterDates: vi.fn().mockReturnValue({
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
  }),
}));
vi.mock('../queries', () => ({
  queryProjectsByQuarter: vi.fn(),
  queryTasksByProjectIds: vi.fn(),
  queryProjectById: vi.fn(),
  queryTasksByProjectId: vi.fn(),
  insertProject: vi.fn(),
  updateProjectTitle: vi.fn(),
  updateProjectStatus: vi.fn(),
  deleteProjectById: vi.fn(),
  deleteTasksByProjectId: vi.fn(),
  queryTimerSessionIdsByTaskIds: vi.fn(),
  deleteTimerEventsBySessionIds: vi.fn(),
  deleteTimerSessionsByTaskIds: vi.fn(),
  deleteActivityLogsByTaskIds: vi.fn(),
  deleteDailyPlanItemsByTaskIds: vi.fn(),
}));
vi.mock('../logic', () => ({
  assembleProjects: vi.fn(),
  toWorkQuestProject: vi.fn(),
  collectAllTaskIds: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  queryProjectsByQuarter,
  queryTasksByProjectIds,
  queryProjectById,
  queryTasksByProjectId,
  insertProject,
  updateProjectTitle,
  updateProjectStatus,
  deleteProjectById,
  deleteTasksByProjectId,
  queryTimerSessionIdsByTaskIds,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskIds,
  deleteActivityLogsByTaskIds,
  deleteDailyPlanItemsByTaskIds,
} from '../queries';
import { assembleProjects, toWorkQuestProject, collectAllTaskIds } from '../logic';
import {
  getWorkQuestProjects,
  createWorkQuestProject,
  updateWorkQuestProject,
  toggleWorkQuestProjectStatus,
  deleteWorkQuestProject,
} from '../actions';
import { makeSupabase, makeQueryBuilder } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  const supabase = makeSupabase({ user });
  vi.mocked(createClient).mockResolvedValue(supabase);
  return supabase;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWorkQuestProjects', () => {
  it('returns empty array when user not authenticated', async () => {
    mockCreateClient(null);
    const result = await getWorkQuestProjects(2026, 1);
    expect(result).toEqual([]);
  });

  it('returns empty array when no projects found', async () => {
    mockCreateClient();
    vi.mocked(queryProjectsByQuarter).mockResolvedValue([]);
    const result = await getWorkQuestProjects(2026, 1);
    expect(result).toEqual([]);
    expect(queryTasksByProjectIds).not.toHaveBeenCalled();
  });

  it('calls assembleProjects with project rows and task rows', async () => {
    mockCreateClient();
    const projectRows = [{ id: 'proj-1', title: 'P1' }] as any;
    const taskRows = [{ id: 'task-1', parent_task_id: 'proj-1' }] as any;
    const assembled = [{ id: 'proj-1', tasks: [] }] as any;
    vi.mocked(queryProjectsByQuarter).mockResolvedValue(projectRows);
    vi.mocked(queryTasksByProjectIds).mockResolvedValue(taskRows);
    vi.mocked(assembleProjects).mockReturnValue(assembled);

    const result = await getWorkQuestProjects(2026, 1);

    expect(queryTasksByProjectIds).toHaveBeenCalledWith(expect.anything(), ['proj-1']);
    expect(assembleProjects).toHaveBeenCalledWith(projectRows, taskRows);
    expect(result).toEqual(assembled);
  });
});

describe('createWorkQuestProject', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(createWorkQuestProject({ title: 'Test' })).rejects.toThrow('not authenticated');
  });

  it('calls insertProject and revalidatePath', async () => {
    mockCreateClient();
    const newRow = { id: 'new-proj', title: 'Test' } as any;
    vi.mocked(insertProject).mockResolvedValue(newRow);
    // getWorkQuestProjectById calls queryProjectById + queryTasksByProjectId
    vi.mocked(queryProjectById).mockResolvedValue(newRow);
    vi.mocked(queryTasksByProjectId).mockResolvedValue([]);
    vi.mocked(toWorkQuestProject).mockReturnValue({ id: 'new-proj', title: 'Test', tasks: [] } as any);

    await createWorkQuestProject({ title: 'Test' });

    expect(insertProject).toHaveBeenCalledWith(expect.anything(), 'user-1', 'Test');
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('updateWorkQuestProject', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateWorkQuestProject('proj-1', { title: 'New' })).rejects.toThrow('not authenticated');
  });

  it('calls updateProjectTitle with correct args', async () => {
    mockCreateClient();
    const row = { id: 'proj-1', title: 'New' } as any;
    vi.mocked(updateProjectTitle).mockResolvedValue(undefined);
    vi.mocked(queryProjectById).mockResolvedValue(row);
    vi.mocked(queryTasksByProjectId).mockResolvedValue([]);
    vi.mocked(toWorkQuestProject).mockReturnValue({ id: 'proj-1', title: 'New', tasks: [] } as any);

    await updateWorkQuestProject('proj-1', { title: 'New' });

    expect(updateProjectTitle).toHaveBeenCalledWith(expect.anything(), 'user-1', 'proj-1', 'New');
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('toggleWorkQuestProjectStatus', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(toggleWorkQuestProjectStatus('proj-1', 'DONE')).rejects.toThrow('not authenticated');
  });

  it('calls updateProjectStatus and revalidatePath', async () => {
    mockCreateClient();
    vi.mocked(updateProjectStatus).mockResolvedValue(undefined);

    await toggleWorkQuestProjectStatus('proj-1', 'DONE');

    expect(updateProjectStatus).toHaveBeenCalledWith(expect.anything(), 'user-1', 'proj-1', 'DONE');
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('deleteWorkQuestProject', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(deleteWorkQuestProject('proj-1')).rejects.toThrow('not authenticated');
  });

  it('runs full cascade cleanup in correct order', async () => {
    const supabase = mockCreateClient();
    // supabase.from() used inline for task query in deleteWorkQuestProject
    const taskBuilder = makeQueryBuilder({ data: [{ id: 'task-1' }], error: null });
    vi.mocked(supabase.from).mockReturnValue(taskBuilder);

    vi.mocked(collectAllTaskIds).mockReturnValue(['task-1', 'proj-1']);
    vi.mocked(queryTimerSessionIdsByTaskIds).mockResolvedValue(['sess-1']);
    vi.mocked(deleteTimerEventsBySessionIds).mockResolvedValue(undefined);
    vi.mocked(deleteTimerSessionsByTaskIds).mockResolvedValue(undefined);
    vi.mocked(deleteActivityLogsByTaskIds).mockResolvedValue(undefined);
    vi.mocked(deleteDailyPlanItemsByTaskIds).mockResolvedValue(undefined);
    vi.mocked(deleteTasksByProjectId).mockResolvedValue(undefined);
    vi.mocked(deleteProjectById).mockResolvedValue(undefined);

    await deleteWorkQuestProject('proj-1');

    expect(queryTimerSessionIdsByTaskIds).toHaveBeenCalled();
    expect(deleteTimerEventsBySessionIds).toHaveBeenCalledWith(expect.anything(), ['sess-1']);
    expect(deleteTimerSessionsByTaskIds).toHaveBeenCalled();
    expect(deleteActivityLogsByTaskIds).toHaveBeenCalled();
    expect(deleteDailyPlanItemsByTaskIds).toHaveBeenCalled();
    expect(deleteTasksByProjectId).toHaveBeenCalled();
    expect(deleteProjectById).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
  });
});
