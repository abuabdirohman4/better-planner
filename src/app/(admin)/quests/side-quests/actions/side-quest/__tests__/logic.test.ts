// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildSideQuestUpdateData } from '../logic';

describe('buildSideQuestUpdateData', () => {
  it('includes updated_at in result', () => {
    const result = buildSideQuestUpdateData({});
    expect(result).toHaveProperty('updated_at');
    expect(typeof result.updated_at).toBe('string');
  });

  it('includes title when provided', () => {
    const result = buildSideQuestUpdateData({ title: 'New Title' });
    expect(result.title).toBe('New Title');
  });

  it('includes description when provided', () => {
    const result = buildSideQuestUpdateData({ description: 'New desc' });
    expect(result.description).toBe('New desc');
  });

  it('does not include title when not provided', () => {
    const result = buildSideQuestUpdateData({ description: 'desc' });
    expect(result).not.toHaveProperty('title');
  });
});
