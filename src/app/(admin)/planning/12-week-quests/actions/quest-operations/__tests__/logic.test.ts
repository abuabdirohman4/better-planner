// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  separateQuestsByState,
  buildQuestInsertPayload,
  sortQuestsByScore,
  getTop3Quests,
  buildFinalizeResult,
} from '../logic';

describe('separateQuestsByState', () => {
  it('separates quests into filled-with-id, new, and empty', () => {
    const quests = [
      { id: 'q1', title: 'Quest 1', label: 'A' },
      { title: 'Quest 2', label: 'B' },
      { id: 'q3', title: '', label: 'C' },
    ];
    const result = separateQuestsByState(quests);
    expect(result.questsWithId).toHaveLength(1);
    expect(result.questsWithId[0].id).toBe('q1');
    expect(result.newQuests).toHaveLength(1);
    expect(result.newQuests[0].title).toBe('Quest 2');
    expect(result.emptyQuests).toHaveLength(1);
    expect(result.emptyQuests[0].id).toBe('q3');
  });

  it('handles all empty quests', () => {
    const result = separateQuestsByState([{ id: 'q1', title: '' }]);
    expect(result.questsWithId).toHaveLength(0);
    expect(result.newQuests).toHaveLength(0);
    expect(result.emptyQuests).toHaveLength(1);
  });
});

describe('buildQuestInsertPayload', () => {
  it('builds payload with PERSONAL type and user data', () => {
    const quest = { title: 'Quest A', label: 'A', is_continuation: true, continuation_strategy: 'restart' };
    const result = buildQuestInsertPayload(quest, 'u1', 2026, 1);
    expect(result).toMatchObject({
      title: 'Quest A',
      label: 'A',
      type: 'PERSONAL',
      year: 2026,
      quarter: 1,
      user_id: 'u1',
      is_continuation: true,
      continuation_strategy: 'restart',
    });
    expect(result.created_at).toBeTruthy();
  });

  it('sets optional fields to null when not provided', () => {
    const result = buildQuestInsertPayload({ title: 'Q', label: 'A' }, 'u1', 2026, 1);
    expect(result.source_quest_id).toBeNull();
    expect(result.continuation_strategy).toBeNull();
    expect(result.is_continuation).toBe(false);
  });
});

describe('sortQuestsByScore', () => {
  it('sorts descending by priority_score', () => {
    const quests = [{ id: 'a', priority_score: 3 }, { id: 'b', priority_score: 8 }, { id: 'c', priority_score: 1 }];
    const sorted = sortQuestsByScore(quests);
    expect(sorted.map(q => q.id)).toEqual(['b', 'a', 'c']);
  });

  it('does not mutate original array', () => {
    const quests = [{ id: 'a', priority_score: 1 }, { id: 'b', priority_score: 9 }];
    sortQuestsByScore(quests);
    expect(quests[0].id).toBe('a');
  });
});

describe('getTop3Quests', () => {
  it('returns top 3 quests by priority_score', () => {
    const quests = [
      { id: 'q1', priority_score: 2 },
      { id: 'q2', priority_score: 9 },
      { id: 'q3', priority_score: 5 },
      { id: 'q4', priority_score: 7 },
    ];
    const result = getTop3Quests(quests);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('q2');
    expect(result[1].id).toBe('q4');
    expect(result[2].id).toBe('q3');
  });

  it('returns fewer than 3 when fewer quests', () => {
    const result = getTop3Quests([{ id: 'q1', priority_score: 5 }]);
    expect(result).toHaveLength(1);
  });
});

describe('buildFinalizeResult', () => {
  it('builds result with top 3 quest titles', () => {
    const quests = [
      { title: 'Quest A', priority_score: 9 },
      { title: 'Quest B', priority_score: 7 },
      { title: 'Quest C', priority_score: 5 },
    ];
    const result = buildFinalizeResult(quests);
    expect(result.success).toBe(true);
    expect(result.message).toContain('Quest A');
    expect(result.message).toContain('Quest B');
    expect(result.url).toBe('/planning/main-quests');
  });

  it('returns success even with empty top3', () => {
    const result = buildFinalizeResult([]);
    expect(result.success).toBe(true);
  });
});
