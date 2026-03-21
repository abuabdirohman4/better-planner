// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseWeeklyRuleFormData, calculateNextDisplayOrder, batchUpdateIsNoop } from '../logic';

describe('parseWeeklyRuleFormData', () => {
  it('parses formData fields correctly', () => {
    const formData = new FormData();
    formData.set('rule_text', 'No social media');
    formData.set('year', '2026');
    formData.set('quarter', '1');
    formData.set('week_number', '5');
    const result = parseWeeklyRuleFormData(formData);
    expect(result).toEqual({
      ruleText: 'No social media',
      year: 2026,
      quarter: 1,
      weekNumber: 5,
    });
  });

  it('returns 0 for missing numeric fields (Number(null) === 0)', () => {
    const formData = new FormData();
    formData.set('rule_text', 'some rule');
    const result = parseWeeklyRuleFormData(formData);
    expect(result.ruleText).toBe('some rule');
    // FormData.get() returns null for missing keys; Number(null) === 0
    expect(result.year).toBe(0);
  });
});

describe('calculateNextDisplayOrder', () => {
  it('returns lastOrder + 1', () => {
    expect(calculateNextDisplayOrder(4)).toBe(5);
    expect(calculateNextDisplayOrder(0)).toBe(1);
  });

  it('returns 1 when lastOrder is undefined', () => {
    expect(calculateNextDisplayOrder(undefined)).toBe(1);
  });
});

describe('batchUpdateIsNoop', () => {
  it('returns true for empty array', () => {
    expect(batchUpdateIsNoop([])).toBe(true);
  });

  it('returns false for non-empty array', () => {
    expect(batchUpdateIsNoop([{ id: 'r1', display_order: 1 }])).toBe(false);
  });
});
