import { describe, it, expect } from 'vitest';
import { isVersionSkewError, shouldAutoReload } from '../versionSkew';

describe('isVersionSkewError', () => {
  it('kenali error file/aksi versi lama setelah deploy', () => {
    const chunk = Object.assign(new Error('Loading chunk 123 failed.'), { name: 'ChunkLoadError' });
    expect(isVersionSkewError(chunk)).toBe(true);
    expect(isVersionSkewError(new Error('Loading CSS chunk 9 failed'))).toBe(true);
    expect(isVersionSkewError(new Error('Failed to find Server Action "abc". This request might be from an older or newer deployment.'))).toBe(true);
    expect(isVersionSkewError(new Error('Failed to fetch dynamically imported module: /x.js'))).toBe(true);
  });
  it('error biasa tidak dianggap versi lama', () => {
    expect(isVersionSkewError(new Error("Cannot read properties of undefined (reading 'length')"))).toBe(false);
    expect(isVersionSkewError(undefined)).toBe(false);
  });
});

describe('shouldAutoReload', () => {
  it('reload hanya sekali per menit supaya tidak berputar', () => {
    expect(shouldAutoReload(null, 1_000_000)).toBe(true);
    expect(shouldAutoReload('999000', 1_000_000)).toBe(false);
    expect(shouldAutoReload('900000', 1_000_000)).toBe(true);
  });
});
