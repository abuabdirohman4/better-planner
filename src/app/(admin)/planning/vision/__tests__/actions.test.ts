// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import { getVisions, upsertVision } from '../actions';

describe('getVisions', () => {
  it('returns empty array when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getVisions();
    expect(result).toEqual([]);
  });

  it('returns visions when authenticated', async () => {
    const rows = [{ id: 'v1', life_area: 'Karier/Bisnis' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getVisions();
    expect(result).toEqual(rows);
  });

  it('returns empty array on db error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'err' } });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getVisions();
    expect(result).toEqual([]);
  });
});

describe('upsertVision', () => {
  it('returns early when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const formData = new FormData();
    await expect(upsertVision(formData)).resolves.toBeUndefined();
  });

  it('upserts visions for all life areas', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const formData = new FormData();
    // Action will process LIFE_AREAS from constants
    await expect(upsertVision(formData)).resolves.toBeUndefined();
    // Upsert should have been called for each life area
    expect(builder.upsert).toHaveBeenCalled();
  });
});
