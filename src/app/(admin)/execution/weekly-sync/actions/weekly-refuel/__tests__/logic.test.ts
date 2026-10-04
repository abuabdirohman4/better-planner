// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { normalizeText, parseSleepHours } from '../logic';

describe('normalizeText', () => {
  it('kosong/spasi -> null, selain itu di-trim', () => {
    expect(normalizeText('   ')).toBeNull();
    expect(normalizeText(undefined)).toBeNull();
    expect(normalizeText('  baca buku ')).toBe('baca buku');
  });
});

describe('parseSleepHours', () => {
  it('kosong -> null', () => {
    expect(parseSleepHours('')).toBeNull();
    expect(parseSleepHours(null)).toBeNull();
  });
  it('menerima desimal koma/titik, dibulatkan ke 0.5', () => {
    expect(parseSleepHours('8')).toBe(8);
    expect(parseSleepHours('7,5')).toBe(7.5);
    expect(parseSleepHours("7.7")).toBe(7.5);
  });
  it('di luar 0..24 atau bukan angka -> invalid', () => {
    expect(parseSleepHours('25')).toBe('invalid');
    expect(parseSleepHours('-1')).toBe('invalid');
    expect(parseSleepHours('abc')).toBe('invalid');
  });
});
