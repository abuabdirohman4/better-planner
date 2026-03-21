// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { updateMainQuestTask, updateMainQuestSubtask } from '../actions';

function makeRpcSupabase(data: any, error: any = null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data, error }),
  } as any;
}

describe('updateMainQuestTask', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateMainQuestTask('t1', 'T', 'TODO', 1)).rejects.toThrow('User not authenticated');
  });

  it('returns formatted result on success', async () => {
    const rpcData = { success: true, task: { id: 't1' }, milestone_id: 'm1', quest_id: 'q1' };
    (createClient as any).mockResolvedValue(makeRpcSupabase(rpcData));
    const result = await updateMainQuestTask('t1', 'Title', 'DONE', 1);
    expect(result.success).toBe(true);
    expect(result.milestoneId).toBe('m1');
  });

  it('throws when RPC returns success: false', async () => {
    const rpcData = { success: false, error: 'Failed to update task' };
    (createClient as any).mockResolvedValue(makeRpcSupabase(rpcData));
    await expect(updateMainQuestTask('t1', 'T', 'TODO', 1)).rejects.toThrow('Failed to update task');
  });

  it('throws on RPC error', async () => {
    (createClient as any).mockResolvedValue(makeRpcSupabase(null, { message: 'rpc fail' }));
    await expect(updateMainQuestTask('t1', 'T', 'TODO', 1)).rejects.toMatchObject({ message: 'rpc fail' });
  });
});

describe('updateMainQuestSubtask', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateMainQuestSubtask('t1', 'T', 'TODO', 1)).rejects.toThrow('User not authenticated');
  });

  it('returns formatted result on success', async () => {
    const rpcData = { success: true, task: {}, milestone_id: 'm1', quest_id: 'q1' };
    (createClient as any).mockResolvedValue(makeRpcSupabase(rpcData));
    const result = await updateMainQuestSubtask('t1', 'Title', 'DONE', 1);
    expect(result.success).toBe(true);
  });
});
