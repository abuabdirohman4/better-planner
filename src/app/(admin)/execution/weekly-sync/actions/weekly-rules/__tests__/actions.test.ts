// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { addWeeklyRule, updateWeeklyRule, deleteWeeklyRule, updateWeeklyRuleOrder } from '../actions';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

describe('addWeeklyRule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns failure when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const formData = new FormData();
    formData.set('rule_text', 'test');
    formData.set('year', '2026');
    formData.set('quarter', '1');
    formData.set('week_number', '3');
    const result = await addWeeklyRule(formData);
    expect(result).toEqual({ success: false, message: 'User not found' });
  });

  it('returns failure on DB error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from: vi.fn().mockImplementation(() => {
        throw new Error('DB error');
      }),
    } as any;
    mockCreateClient.mockResolvedValue(supabase);
    const formData = new FormData();
    formData.set('rule_text', 'test');
    formData.set('year', '2026');
    formData.set('quarter', '1');
    formData.set('week_number', '3');
    const result = await addWeeklyRule(formData);
    expect(result).toEqual({ success: false, message: 'Gagal menambah aturan' });
    consoleSpy.mockRestore();
  });
});

describe('updateWeeklyRule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns failure when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const result = await updateWeeklyRule('rule-1', 'new text');
    expect(result).toEqual({ success: false, message: 'User not found' });
  });

  it('returns success on valid update', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await updateWeeklyRule('rule-1', 'new text');
    expect(result).toEqual({ success: true, message: 'Aturan berhasil diupdate!' });
  });
});

describe('deleteWeeklyRule', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns failure when user is not authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase({ user: null }));
    const result = await deleteWeeklyRule('rule-1');
    expect(result).toEqual({ success: false, message: 'User not found' });
  });

  it('returns success on valid delete', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await deleteWeeklyRule('rule-1');
    expect(result).toEqual({ success: true, message: 'Aturan berhasil dihapus!' });
  });
});

describe('updateWeeklyRuleOrder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns success immediately for empty rules array (noop)', async () => {
    const supabase = makeSupabase();
    mockCreateClient.mockResolvedValue(supabase);
    const result = await updateWeeklyRuleOrder([]);
    expect(result).toEqual({ success: true });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('returns success when all updates succeed', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    mockCreateClient.mockResolvedValue(makeSupabase({ fromBuilder: b }));
    const result = await updateWeeklyRuleOrder([
      { id: 'r1', display_order: 1 },
      { id: 'r2', display_order: 2 },
    ]);
    expect(result).toEqual({ success: true });
  });
});
