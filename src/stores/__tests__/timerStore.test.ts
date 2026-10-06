import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const saveTimerSession = vi.fn();
const abandonTimerSession = vi.fn().mockResolvedValue(undefined);
const pauseTimerSession = vi.fn().mockResolvedValue({ success: true });
const resumeTimerSession = vi.fn().mockResolvedValue({ success: true });
const updateTimerSessionTarget = vi.fn().mockResolvedValue({ updated: true });
const switchTimerSessionTask = vi.fn().mockResolvedValue({ updated: true });
const setTimerSessionNotes = vi.fn().mockResolvedValue({ updated: true });
const setActivityLogNotes = vi.fn().mockResolvedValue(undefined);
vi.mock('@/app/(admin)/execution/daily-sync/PomodoroTimer/actions/timerSessionActions', () => ({
  saveTimerSession: (...a: unknown[]) => saveTimerSession(...a),
  abandonTimerSession: (...a: unknown[]) => abandonTimerSession(...a),
  pauseTimerSession: (...a: unknown[]) => pauseTimerSession(...a),
  resumeTimerSession: (...a: unknown[]) => resumeTimerSession(...a),
  updateTimerSessionTarget: (...a: unknown[]) => updateTimerSessionTarget(...a),
  switchTimerSessionTask: (...a: unknown[]) => switchTimerSessionTask(...a),
  setTimerSessionNotes: (...a: unknown[]) => setTimerSessionNotes(...a),
  setActivityLogNotes: (...a: unknown[]) => setActivityLogNotes(...a),
}));
vi.mock('@/app/(admin)/execution/daily-sync/PomodoroTimer/actions/timerSession/breakSession', () => ({
  startBreakSession: vi.fn().mockResolvedValue('b1'),
  endBreakSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/soundUtils', () => ({
  playTimerCompleteSound: vi.fn(), playSound: vi.fn(), stopCurrentSound: vi.fn(), playFocusSoundLoop: vi.fn(),
}));
vi.mock('@/app/(admin)/settings/profile/actions/userProfileActions', () => ({
  getSoundSettings: vi.fn().mockResolvedValue({ soundId: 'none', focusSoundId: 'none', volume: 1 }),
}));

async function freshStore() {
  vi.resetModules();
  return (await import('@/stores/timerStore')).useTimerStore;
}

const task = { id: 't1', title: 'Task', item_type: 'MAIN_QUEST', focus_duration: 60 };

beforeEach(() => { localStorage.clear(); saveTimerSession.mockReset(); abandonTimerSession.mockClear(); pauseTimerSession.mockClear(); resumeTimerSession.mockClear(); });
afterEach(() => vi.useRealTimers());

describe('startFocusSession menyimpan sesi saat start', () => {
  it('menulis baris FOCUSING ke server dan menyimpan sessionId', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-1' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-1'));
    const arg = saveTimerSession.mock.calls[0][0];
    expect(arg).toMatchObject({
      taskId: 't1', sessionType: 'FOCUS', status: 'FOCUSING',
      targetDuration: 3600, focusDuration: 60, currentDuration: 0,
    });
    expect(arg.startTime).toBe(store.getState().startTime);
    expect(arg.deviceId).toBeTruthy();
  });

  it('gagal simpan tidak menghentikan timer', async () => {
    saveTimerSession.mockRejectedValue(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
    expect(store.getState().timerState).toBe('FOCUSING');
    expect(store.getState().sessionId).toBeNull();
  });
});

describe('checkDailyReset', () => {
  it('pakai tanggal WIB: 17:30 UTC = 00:30 WIB hari berikutnya', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T10:00:00Z'));
    const store = await freshStore();
    store.getState().checkDailyReset();
    expect(store.getState().lastUpdatedDay).toBe('2026-10-06');
    vi.setSystemTime(new Date('2026-10-06T17:30:00Z')); // masih 6 Okt UTC, 7 Okt WIB
    store.getState().checkDailyReset();
    expect(store.getState().lastUpdatedDay).toBe('2026-10-07');
  });

  it('tidak me-reset timer FOCUSING saat hari berganti', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T10:00:00Z'));
    saveTimerSession.mockResolvedValue({ id: 's' });
    const store = await freshStore();
    store.getState().checkDailyReset();
    store.getState().startFocusSession(task);
    vi.setSystemTime(new Date('2026-10-06T17:30:00Z'));
    store.getState().checkDailyReset();
    expect(store.getState().timerState).toBe('FOCUSING');
    expect(store.getState().activeTask?.id).toBe('t1');
  });
});

