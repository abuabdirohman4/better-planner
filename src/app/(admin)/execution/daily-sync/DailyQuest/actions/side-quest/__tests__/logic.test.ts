// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseSideQuestFormData } from '../logic';

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe('parseSideQuestFormData', () => {
  it('returns title and date when both are present', () => {
    const fd = makeFormData({ title: 'Read a book', date: '2026-03-20' });
    const result = parseSideQuestFormData(fd);
    expect(result).toEqual({ title: 'Read a book', date: '2026-03-20' });
  });

  it('throws when title is missing', () => {
    const fd = makeFormData({ date: '2026-03-20' });
    expect(() => parseSideQuestFormData(fd)).toThrow('Title is required');
  });

  it('throws when date is missing', () => {
    const fd = makeFormData({ title: 'Read a book' });
    expect(() => parseSideQuestFormData(fd)).toThrow('Date is required');
  });

  it('throws when both title and date are missing', () => {
    const fd = makeFormData({});
    expect(() => parseSideQuestFormData(fd)).toThrow('Title and date are required');
  });

  it('throws when title is an empty string', () => {
    const fd = makeFormData({ title: '', date: '2026-03-20' });
    expect(() => parseSideQuestFormData(fd)).toThrow('Title is required');
  });
});
