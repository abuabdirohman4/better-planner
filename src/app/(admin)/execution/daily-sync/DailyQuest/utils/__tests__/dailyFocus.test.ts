import { describe, it, expect } from 'vitest';
import { splitDailyItems, reorderIds, kindLabel } from '../dailyFocus';
import type { DailyPlanItem } from '@/types/daily-plan';

const item = (id: string, over: Partial<DailyPlanItem> = {}): DailyPlanItem => ({
  id, item_id: id, item_type: 'WORK_QUEST', status: 'TODO', display_order: 0, ...over,
});

describe('splitDailyItems', () => {
  it('HFG + Work by display_order: first 3 core, rest bonus', () => {
    const items = [
      item('e', { display_order: 5 }),
      item('a', { display_order: 1, item_type: 'MAIN_QUEST' }),
      item('c', { display_order: 3 }),
      item('b', { display_order: 2 }),
      item('d', { display_order: 4 }),
    ];
    const r = splitDailyItems(items);
    expect(r.core.map((i) => i.id)).toEqual(['a', 'b', 'c']);
    expect(r.bonus.map((i) => i.id)).toEqual(['d', 'e']);
    expect(r.missingHfg).toBe(false);
  });

  it('core may be shorter than 3 (hari berat)', () => {
    const r = splitDailyItems([item('a', { item_type: 'MAIN_QUEST' })]);
    expect(r.core).toHaveLength(1);
    expect(r.bonus).toEqual([]);
  });

  it('warns only when core has items but no HFG (HFG in bonus does not help)', () => {
    expect(splitDailyItems([item('a')]).missingHfg).toBe(true);
    expect(splitDailyItems([]).missingHfg).toBe(false);
    const items = [1, 2, 3].map((n) => item(`w${n}`, { display_order: n }))
      .concat(item('h', { display_order: 9, item_type: 'MAIN_QUEST' }));
    expect(splitDailyItems(items).missingHfg).toBe(true);
  });

  it('Side and Daily never enter focus; each ordered by display_order', () => {
    const items = [
      item('d2', { item_type: 'DAILY_QUEST', display_order: 2 }),
      item('d1', { item_type: 'DAILY_QUEST', display_order: 1 }),
      item('s1', { item_type: 'SIDE_QUEST', display_order: 1 }),
      item('w', { display_order: 1 }),
    ];
    const r = splitDailyItems(items);
    expect(r.side.map((i) => i.id)).toEqual(['s1']);
    expect(r.routine.map((i) => i.id)).toEqual(['d1', 'd2']);
    expect(r.core.map((i) => i.id)).toEqual(['w']);
  });
});

describe('reorderIds / kindLabel', () => {
  it('moves active to over position and renumbers from 1', () => {
    expect(reorderIds(['a', 'b', 'c'], 'c', 'a')).toEqual([
      { id: 'c', display_order: 1 }, { id: 'a', display_order: 2 }, { id: 'b', display_order: 3 },
    ]);
  });
  it('returns null for no-op or unknown ids', () => {
    expect(reorderIds(['a', 'b'], 'a', 'a')).toBeNull();
    expect(reorderIds(['a', 'b'], 'x', 'a')).toBeNull();
  });
  it('uses HFG, not Main Quest', () => {
    expect(kindLabel('MAIN_QUEST')).toBe('HFG');
  });
});