describe('sesi yang tidak selesai tidak dicatat penuh oleh server', () => {
  it('stop di detik 0 menutup baris tanpa log', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-0' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-0'));
    store.getState().stopTimer();
    expect(abandonTimerSession).toHaveBeenCalledWith('sess-0');
    expect(store.getState().lastSessionComplete).toBeNull();
  });

  it('stop setelah berjalan mencatat durasi sebenarnya, tidak membuang baris', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-1' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-1'));
    store.setState({ secondsElapsed: 600 });
    store.getState().stopTimer();
    expect(abandonTimerSession).not.toHaveBeenCalled();
    expect(store.getState().lastSessionComplete).toMatchObject({ taskId: 't1', duration: 600, sessionId: 'sess-1' });
  });

  it('mulai task lain saat sesi berjalan: sesi lama dihentikan lewat jalur Stop', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-a' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-a'));
    store.setState({ secondsElapsed: 300 });
    saveTimerSession.mockResolvedValue({ id: 'sess-b' });
    store.getState().startFocusSession({ ...task, id: 't2', title: 'Task 2' });
    expect(store.getState().lastSessionComplete).toMatchObject({ taskId: 't1', duration: 300, sessionId: 'sess-a' });
    expect(store.getState().activeTask?.id).toBe('t2');
  });

  it('reset saat sesi berjalan menutup barisnya', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-r' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-r'));
    store.getState().resetTimer();
    expect(abandonTimerSession).toHaveBeenCalledWith('sess-r');
  });
});

describe('pause/resume ditulis ke server (baris yang sama)', () => {
  it('pause menyimpan PAUSED + durasi; resume menyimpan start_time yang digeser', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T10:00:00Z'));
    saveTimerSession.mockResolvedValue({ id: 'sess-p' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-p'));
    store.setState({ secondsElapsed: 300 });
    store.getState().pauseTimer();
    expect(pauseTimerSession).toHaveBeenCalledWith('sess-p', 300);
    vi.setSystemTime(new Date('2026-10-06T10:20:00Z'));
    store.getState().resumeTimer();
    expect(resumeTimerSession).toHaveBeenCalledWith('sess-p', new Date('2026-10-06T10:15:00Z').toISOString());
    expect(saveTimerSession).toHaveBeenCalledTimes(1); // tidak ada baris baru
  });

  it('pause sebelum simpan-start selesai: menunggu id lalu menulis', async () => {
    let resolve!: (v: { id: string }) => void;
    saveTimerSession.mockReturnValue(new Promise((r) => { resolve = r; }));
    const store = await freshStore();
    store.getState().startFocusSession(task);
    store.setState({ secondsElapsed: 5 });
    store.getState().pauseTimer();
    expect(pauseTimerSession).not.toHaveBeenCalled();
    resolve({ id: 'late' });
    await vi.waitFor(() => expect(pauseTimerSession).toHaveBeenCalledWith('late', 5));
  });
});

describe('start lalu stop sebelum simpan selesai', () => {
  it('stop di detik 0 sebelum id kembali: baris di-abandon begitu id ada', async () => {
    let resolve!: (v: { id: string }) => void;
    saveTimerSession.mockReturnValue(new Promise((r) => { resolve = r; }));
    const store = await freshStore();
    store.getState().startFocusSession(task);
    store.getState().stopTimer();
    resolve({ id: 'orphan' });
    await vi.waitFor(() => expect(abandonTimerSession).toHaveBeenCalledWith('orphan'));
    expect(store.getState().sessionId).toBeNull();
  });

  it('stop dengan durasi > 0 sebelum id kembali: TIDAK di-abandon (jalur completion)', async () => {
    let resolve!: (v: { id: string }) => void;
    saveTimerSession.mockReturnValue(new Promise((r) => { resolve = r; }));
    const store = await freshStore();
    store.getState().startFocusSession(task);
    store.setState({ secondsElapsed: 120 });
    store.getState().stopTimer();
    resolve({ id: 'keep' });
    await new Promise((r) => setTimeout(r, 20));
    expect(abandonTimerSession).not.toHaveBeenCalled();
    expect(store.getState().sessionId).toBeNull();
  });
});

describe('PAUSED lalu server menutup baris (pause > 6 jam)', () => {
  const T0 = '2026-10-06T10:00:00Z';
  async function pausedStore() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(T0));
    saveTimerSession.mockResolvedValue({ id: 'sess-n' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-n'));
    const originalStart = store.getState().startTime!;
    store.setState({ secondsElapsed: 600 });
    store.getState().pauseTimer();
    return { store, originalStart };
  }

  it('pause -> stop normal: log memakai start ASLI (dedup mengenali log server)', async () => {
    const { store, originalStart } = await pausedStore();
    vi.setSystemTime(new Date('2026-10-06T18:00:00Z'));
    store.getState().stopTimer();
    expect(store.getState().lastSessionComplete).toMatchObject({
      startTime: originalStart, duration: 600, sessionId: 'sess-n',
      endTime: new Date(new Date(originalStart).getTime() + 600_000).toISOString(),
    });
  });

  it('resume ketika baris sudah ditutup server -> sesi BARU dari 0, tanpa log menit lama', async () => {
    const { store } = await pausedStore();
    resumeTimerSession.mockResolvedValue({ updated: false });
    saveTimerSession.mockResolvedValue({ id: 'sess-new' });
    vi.setSystemTime(new Date('2026-10-06T18:00:00Z'));
    store.getState().resumeTimer();
    await vi.waitFor(() => expect(saveTimerSession).toHaveBeenCalledTimes(2));
    expect(saveTimerSession.mock.calls[1][0]).toMatchObject({ taskId: 't1', currentDuration: 0, targetDuration: 3600 });
    expect(store.getState().secondsElapsed).toBe(0);
    expect(store.getState().timerState).toBe('FOCUSING');
    expect(store.getState().lastSessionComplete).toBeNull();
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-new'));
  });

  it('resume normal (baris masih ada) tetap melanjutkan menit lama', async () => {
    const { store } = await pausedStore();
    resumeTimerSession.mockResolvedValue({ updated: true });
    store.getState().resumeTimer();
    await vi.advanceTimersByTimeAsync(10);
    expect(saveTimerSession).toHaveBeenCalledTimes(1);
    expect(store.getState().secondsElapsed).toBe(600);
  });
});

describe('id start lama tidak menempel ke sesi baru task yang sama', () => {
  it('start, stop(durasi>0), start lagi task sama; id lama kembali belakangan -> diabaikan', async () => {
    let resolveOld!: (v: { id: string }) => void;
    saveTimerSession.mockReturnValueOnce(new Promise((r) => { resolveOld = r; }));
    const store = await freshStore();
    store.getState().startFocusSession(task);
    store.setState({ secondsElapsed: 60 });
    store.getState().stopTimer();
    saveTimerSession.mockReturnValueOnce(new Promise(() => {}));
    store.getState().startFocusSession(task);
    resolveOld({ id: 'old' });
    await new Promise((r) => setTimeout(r, 20));
    expect(store.getState().sessionId).toBeNull();
  });
});

describe('pause pada baris yang sudah ditutup server', () => {
  it('mengakhiri sesi lokal tanpa log (menit sudah dicatat server)', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-closed' });
    pauseTimerSession.mockResolvedValueOnce({ success: true, updated: false });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-closed'));
    store.setState({ secondsElapsed: 3600 });
    store.getState().pauseTimer();
    await vi.waitFor(() => expect(store.getState().timerState).toBe('IDLE'));
    expect(store.getState().lastSessionComplete).toBeNull();
    expect(store.getState().sessionId).toBeNull();
  });
});

