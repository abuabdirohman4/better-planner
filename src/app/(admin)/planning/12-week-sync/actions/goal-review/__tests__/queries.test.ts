// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryUpsertGoalReview } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryUpsertGoalReview', () => {
  it('calls update with score and notes', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryUpsertGoalReview(supabase, 'gr1', 'r1', 8, 'great work');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      progress_score: 8,
      achievement_notes: 'great work',
    }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'gr1');
    expect(builder.eq).toHaveBeenCalledWith('quarterly_review_id', 'r1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeFrom(builder);
    await expect(queryUpsertGoalReview(supabase, 'gr1', 'r1', 5, null)).rejects.toMatchObject({ message: 'upsert fail' });
  });
});
