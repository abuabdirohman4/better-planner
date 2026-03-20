// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateBrainDumpDate, sanitizeContent } from '../logic';

describe('validateBrainDumpDate', () => {
  it('does not throw for a valid date string', () => {
    expect(() => validateBrainDumpDate('2026-01-01')).not.toThrow();
  });

  it('throws when date is an empty string', () => {
    expect(() => validateBrainDumpDate('')).toThrow('Tanggal tidak boleh kosong');
  });

  it('throws when date is falsy', () => {
    expect(() => validateBrainDumpDate('' as string)).toThrow();
  });
});

describe('sanitizeContent', () => {
  it('trims whitespace from content', () => {
    expect(sanitizeContent('  hello world  ')).toBe('hello world');
  });

  it('returns empty string when content is empty', () => {
    expect(sanitizeContent('')).toBe('');
  });

  it('returns empty string when content is only whitespace', () => {
    expect(sanitizeContent('   ')).toBe('');
  });
});
