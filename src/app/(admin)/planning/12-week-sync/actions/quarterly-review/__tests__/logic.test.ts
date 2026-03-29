// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildReviewInsertPayload,
  buildDefaultSyncActions,
  calculateAvgScore,
} from '../logic';

describe('buildReviewInsertPayload', () => {
  it('builds payload with correct year/quarter/dates', () => {
    const result = buildReviewInsertPayload('u1', 2026, 1, '2025-12-29', '2026-03-30');
    expect(result).toMatchObject({
      user_id: 'u1',
      year: 2026,
      quarter: 1,
      start_date: '2025-12-29',
      end_date: '2026-03-30',
      is_completed: false,
    });
    expect(result.created_at).toBeTruthy();
  });
});

describe('buildDefaultSyncActions', () => {
  it('returns 8 default sync actions', () => {
    const actions = buildDefaultSyncActions('review-1');
    expect(actions).toHaveLength(8);
    expect(actions[0]).toMatchObject({
      quarterly_review_id: 'review-1',
      is_completed: false,
      sort_order: 0,
    });
    expect(actions[0].action_text).toBeTruthy();
  });

  it('each action has unique sort_order', () => {
    const actions = buildDefaultSyncActions('r1');
    const orders = actions.map(a => a.sort_order);
    expect(new Set(orders).size).toBe(actions.length);
  });
});

describe('calculateAvgScore', () => {
  it('returns average of non-null scores', () => {
    const goalReviews = [
      { progress_score: 8 },
      { progress_score: 6 },
      { progress_score: null },
    ] as any[];
    expect(calculateAvgScore(goalReviews)).toBeCloseTo(7.0);
  });

  it('returns null when no scores rated', () => {
    expect(calculateAvgScore([{ progress_score: null }] as any[])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(calculateAvgScore([])).toBeNull();
  });
});
