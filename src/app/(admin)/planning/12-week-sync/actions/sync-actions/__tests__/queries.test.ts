// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryToggleSyncAction } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryToggleSyncAction', () => {
  it('sets is_completed true when completing', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryToggleSyncAction(supabase, 'sa1', 'r1', true);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: true,
    }));
  });

  it('sets is_completed false and completed_at null when uncompleting', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryToggleSyncAction(supabase, 'sa1', 'r1', false);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: false,
      completed_at: null,
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'toggle fail' } });
    const supabase = makeFrom(builder);
    await expect(queryToggleSyncAction(supabase, 'sa1', 'r1', true)).rejects.toMatchObject({ message: 'toggle fail' });
  });
});
