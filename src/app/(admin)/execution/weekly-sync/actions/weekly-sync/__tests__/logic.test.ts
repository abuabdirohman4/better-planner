// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { normalizeWeeklySyncData } from '../logic';

describe('normalizeWeeklySyncData', () => {
  it('extracts goals and rules from data', () => {
    const data = {
      goals: [{ id: 'g1' }],
      rules: [{ id: 'r1' }],
    };
    expect(normalizeWeeklySyncData(data)).toEqual({
      goals: [{ id: 'g1' }],
      rules: [{ id: 'r1' }],
    });
  });

  it('returns empty arrays for null data', () => {
    expect(normalizeWeeklySyncData(null)).toEqual({ goals: [], rules: [] });
  });

  it('returns empty arrays when goals/rules keys are missing', () => {
    expect(normalizeWeeklySyncData({})).toEqual({ goals: [], rules: [] });
  });

  it('returns empty rules array when only goals present', () => {
    const result = normalizeWeeklySyncData({ goals: [{ id: 'g1' }] });
    expect(result.rules).toEqual([]);
    expect(result.goals).toHaveLength(1);
  });
});
