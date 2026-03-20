// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryUserProfile, queryExistingProfile, updateProfileSoundSettings, insertUserProfile } from '../queries';

// Minimal SoundSettings for test
const testSettings = { soundId: 'test', volume: 0.5, taskCompletionSoundId: 'none', focusSoundId: 'none' } as const;

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryUserProfile', () => {
  it('returns user profile data on success', async () => {
    const profile = { id: 'p1', user_id: 'u1', sound_settings: testSettings };
    const builder = makeQueryBuilder({ data: profile, error: null });
    const supabase = makeFrom(builder);
    const result = await queryUserProfile(supabase, 'u1');
    expect(result).toEqual(profile);
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('returns null when PGRST116 (no profile found)', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: 'PGRST116', message: 'no rows' } });
    const supabase = makeFrom(builder);
    const result = await queryUserProfile(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('throws on other errors', async () => {
    const builder = makeQueryBuilder({ data: null, error: { code: 'OTHER', message: 'db error' } });
    const supabase = makeFrom(builder);
    await expect(queryUserProfile(supabase, 'u1')).rejects.toMatchObject({ message: 'db error' });
  });
});

describe('queryExistingProfile', () => {
  it('returns existing profile data', async () => {
    const builder = makeQueryBuilder({ data: { sound_settings: testSettings }, error: null });
    const supabase = makeFrom(builder);
    const result = await queryExistingProfile(supabase, 'u1');
    expect(result).toEqual({ sound_settings: testSettings });
  });
});

describe('updateProfileSoundSettings', () => {
  it('updates sound_settings and updated_at', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await updateProfileSoundSettings(supabase, 'u1', testSettings);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ sound_settings: testSettings }));
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(updateProfileSoundSettings(supabase, 'u1', testSettings)).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('insertUserProfile', () => {
  it('inserts profile with user_id and sound_settings', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await insertUserProfile(supabase, 'u1', testSettings);
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', sound_settings: testSettings }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(insertUserProfile(supabase, 'u1', testSettings)).rejects.toMatchObject({ message: 'insert fail' });
  });
});
