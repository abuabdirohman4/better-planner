// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryVisionsByUserId, upsertVisionForArea } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryVisionsByUserId', () => {
  it('returns visions for a user', async () => {
    const rows = [{ id: 'v1', life_area: 'Karier/Bisnis', vision_3_5_year: 'CEO', vision_10_year: 'Entrepreneur' }];
    const builder = makeQueryBuilder({ data: rows, error: null });
    const supabase = makeFrom(builder);
    const result = await queryVisionsByUserId(supabase, 'u1');
    expect(result).toEqual(rows);
    expect(supabase.from).toHaveBeenCalledWith('visions');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('returns empty array on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'db err' } });
    const supabase = makeFrom(builder);
    const result = await queryVisionsByUserId(supabase, 'u1');
    expect(result).toEqual([]);
  });

  it('returns empty array when data is null', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    const result = await queryVisionsByUserId(supabase, 'u1');
    expect(result).toEqual([]);
  });
});

describe('upsertVisionForArea', () => {
  it('calls upsert with correct payload', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await upsertVisionForArea(supabase, 'u1', 'Karier/Bisnis', 'CEO', 'Entrepreneur');
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        life_area: 'Karier/Bisnis',
        vision_3_5_year: 'CEO',
        vision_10_year: 'Entrepreneur',
      }),
      expect.any(Object)
    );
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeFrom(builder);
    await expect(upsertVisionForArea(supabase, 'u1', 'area', 'v1', 'v2')).rejects.toMatchObject({ message: 'upsert fail' });
  });
});