describe('siklus berbasis slot (app-mgsb)', () => {
  it('ubah durasi & ganti task di tengah siklus ikut ditulis ke baris sesi', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-9' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-9'));

    store.getState().setFocusMinutes(90);
    expect(store.getState().activeTask?.focus_duration).toBe(90);
    await vi.waitFor(() => expect(updateTimerSessionTarget).toHaveBeenCalledWith('sess-9', 90));

    store.getState().switchActiveTask({ id: 't2', title: 'Lain', item_type: 'WORK_QUEST' });
    expect(store.getState().activeTask).toMatchObject({ id: 't2', title: 'Lain', focus_duration: 90 });
    await vi.waitFor(() => expect(switchTimerSessionTask).toHaveBeenCalledWith('sess-9', 't2', 'Lain'));
  });

  it('catatan teks bebas: saat fokus ke baris sesi (debounce); setelah siklus ditutup, edit break ke log siklus itu', async () => {
    saveTimerSession.mockResolvedValue({ id: 'sess-7' });
    const store = await freshStore();
    store.getState().startFocusSession(task);
    await vi.waitFor(() => expect(store.getState().sessionId).toBe('sess-7'));

    store.getState().setCycleNotes('riset');
    store.getState().setCycleNotes('riset selesai');
    store.getState().addCycleNote('✓ Task');
    expect(store.getState().cycleNotes).toBe('riset selesai\n✓ Task');
    await vi.waitFor(() => expect(setTimerSessionNotes).toHaveBeenCalledWith('sess-7', 'riset selesai\n✓ Task'), { timeout: 2000 });
    expect(setTimerSessionNotes).toHaveBeenCalledTimes(1);

    store.setState({ timerState: 'BREAK' });
    store.getState().closeCycle('log-1');
    expect(store.getState().cycleNotes).toBe('');
    expect(setActivityLogNotes).toHaveBeenLastCalledWith('log-1', 'riset selesai\n✓ Task');
    store.getState().setCycleNotes('riset selesai\n✓ Task\nlanjut besok');
    await vi.waitFor(() => expect(setActivityLogNotes).toHaveBeenLastCalledWith('log-1', 'riset selesai\n✓ Task\nlanjut besok'), { timeout: 2000 });
  });
});
