// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateRpcSuccess, formatRpcResult } from '../logic';

describe('validateRpcSuccess', () => {
  it('does not throw when success is true', () => {
    expect(() => validateRpcSuccess({ success: true })).not.toThrow();
  });

  it('throws with error message when success is false', () => {
    expect(() => validateRpcSuccess({ success: false, error: 'Custom error' })).toThrow('Custom error');
  });

  it('throws default message when error field is missing', () => {
    expect(() => validateRpcSuccess({ success: false })).toThrow('RPC operation failed');
  });
});

describe('formatRpcResult', () => {
  it('formats RPC data to camelCase result', () => {
    const result = formatRpcResult({
      success: true,
      task: { id: 't1' },
      milestone_id: 'm1',
      quest_id: 'q1',
    });
    expect(result).toEqual({
      success: true,
      task: { id: 't1' },
      milestoneId: 'm1',
      questId: 'q1',
    });
  });

  it('handles missing optional fields', () => {
    const result = formatRpcResult({ success: true });
    expect(result.milestoneId).toBeUndefined();
    expect(result.questId).toBeUndefined();
  });

  it('always sets success to true', () => {
    const result = formatRpcResult({ success: false });
    expect(result.success).toBe(true);
  });
});
