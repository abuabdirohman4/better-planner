import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const saveTimerSession = vi.fn().mockResolvedValue({ id: 's1' });
vi.mock('../../../actions/timerSessionActions', () => ({
  saveTimerSession: (...a: unknown[]) => saveTimerSession(...a),
  getActiveTimerSession: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/timerDevUtils', () => ({ isTimerEnabledInDev: () => true }));
vi.mock('../../deviceUtils', () => ({ getClientDeviceId: () => 'dev-1' }));

beforeEach(() => { vi.useFakeTimers(); saveTimerSession.mockClear(); });
afterEach(() => vi.useRealTimers());

describe('useAutoSave', () => {
  it('interval 30 dtk tetap fire walau secondsElapsed naik tiap detik', async () => {
    vi.resetModules();
    const { useTimerStore } = await import('@/stores/timerStore');
    const { setGlobalRecoveryCompleted } = await import('../../globalState');
    const { useAutoSave } = await import('../useAutoSave');
    setGlobalRecoveryCompleted(true);
    vi.stubEnv('NODE_ENV', 'production');

    const start = new Date().toISOString();
    useTimerStore.setState({
      timerState: 'FOCUSING', activeTask: { id: 't1', title: 'T', item_type: 'MAIN_QUEST', focus_duration: 25 },
      startTime: start, secondsElapsed: 0, sessionId: 'sess-1',
    });
    renderHook(() => useAutoSave());

    for (let i = 0; i < 31; i++) {
      await act(async () => {
        useTimerStore.setState({ secondsElapsed: useTimerStore.getState().secondsElapsed + 1 });
        await vi.advanceTimersByTimeAsync(1000);
      });
    }
    expect(saveTimerSession).toHaveBeenCalled();
    expect(saveTimerSession.mock.calls[0][0]).toMatchObject({ taskId: 't1', sessionId: 'sess-1' });
    vi.unstubAllEnvs();
  });
});
