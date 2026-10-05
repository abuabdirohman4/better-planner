import { describe, it, expect } from 'vitest';
import { QUOTES, quoteOfWeek } from '../quotes';

describe('quoteOfWeek', () => {
  it('deterministik dan bergilir', () => {
    expect(quoteOfWeek(1)).toBe(QUOTES[0]);
    expect(quoteOfWeek(1 + QUOTES.length)).toBe(QUOTES[0]);
    expect(quoteOfWeek(2)).toBe(QUOTES[1]);
  });
  it('minggu aneh tidak menghasilkan undefined', () => {
    expect(quoteOfWeek(0)).toBeDefined();
    expect(quoteOfWeek(-5)).toBeDefined();
  });
  it('3 quote buku Sync Planner ada', () => {
    const authors = QUOTES.map((q) => q.author);
    expect(authors).toEqual(expect.arrayContaining(['Brené Brown', 'Hyrum Smith', 'Ralph Waldo Emerson']));
  });
});
