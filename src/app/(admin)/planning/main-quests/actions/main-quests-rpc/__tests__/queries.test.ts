// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { rpcUpdateMainQuests } from '../queries';

describe('rpcUpdateMainQuests', () => {
  it('calls supabase.rpc with correct params', async () => {
    const data = { success: true, task: {}, milestone_id: 'm1', quest_id: 'q1' };
    const supabase = { rpc: vi.fn().mockResolvedValue({ data, error: null }) } as any;
    const result = await rpcUpdateMainQuests(supabase, 'u1', 't1', 'Title', 'DONE', 1);
    expect(supabase.rpc).toHaveBeenCalledWith('update_main_quests', {
      p_task_id: 't1',
      p_title: 'Title',
      p_status: 'DONE',
      p_display_order: 1,
      p_user_id: 'u1',
    });
    expect(result).toEqual(data);
  });

  it('throws when RPC returns error', async () => {
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'rpc error' } }) } as any;
    await expect(rpcUpdateMainQuests(supabase, 'u1', 't1', 'T', 'TODO', 1)).rejects.toMatchObject({ message: 'rpc error' });
  });

  it('passes correct status parameter', async () => {
    const data = { success: true };
    const supabase = { rpc: vi.fn().mockResolvedValue({ data, error: null }) } as any;
    await rpcUpdateMainQuests(supabase, 'u1', 't1', 'T', 'TODO', 2);
    expect(supabase.rpc).toHaveBeenCalledWith('update_main_quests', expect.objectContaining({ p_status: 'TODO' }));
  });
});
