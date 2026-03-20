// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildQuestInsertData, getTop3QuestIds, sortQuestsByPriority } from '../logic';

describe('buildQuestInsertData', () => {
  it('maps quests to insert payload with correct fields', () => {
    const quests = [{ title: 'Quest A', label: 'A' }, { title: 'Quest B', label: 'B' }];
    const result = buildQuestInsertData(quests, 'user-1', 2026, 1);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      user_id: 'user-1',
      title: 'Quest A',
      label: 'A',
      year: 2026,
      quarter: 1,
      is_committed: false,
      type: 'PERSONAL',
    });
  });

  it('returns empty array for empty input', () => {
    expect(buildQuestInsertData([], 'u1', 2026, 1)).toEqual([]);
  });
});

describe('getTop3QuestIds', () => {
  it('returns top 3 by priority_score descending', () => {
    const quests = [
      { id: 'q1', priority_score: 3 },
      { id: 'q2', priority_score: 8 },
      { id: 'q3', priority_score: 5 },
      { id: 'q4', priority_score: 9 },
      { id: 'q5', priority_score: 1 },
    ];
    const result = getTop3QuestIds(quests);
    expect(result).toEqual(['q4', 'q2', 'q3']);
  });

  it('returns all ids when fewer than 3', () => {
    const quests = [{ id: 'q1', priority_score: 5 }, { id: 'q2', priority_score: 3 }];
    expect(getTop3QuestIds(quests)).toEqual(['q1', 'q2']);
  });

  it('does not mutate original array', () => {
    const quests = [{ id: 'q1', priority_score: 1 }, { id: 'q2', priority_score: 9 }];
    getTop3QuestIds(quests);
    expect(quests[0].id).toBe('q1');
  });
});

describe('sortQuestsByPriority', () => {
  it('sorts descending by priority_score', () => {
    const quests = [{ id: 'a', priority_score: 2 }, { id: 'b', priority_score: 7 }, { id: 'c', priority_score: 4 }];
    const sorted = sortQuestsByPriority(quests);
    expect(sorted.map(q => q.id)).toEqual(['b', 'c', 'a']);
  });

  it('does not mutate original', () => {
    const quests = [{ id: 'a', priority_score: 2 }, { id: 'b', priority_score: 7 }];
    sortQuestsByPriority(quests);
    expect(quests[0].id).toBe('a');
  });
});
