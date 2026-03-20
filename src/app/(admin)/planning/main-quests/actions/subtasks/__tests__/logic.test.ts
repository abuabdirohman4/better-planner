// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isValidParentTaskId } from '../logic';

describe('isValidParentTaskId', () => {
  it('returns true for a non-empty string', () => {
    expect(isValidParentTaskId('task-123')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidParentTaskId('')).toBe(false);
  });

  it('returns false for a whitespace-only string', () => {
    expect(isValidParentTaskId('   ')).toBe(false);
  });
});
