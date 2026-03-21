// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { DEFAULT_SOUND_SETTINGS, mergeSoundSettings } from '../logic';

describe('DEFAULT_SOUND_SETTINGS', () => {
  it('has expected default values', () => {
    expect(DEFAULT_SOUND_SETTINGS.soundId).toBe('children');
    expect(DEFAULT_SOUND_SETTINGS.volume).toBe(0.5);
    expect(DEFAULT_SOUND_SETTINGS.taskCompletionSoundId).toBe('none');
    expect(DEFAULT_SOUND_SETTINGS.focusSoundId).toBe('none');
  });
});

describe('mergeSoundSettings', () => {
  it('merges updates into current settings', () => {
    const current = { soundId: 'children', volume: 0.5, taskCompletionSoundId: 'none', focusSoundId: 'none' };
    const result = mergeSoundSettings(current, { volume: 0.8, soundId: 'bells' });
    expect(result.volume).toBe(0.8);
    expect(result.soundId).toBe('bells');
    expect(result.taskCompletionSoundId).toBe('none');
  });

  it('does not mutate original settings', () => {
    const current = { soundId: 'children', volume: 0.5, taskCompletionSoundId: 'none', focusSoundId: 'none' };
    mergeSoundSettings(current, { volume: 1.0 });
    expect(current.volume).toBe(0.5);
  });

  it('returns current when no updates', () => {
    const current = { soundId: 'children', volume: 0.5, taskCompletionSoundId: 'none', focusSoundId: 'none' };
    const result = mergeSoundSettings(current, {});
    expect(result).toEqual(current);
  });

  it('overrides only specified keys', () => {
    const current = { soundId: 'a', volume: 0.3, taskCompletionSoundId: 'b', focusSoundId: 'c' };
    const result = mergeSoundSettings(current, { focusSoundId: 'rain' });
    expect(result.focusSoundId).toBe('rain');
    expect(result.soundId).toBe('a');
  });
});
