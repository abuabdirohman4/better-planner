// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryHourlyNotes, upsertHourlyNoteRecord, deleteHourlyNoteRecord } from '../queries';

const makeSupabaseFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('hourly_notes queries', () => {
  it('lists notes filtered by user and date', async () => {
    const builder = makeQueryBuilder({ data: [{ hour: 8, content: 'x' }], error: null });
    const supabase = makeSupabaseFrom(builder);
    expect(await queryHourlyNotes(supabase, 'u1', '2026-10-06')).toEqual([{ hour: 8, content: 'x' }]);
    expect(supabase.from).toHaveBeenCalledWith('hourly_notes');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.eq).toHaveBeenCalledWith('date', '2026-10-06');
  });

  it('upserts on (user_id, date, hour)', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    await upsertHourlyNoteRecord(makeSupabaseFrom(builder), 'u1', '2026-10-06', 18, 'pengajian');
    expect(builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'u1', date: '2026-10-06', hour: 18, content: 'pengajian' }),
      { onConflict: 'user_id,date,hour' },
    );
  });

  it('deletes scoped to user, date, hour and throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'boom' } });
    await expect(deleteHourlyNoteRecord(makeSupabaseFrom(builder), 'u1', 'd', 3)).rejects.toMatchObject({ message: 'boom' });
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(builder.eq).toHaveBeenCalledWith('hour', 3);
  });
});
