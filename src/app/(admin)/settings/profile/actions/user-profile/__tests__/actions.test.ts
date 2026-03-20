// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));
vi.mock('@/lib/errorUtils', () => ({ handleApiError: vi.fn().mockReturnValue({ message: 'Error handled' }) }));

import { createClient } from '@/lib/supabase/server';
import { getUserProfile, getSoundSettings, updateSoundSettings, resetSoundSettings } from '../actions';

describe('getUserProfile', () => {
  it('returns null when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getUserProfile();
    expect(result).toBeNull();
  });

  it('returns profile when found', async () => {
    const profile = { id: 'p1', user_id: 'u1', sound_settings: { soundId: 'children', volume: 0.5, taskCompletionSoundId: 'none', focusSoundId: 'none' } };
    const builder = makeQueryBuilder({ data: profile, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    const result = await getUserProfile();
    expect(result).toEqual(profile);
  });
});

describe('getSoundSettings', () => {
  it('returns default sound settings when no profile', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    const result = await getSoundSettings();
    expect(result.soundId).toBe('children');
    expect(result.volume).toBe(0.5);
  });
});

describe('updateSoundSettings', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(updateSoundSettings({ volume: 0.8 })).rejects.toThrow('User not authenticated');
  });

  it('inserts profile when no existing profile', async () => {
    // First call returns null profile, subsequent calls succeed
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(updateSoundSettings({ volume: 0.8 })).resolves.toBeUndefined();
  });
});

describe('resetSoundSettings', () => {
  it('throws when user not authenticated', async () => {
    (createClient as any).mockResolvedValue(makeSupabase({ user: null }));
    await expect(resetSoundSettings()).rejects.toThrow('User not authenticated');
  });

  it('succeeds when authenticated', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    (createClient as any).mockResolvedValue(makeSupabase({ fromBuilder: builder }));
    await expect(resetSoundSettings()).resolves.toBeUndefined();
  });
});
