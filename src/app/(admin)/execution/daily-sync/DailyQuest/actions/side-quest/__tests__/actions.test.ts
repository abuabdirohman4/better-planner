// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('../queries', () => ({
  insertSideQuestTask: vi.fn(),
  upsertDailyPlan: vi.fn(),
  insertSideQuestPlanItem: vi.fn(),
}));
vi.mock('../logic', () => ({
  parseSideQuestFormData: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { insertSideQuestTask, upsertDailyPlan, insertSideQuestPlanItem } from '../queries';
import { parseSideQuestFormData } from '../logic';
import { addSideQuest } from '../actions';
import { makeSupabase } from '@/test-utils/supabase-mock';

function mockCreateClient(user: { id: string } | null = { id: 'user-1' }) {
  vi.mocked(createClient).mockResolvedValue(makeSupabase({ user }));
}

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

beforeEach(() => vi.clearAllMocks());

describe('addSideQuest', () => {
  it('throws when user is not authenticated', async () => {
    mockCreateClient(null);
    const fd = makeFormData({ title: 'Read a book', date: '2026-03-20' });
    await expect(addSideQuest(fd)).rejects.toThrow('not authenticated');
  });

  it('calls insertSideQuestTask, upsertDailyPlan, insertSideQuestPlanItem and returns task', async () => {
    mockCreateClient();
    const fd = makeFormData({ title: 'Read a book', date: '2026-03-20' });
    const task = { id: 'task-1', title: 'Read a book', type: 'SIDE_QUEST', status: 'TODO', user_id: 'user-1', milestone_id: null };
    const plan = { id: 'plan-1', user_id: 'user-1', plan_date: '2026-03-20' };

    vi.mocked(parseSideQuestFormData).mockReturnValue({ title: 'Read a book', date: '2026-03-20' });
    vi.mocked(insertSideQuestTask).mockResolvedValue(task as any);
    vi.mocked(upsertDailyPlan).mockResolvedValue(plan as any);
    vi.mocked(insertSideQuestPlanItem).mockResolvedValue(undefined);

    const result = await addSideQuest(fd);

    expect(parseSideQuestFormData).toHaveBeenCalledWith(fd);
    expect(insertSideQuestTask).toHaveBeenCalledWith(expect.anything(), 'user-1', 'Read a book');
    expect(upsertDailyPlan).toHaveBeenCalledWith(expect.anything(), 'user-1', '2026-03-20');
    expect(insertSideQuestPlanItem).toHaveBeenCalledWith(expect.anything(), 'plan-1', 'task-1');
    expect(result).toEqual(task);
  });

  it('throws when parseSideQuestFormData throws (missing title)', async () => {
    mockCreateClient();
    const fd = makeFormData({ date: '2026-03-20' });
    vi.mocked(parseSideQuestFormData).mockImplementation(() => { throw new Error('Title is required'); });

    await expect(addSideQuest(fd)).rejects.toThrow('Title is required');
    expect(insertSideQuestTask).not.toHaveBeenCalled();
  });

  it('throws when parseSideQuestFormData throws (missing date)', async () => {
    mockCreateClient();
    const fd = makeFormData({ title: 'Read a book' });
    vi.mocked(parseSideQuestFormData).mockImplementation(() => { throw new Error('Date is required'); });

    await expect(addSideQuest(fd)).rejects.toThrow('Date is required');
    expect(insertSideQuestTask).not.toHaveBeenCalled();
  });

  it('propagates DB error from insertSideQuestTask', async () => {
    mockCreateClient();
    const fd = makeFormData({ title: 'Read a book', date: '2026-03-20' });
    vi.mocked(parseSideQuestFormData).mockReturnValue({ title: 'Read a book', date: '2026-03-20' });
    vi.mocked(insertSideQuestTask).mockRejectedValue(new Error('DB insert error'));

    await expect(addSideQuest(fd)).rejects.toThrow('DB insert error');
    expect(upsertDailyPlan).not.toHaveBeenCalled();
  });
});
