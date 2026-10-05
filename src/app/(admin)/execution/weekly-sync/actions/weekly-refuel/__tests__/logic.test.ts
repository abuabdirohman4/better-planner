// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { normalizeText } from '../logic';

describe('normalizeText', () => {
  it('kosong/spasi -> null, selain itu di-trim', () => {
    expect(normalizeText('   ')).toBeNull();
    expect(normalizeText(undefined)).toBeNull();
    expect(normalizeText('  baca buku ')).toBe('baca buku');
  });
});

