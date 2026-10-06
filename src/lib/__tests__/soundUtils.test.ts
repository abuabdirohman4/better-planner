import { describe, it, expect, vi, beforeEach } from 'vitest';

// Bug 6 Okt 2026: tiap suara membuat AudioContext baru tanpa ditutup -> setelah beberapa siklus suara mati.
let created = 0;
class FakeAudioContext {
  state = 'running';
  destination = {};
  constructor() { created += 1; }
  resume = vi.fn(async () => {});
  close = vi.fn(async () => {});
  decodeAudioData = vi.fn(async () => ({ sampleRate: 44100, numberOfChannels: 1, duration: 1, getChannelData: () => new Float32Array(1) }));
  createBufferSource = () => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), disconnect: vi.fn(), onended: null, buffer: null, loop: false });
  createGain = () => ({ connect: vi.fn(), gain: { value: 1 } });
  createBuffer = () => ({ getChannelData: () => new Float32Array(44100) });
}

beforeEach(() => {
  created = 0;
  vi.resetModules();
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
});

describe('soundUtils', () => {
  it('memutar suara berkali-kali hanya memakai satu AudioContext dan satu unduhan per file', async () => {
    const { playSound, playFocusSoundLoop, COMPLETION_SOUND_OPTIONS, FOCUS_SOUND_OPTIONS } = await import('@/lib/soundUtils');
    const done = COMPLETION_SOUND_OPTIONS.find((o) => o.id !== 'none')!.id;
    const focus = FOCUS_SOUND_OPTIONS.find((o) => o.id !== 'none')!.id;
    for (let i = 0; i < 10; i++) {
      await playFocusSoundLoop(focus, 0.5);
      await playSound(done, 0.5);
    }
    expect(created).toBe(1);
    expect((fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
});
