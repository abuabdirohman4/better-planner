// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseJournalFormData, calculateDurationMinutes, sanitizeJournalField } from '../logic';

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validFields = {
  taskId: 'task-1',
  sessionType: 'FOCUS',
  date: '2026-01-01',
  startTime: '2026-01-01T09:00:00Z',
  endTime: '2026-01-01T09:25:00Z',
};

describe('parseJournalFormData', () => {
  it('parses all valid fields correctly', () => {
    const fd = makeFormData({ ...validFields, whatDone: 'Fixed bug', whatThink: 'Good session' });
    const result = parseJournalFormData(fd);
    expect(result.taskId).toBe('task-1');
    expect(result.sessionType).toBe('FOCUS');
    expect(result.date).toBe('2026-01-01');
    expect(result.whatDone).toBe('Fixed bug');
    expect(result.whatThink).toBe('Good session');
  });

  it('throws when taskId is missing', () => {
    const fd = makeFormData({ sessionType: 'FOCUS', date: 'd', startTime: 's', endTime: 'e' });
    expect(() => parseJournalFormData(fd)).toThrow('Missing required fields');
  });

  it('throws when startTime is missing', () => {
    const fd = makeFormData({ taskId: 't', sessionType: 'FOCUS', date: 'd', endTime: 'e' });
    expect(() => parseJournalFormData(fd)).toThrow('Missing required fields');
  });

  it('optional fields can be undefined', () => {
    const fd = makeFormData(validFields);
    const result = parseJournalFormData(fd);
    expect(result.whatDone).toBeUndefined();
    expect(result.whatThink).toBeUndefined();
  });
});

describe('calculateDurationMinutes', () => {
  it('calculates 25 minutes correctly', () => {
    const start = '2026-01-01T09:00:00Z';
    const end = '2026-01-01T09:25:00Z';
    expect(calculateDurationMinutes(start, end)).toBe(25);
  });

  it('returns minimum 1 when duration is 0', () => {
    const time = '2026-01-01T09:00:00Z';
    expect(calculateDurationMinutes(time, time)).toBe(1);
  });

  it('calculates 5 minute break correctly', () => {
    const start = '2026-01-01T09:25:00Z';
    const end = '2026-01-01T09:30:00Z';
    expect(calculateDurationMinutes(start, end)).toBe(5);
  });
});

describe('sanitizeJournalField', () => {
  it('trims whitespace and returns trimmed string', () => {
    expect(sanitizeJournalField('  hello  ')).toBe('hello');
  });

  it('returns null for empty string', () => {
    expect(sanitizeJournalField('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(sanitizeJournalField('   ')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(sanitizeJournalField(undefined)).toBeNull();
  });
});
