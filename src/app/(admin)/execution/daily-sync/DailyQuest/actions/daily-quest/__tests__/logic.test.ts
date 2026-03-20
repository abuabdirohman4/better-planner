// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseDailyQuestFormData, extractSessionIds } from '../logic';

describe('parseDailyQuestFormData', () => {
  it('returns title and focusDuration from valid FormData', () => {
    const formData = new FormData();
    formData.set('title', 'My Daily Quest');
    formData.set('focus_duration', '30');

    const result = parseDailyQuestFormData(formData);

    expect(result.title).toBe('My Daily Quest');
    expect(result.focusDuration).toBe(30);
  });

  it('throws when title is missing', () => {
    const formData = new FormData();
    formData.set('focus_duration', '25');

    expect(() => parseDailyQuestFormData(formData)).toThrow('Title is required');
  });

  it('throws when title is an empty string', () => {
    const formData = new FormData();
    formData.set('title', '');

    expect(() => parseDailyQuestFormData(formData)).toThrow('Title is required');
  });

  it('defaults focusDuration to 0 when focus_duration is missing', () => {
    const formData = new FormData();
    formData.set('title', 'No Duration Quest');

    const result = parseDailyQuestFormData(formData);

    expect(result.focusDuration).toBe(0);
  });

  it('defaults focusDuration to 0 when focus_duration is not a number', () => {
    const formData = new FormData();
    formData.set('title', 'Bad Duration');
    formData.set('focus_duration', 'abc');

    const result = parseDailyQuestFormData(formData);

    expect(result.focusDuration).toBe(0);
  });

  it('parses focusDuration=0 correctly (not treated as falsy default override)', () => {
    const formData = new FormData();
    formData.set('title', 'Zero Duration');
    formData.set('focus_duration', '0');

    const result = parseDailyQuestFormData(formData);

    expect(result.focusDuration).toBe(0);
  });
});

describe('extractSessionIds', () => {
  it('maps session objects to their ids', () => {
    const sessions = [{ id: 'session-1' }, { id: 'session-2' }, { id: 'session-3' }];
    expect(extractSessionIds(sessions)).toEqual(['session-1', 'session-2', 'session-3']);
  });

  it('returns empty array for empty input', () => {
    expect(extractSessionIds([])).toEqual([]);
  });

  it('handles a single session', () => {
    expect(extractSessionIds([{ id: 'session-abc' }])).toEqual(['session-abc']);
  });
});
