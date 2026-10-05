import { describe, it, expect } from 'vitest';
import { QUOTES, quoteOfDay } from '../quotes';

describe('quoteOfDay', () => {
  it('sama sepanjang hari, berganti hari berikutnya, bergilir', () => {
    expect(quoteOfDay('2026-10-05')).toBe(quoteOfDay('2026-10-05'));
    const i = QUOTES.indexOf(quoteOfDay('2026-10-05'));
    expect(QUOTES.indexOf(quoteOfDay('2026-10-06'))).toBe((i + 1) % QUOTES.length);
  });
  it('3 quote buku Sync Planner ada', () => {
    const authors = QUOTES.map((q) => q.author);
    expect(authors).toEqual(expect.arrayContaining(['Brené Brown', 'Hyrum Smith', 'Ralph Waldo Emerson']));
  });
});
