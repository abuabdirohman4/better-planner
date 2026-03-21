// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder, makeSupabase } from '@/test-utils/supabase-mock';
import {
  queryLastRuleDisplayOrder,
  insertWeeklyRule,
  updateWeeklyRuleText,
  deleteWeeklyRuleById,
  updateRuleDisplayOrder,
} from '../queries';

describe('queryLastRuleDisplayOrder', () => {
  it('returns last display_order from DB', async () => {
    const b = makeQueryBuilder({ data: [{ display_order: 5 }], error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryLastRuleDisplayOrder(supabase, 'user-1', 2026, 1, 3);
    expect(result).toBe(5);
    expect(supabase.from).toHaveBeenCalledWith('weekly_rules');
  });

  it('returns undefined when no rules exist', async () => {
    const b = makeQueryBuilder({ data: [], error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await queryLastRuleDisplayOrder(supabase, 'user-1', 2026, 1, 3);
    expect(result).toBeUndefined();
  });

  it('throws on DB error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'query fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(queryLastRuleDisplayOrder(supabase, 'user-1', 2026, 1, 3)).rejects.toMatchObject({
      message: 'query fail',
    });
  });
});

describe('insertWeeklyRule', () => {
  it('inserts and returns inserted rule id', async () => {
    const b = makeQueryBuilder({ data: { id: 'rule-1' }, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    const result = await insertWeeklyRule(supabase, {
      userId: 'user-1',
      ruleText: 'No meetings before 9am',
      year: 2026,
      quarter: 1,
      weekNumber: 3,
      displayOrder: 1,
    });
    expect(result).toEqual({ id: 'rule-1' });
    expect(b.insert).toHaveBeenCalled();
  });

  it('throws on insert error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(
      insertWeeklyRule(supabase, {
        userId: 'user-1',
        ruleText: 'test',
        year: 2026,
        quarter: 1,
        weekNumber: 3,
        displayOrder: 1,
      })
    ).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('updateWeeklyRuleText', () => {
  it('calls update with new text', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await updateWeeklyRuleText(supabase, 'rule-1', 'user-1', 'New rule text');
    expect(b.update).toHaveBeenCalledWith({ rule_text: 'New rule text' });
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(
      updateWeeklyRuleText(supabase, 'rule-1', 'user-1', 'text')
    ).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('deleteWeeklyRuleById', () => {
  it('calls delete with id and user_id', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await deleteWeeklyRuleById(supabase, 'rule-1', 'user-1');
    expect(b.delete).toHaveBeenCalled();
    expect(b.eq).toHaveBeenCalledWith('id', 'rule-1');
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(deleteWeeklyRuleById(supabase, 'rule-1', 'user-1')).rejects.toMatchObject({
      message: 'delete fail',
    });
  });
});

describe('updateRuleDisplayOrder', () => {
  it('calls update with display_order', async () => {
    const b = makeQueryBuilder({ data: null, error: null });
    const supabase = makeSupabase({ fromBuilder: b });
    await updateRuleDisplayOrder(supabase, 'rule-1', 3);
    expect(b.update).toHaveBeenCalledWith({ display_order: 3 });
  });

  it('throws on error', async () => {
    const b = makeQueryBuilder({ data: null, error: { message: 'order fail' } });
    const supabase = makeSupabase({ fromBuilder: b });
    await expect(updateRuleDisplayOrder(supabase, 'rule-1', 3)).rejects.toMatchObject({
      message: 'order fail',
    });
  });
});
