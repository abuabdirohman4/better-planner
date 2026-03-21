// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('../queries', () => ({
  insertTask: vi.fn(),
  updateTaskTitle: vi.fn(),
  updateTaskStatus: vi.fn(),
  deleteTaskById: vi.fn(),
  queryTimerSessionIdsByTaskId: vi.fn(),
  deleteTimerEventsBySessionIds: vi.fn(),
  deleteTimerSessionsByTaskId: vi.fn(),
  deleteActivityLogsByTaskId: vi.fn(),
  deleteDailyPlanItemsByTaskId: vi.fn(),
}));
vi.mock('../logic', () => ({ toWorkQuestTask: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  insertTask,
  updateTaskTitle,
  updateTaskStatus,
  deleteTaskById,
  queryTimerSessionIdsByTaskId,
  deleteTimerEventsBySessionIds,
  deleteTimerSessionsByTaskId,
  deleteActivityLogsByTaskId,
  deleteDailyPlanItemsByTaskId,
} from '../queries';
import { toWorkQuestTask } from '../logic';
import {
  createWorkQuestTask,
  updateWorkQuestTask,
  toggleWorkQuestTaskStatus,
  deleteWorkQuestTask,
} from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }));
}

beforeEach(() => vi.clearAllMocks());

describe('createWorkQuestTask', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(createWorkQuestTask('proj-1', { title: 'T' })).rejects.toThrow('not authenticated');
  });

  it('calls insertTask and returns transformed task', async () => {
    mockCreateClient();
    const row = { id: 'task-1', title: 'My Task' } as any;
    const task = { id: 'task-1', title: 'My Task', status: 'TODO' } as any;
    vi.mocked(insertTask).mockResolvedValue(row);
    vi.mocked(toWorkQuestTask).mockReturnValue(task);

    const result = await createWorkQuestTask('proj-1', { title: 'My Task' });

    expect(insertTask).toHaveBeenCalledWith(expect.anything(), 'user-1', 'proj-1', 'My Task');
    expect(toWorkQuestTask).toHaveBeenCalledWith(row);
    expect(result).toEqual(task);
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('updateWorkQuestTask', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(updateWorkQuestTask('task-1', { title: 'T' })).rejects.toThrow('not authenticated');
  });

  it('calls updateTaskTitle and returns transformed task', async () => {
    mockCreateClient();
    const row = { id: 'task-1', title: 'New' } as any;
    const task = { id: 'task-1', title: 'New', status: 'TODO' } as any;
    vi.mocked(updateTaskTitle).mockResolvedValue(row);
    vi.mocked(toWorkQuestTask).mockReturnValue(task);

    const result = await updateWorkQuestTask('task-1', { title: 'New' });

    expect(updateTaskTitle).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1', 'New');
    expect(result).toEqual(task);
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('toggleWorkQuestTaskStatus', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(toggleWorkQuestTaskStatus('task-1', 'DONE')).rejects.toThrow('not authenticated');
  });

  it('calls updateTaskStatus and revalidatePath', async () => {
    mockCreateClient();
    vi.mocked(updateTaskStatus).mockResolvedValue(undefined);

    await toggleWorkQuestTaskStatus('task-1', 'DONE');

    expect(updateTaskStatus).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1', 'DONE');
    expect(revalidatePath).toHaveBeenCalled();
  });
});

describe('deleteWorkQuestTask', () => {
  it('throws when user not authenticated', async () => {
    mockCreateClient(null);
    await expect(deleteWorkQuestTask('task-1')).rejects.toThrow('not authenticated');
  });

  it('runs cascade cleanup in correct order', async () => {
    mockCreateClient();
    vi.mocked(queryTimerSessionIdsByTaskId).mockResolvedValue(['sess-1']);
    vi.mocked(deleteTimerEventsBySessionIds).mockResolvedValue(undefined);
    vi.mocked(deleteTimerSessionsByTaskId).mockResolvedValue(undefined);
    vi.mocked(deleteActivityLogsByTaskId).mockResolvedValue(undefined);
    vi.mocked(deleteDailyPlanItemsByTaskId).mockResolvedValue(undefined);
    vi.mocked(deleteTaskById).mockResolvedValue(undefined);

    await deleteWorkQuestTask('task-1');

    expect(queryTimerSessionIdsByTaskId).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1');
    expect(deleteTimerEventsBySessionIds).toHaveBeenCalledWith(expect.anything(), ['sess-1']);
    expect(deleteTimerSessionsByTaskId).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1');
    expect(deleteActivityLogsByTaskId).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1');
    expect(deleteDailyPlanItemsByTaskId).toHaveBeenCalledWith(expect.anything(), 'task-1');
    expect(deleteTaskById).toHaveBeenCalledWith(expect.anything(), 'user-1', 'task-1');
    expect(revalidatePath).toHaveBeenCalled();
  });
});
