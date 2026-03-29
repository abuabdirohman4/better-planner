// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryUpdateReview,
  queryCompleteReview,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryUpdateReview', () => {
  it('calls update with correct payload and eq filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryUpdateReview(supabase, 'r1', 'u1', { challenges_faced: 'hard' });
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ challenges_faced: 'hard' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'r1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(queryUpdateReview(supabase, 'r1', 'u1', {})).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('queryCompleteReview', () => {
  it('sets is_completed true and completed_at', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryCompleteReview(supabase, 'r1', 'u1');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: true,
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'complete fail' } });
    const supabase = makeFrom(builder);
    await expect(queryCompleteReview(supabase, 'r1', 'u1')).rejects.toMatchObject({ message: 'complete fail' });
  });
});
