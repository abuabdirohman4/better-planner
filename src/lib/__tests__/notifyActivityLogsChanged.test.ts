import { describe, it, expect, vi } from 'vitest';

const mutate = vi.fn().mockResolvedValue(undefined);
vi.mock('swr', async (orig) => ({ ...(await orig<typeof import('swr')>()), mutate: (...a: unknown[]) => mutate(...a) }));

import { notifyActivityLogsChanged, isActivityLogsKey, dailySyncKeys } from '../swr';
import { useActivityStore } from '@/stores/activityStore';

describe('notifyActivityLogsChanged', () => {
  it('bumps activityStore timestamp and mutates every activity_logs-derived key', async () => {
    const before = useActivityStore.getState().lastActivityTimestamp;
    await new Promise((r) => setTimeout(r, 2));
    await notifyActivityLogsChanged();
    expect(useActivityStore.getState().lastActivityTimestamp).toBeGreaterThan(before);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toBe(isActivityLogsKey);
  });

  it('predicate matches list + counter keys, not others', () => {
    expect(isActivityLogsKey(dailySyncKeys.activityLogs('2026-08-18'))).toBe(true);
    expect(isActivityLogsKey(dailySyncKeys.allCompletedSessions(['t1'], '2026-08-18'))).toBe(true);
    expect(isActivityLogsKey(dailySyncKeys.actualFocusTime('2026-08-18', ['t1']))).toBe(true);
    expect(isActivityLogsKey(dailySyncKeys.dailyPlan('2026-08-18'))).toBe(false);
    expect(isActivityLogsKey('some-string')).toBe(false);
  });
});
