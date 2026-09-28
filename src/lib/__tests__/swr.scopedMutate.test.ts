import { describe, it, expect, vi } from 'vitest';
import type { ScopedMutator } from 'swr';
import { setScopedMutate, notifyHabitsChanged, isHabitsKey } from '../swr';

// SWRProvider memakai cache provider sendiri — mutate global dari 'swr' tidak menyentuhnya.
// notify* wajib lewat mutate milik provider, kalau tidak revalidasi diam-diam no-op.
describe('notify* memakai mutate milik SWRProvider', () => {
  it('notifyHabitsChanged memanggil mutate yang didaftarkan provider', async () => {
    const scoped = vi.fn().mockResolvedValue([]);
    setScopedMutate(scoped as unknown as ScopedMutator);
    await notifyHabitsChanged();
    expect(scoped).toHaveBeenCalledWith(isHabitsKey);
  });
});
