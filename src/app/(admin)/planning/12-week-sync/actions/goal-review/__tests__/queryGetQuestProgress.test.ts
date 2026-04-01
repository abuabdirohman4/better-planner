// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryGetQuestProgress } from '../queryGetQuestProgress';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryGetQuestProgress', () => {
  it('returns 0 when questId is null', async () => {
    const supabase = makeFrom(makeQueryBuilder({ data: [], error: null }));
    const result = await queryGetQuestProgress(supabase, null);
    expect(result.overallProgress).toBe(0);
  });

  it('calculates average progress from milestones, tasks, and subtasks', async () => {
    const mockData = [
      {
        status: 'DONE',
        tasks: [
          {
            status: 'DONE',
            subtasks: [{ status: 'DONE' }, { status: 'TODO' }] // 50%
          },
          {
            status: 'TODO',
            subtasks: [{ status: 'TODO' }] // 0%
          }
        ]
      },
      {
        status: 'TODO',
        tasks: []
      }
    ];
    
    // Milestones: 1/2 DONE = 50%
    // Tasks: 1/2 DONE = 50%
    // Subtasks: 1/3 DONE = 33.33...%
    // Average: (50 + 50 + 33.33) / 3 = 44.44 => Math.round = 44%
    
    const builder = makeQueryBuilder({ data: mockData, error: null });
    const supabase = makeFrom(builder);

    const result = await queryGetQuestProgress(supabase, 'q1');
    expect(result.overallProgress).toBe(44);
    
    expect(builder.select).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('quest_id', 'q1');
  });

  it('handles empty milestones', async () => {
    const builder = makeQueryBuilder({ data: [], error: null });
    const supabase = makeFrom(builder);

    const result = await queryGetQuestProgress(supabase, 'q2');
    expect(result.overallProgress).toBe(0);
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'fetch error' } });
    const supabase = makeFrom(builder);

    await expect(queryGetQuestProgress(supabase, 'q3')).rejects.toMatchObject({ message: 'fetch error' });
  });
});
