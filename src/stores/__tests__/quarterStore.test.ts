import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function freshStore() {
  vi.resetModules();
  return (await import('@/stores/quarterStore')).useQuarterStore;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.useRealTimers());

describe('quarterStore default', () => {
  it('browser baru pada 29 Sep 2026 membuka Q4 2026', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    const useStore = await freshStore();
    expect(useStore.getState().quarter).toBe(4);
    expect(useStore.getState().year).toBe(2026);
  });

  it('browser baru pada 27 Sep 2026 membuka Q3 2026', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 27, 10));
    const useStore = await freshStore();
    expect(useStore.getState().quarter).toBe(3);
  });

  it('state lama (version 0) dengan Q1 dimigrasi ke quarter berjalan', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    localStorage.setItem('quarter-storage', JSON.stringify({ state: { year: 2026, quarter: 1 }, version: 0 }));
    const useStore = await freshStore();
    expect(useStore.getState()).toMatchObject({ year: 2026, quarter: 4 });
  });

  it('state versi baru dengan pilihan manual Q2 tetap Q2', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 29, 10));
    localStorage.setItem('quarter-storage', JSON.stringify({ state: { year: 2025, quarter: 2 }, version: 1 }));
    const useStore = await freshStore();
    expect(useStore.getState()).toMatchObject({ year: 2025, quarter: 2 });
  });
});
