// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateItemId } from '../logic';

describe('validateItemId', () => {
  it('returns item_id when item is valid', () => {
    const result = validateItemId({ item_id: 'task-abc' });
    expect(result).toBe('task-abc');
  });

  it('throws when item is null', () => {
    expect(() => validateItemId(null)).toThrow('Item ID not found');
  });

  it('throws when item_id is empty string', () => {
    expect(() => validateItemId({ item_id: '' })).toThrow('Item ID not found');
  });
});
