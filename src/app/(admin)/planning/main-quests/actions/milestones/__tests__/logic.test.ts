// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseMilestoneFormData, calculateMilestoneOrder } from '../logic';

describe('parseMilestoneFormData', () => {
  it('parses valid form data', () => {
    const formData = new FormData();
    formData.append('quest_id', 'q1');
    formData.append('title', 'My Milestone');
    formData.append('display_order', '3');
    const result = parseMilestoneFormData(formData);
    expect(result).toEqual({ quest_id: 'q1', title: 'My Milestone', display_order: '3' });
  });

  it('returns null display_order when not provided', () => {
    const formData = new FormData();
    formData.append('quest_id', 'q1');
    formData.append('title', 'My Milestone');
    const result = parseMilestoneFormData(formData);
    expect(result.display_order).toBeNull();
  });

  it('throws when quest_id missing', () => {
    const formData = new FormData();
    formData.append('title', 'Milestone');
    expect(() => parseMilestoneFormData(formData)).toThrow('quest_id dan title wajib diisi');
  });

  it('throws when title missing', () => {
    const formData = new FormData();
    formData.append('quest_id', 'q1');
    expect(() => parseMilestoneFormData(formData)).toThrow('quest_id dan title wajib diisi');
  });
});

describe('calculateMilestoneOrder', () => {
  it('returns parsed displayOrderStr when provided', () => {
    expect(calculateMilestoneOrder('5', undefined)).toBe(5);
  });

  it('returns lastOrder + 1 when displayOrderStr is null', () => {
    expect(calculateMilestoneOrder(null, 3)).toBe(4);
  });

  it('returns 1 when displayOrderStr is null and lastOrder is undefined', () => {
    expect(calculateMilestoneOrder(null, undefined)).toBe(1);
  });
});
