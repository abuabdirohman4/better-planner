// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { updateTemplateName } from '../queries';
import { validateTemplateName } from '../logic';

describe('updateTemplateName', () => {
  it('update nama dengan filter id dan user_id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = { from: vi.fn().mockReturnValue(builder) } as any;
    await updateTemplateName(supabase, 'user-1', 't1', 'Baru');
    expect(supabase.from).toHaveBeenCalledWith('best_week_templates');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Baru' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 't1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('lempar error kalau gagal', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'x' } });
    await expect(updateTemplateName({ from: () => builder } as any, 'u', 't', 'n')).rejects.toThrow();
  });
});

describe('validateTemplateName', () => {
  it('trim dan tolak kosong', () => {
    expect(validateTemplateName('  A  ')).toBe('A');
    expect(() => validateTemplateName('   ')).toThrow();
  });
});
