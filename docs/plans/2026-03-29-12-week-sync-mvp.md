# 12 Week Sync MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a quarterly review page at `/planning/12-week-sync` where users can rate their High Focus Goals (1-10), list accomplishments, answer 5 reflection questions, check off sync actions, and view history of past quarters.

**Architecture:** 3-layer server actions pattern (queries → logic → actions) mirroring existing features. SWR for client-side data fetching with auto-save via debounce. 4 new Supabase tables with RLS isolation by `user_id`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase (MCP), SWR, Tailwind CSS v4, Vitest, `@/test-utils/supabase-mock`

**GitHub Issue:** [#4](https://github.com/abuabdirohman4/better-planner/issues/4)
**Beads Issue:** bp-a63

---

## Task 1: Database Migration

**Files:**
- Run migration via: Supabase MCP `mcp__better-planner__apply_migration`

**Step 1: Apply migration**

Run via Supabase MCP with name `create_12_week_sync_tables` and SQL:

```sql
-- 1. quarterly_reviews
CREATE TABLE quarterly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  challenges_faced TEXT,
  advice_for_next TEXT,
  reward TEXT,
  goals_needing_commitment TEXT,
  goals_needing_revision TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year, quarter)
);

-- 2. goal_reviews
CREATE TABLE goal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarterly_review_id UUID NOT NULL REFERENCES quarterly_reviews(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  goal_name TEXT NOT NULL,
  progress_score INTEGER CHECK (progress_score BETWEEN 1 AND 10),
  achievement_notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. accomplishments
CREATE TABLE accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarterly_review_id UUID NOT NULL REFERENCES quarterly_reviews(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. sync_actions
CREATE TABLE sync_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarterly_review_id UUID NOT NULL REFERENCES quarterly_reviews(id) ON DELETE CASCADE,
  action_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- RLS
ALTER TABLE quarterly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_actions ENABLE ROW LEVEL SECURITY;

-- quarterly_reviews: direct user_id
CREATE POLICY "Users manage own quarterly_reviews"
  ON quarterly_reviews FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- goal_reviews: via quarterly_reviews
CREATE POLICY "Users manage own goal_reviews"
  ON goal_reviews FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = goal_reviews.quarterly_review_id
    AND qr.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = goal_reviews.quarterly_review_id
    AND qr.user_id = auth.uid()
  ));

-- accomplishments: via quarterly_reviews
CREATE POLICY "Users manage own accomplishments"
  ON accomplishments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = accomplishments.quarterly_review_id
    AND qr.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = accomplishments.quarterly_review_id
    AND qr.user_id = auth.uid()
  ));

-- sync_actions: via quarterly_reviews
CREATE POLICY "Users manage own sync_actions"
  ON sync_actions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = sync_actions.quarterly_review_id
    AND qr.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM quarterly_reviews qr
    WHERE qr.id = sync_actions.quarterly_review_id
    AND qr.user_id = auth.uid()
  ));
```

**Step 2: Verify tables exist**

Run via MCP: `mcp__better-planner__list_tables` — confirm all 4 tables appear.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore(db): add quarterly_reviews, goal_reviews, accomplishments, sync_actions tables (fixes #4)"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/types/twelve-week-sync.ts`

**Step 1: Write the file**

```typescript
// src/types/twelve-week-sync.ts

export interface QuarterlyReview {
  id: string;
  user_id: string;
  year: number;
  quarter: number;
  start_date: string;
  end_date: string;
  challenges_faced: string | null;
  advice_for_next: string | null;
  reward: string | null;
  goals_needing_commitment: string | null;
  goals_needing_revision: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalReview {
  id: string;
  quarterly_review_id: string;
  quest_id: string | null;
  goal_name: string;
  progress_score: number | null;
  achievement_notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Accomplishment {
  id: string;
  quarterly_review_id: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface SyncAction {
  id: string;
  quarterly_review_id: string;
  action_text: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface TwelveWeekSyncData {
  review: QuarterlyReview;
  goalReviews: GoalReview[];
  accomplishments: Accomplishment[];
  syncActions: SyncAction[];
}

export interface QuarterlyReviewSummary {
  id: string;
  year: number;
  quarter: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  completed_at: string | null;
  avg_score: number | null;
}

export type ReflectionField =
  | 'challenges_faced'
  | 'advice_for_next'
  | 'reward'
  | 'goals_needing_commitment'
  | 'goals_needing_revision';
```

**Step 2: Run type-check**

```bash
npm run type-check
```
Expected: no errors related to `twelve-week-sync.ts`

**Step 3: Commit**

```bash
git add src/types/twelve-week-sync.ts
git commit -m "feat(12-week-sync): add TypeScript types (fixes #4)"
```

---

## Task 3: Server Actions — `quarterly-review` domain

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/queries.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/logic.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/actions.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/__tests__/queries.test.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/__tests__/logic.test.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/quarterly-review/__tests__/actions.test.ts`

### Step 1: Write failing tests for logic

```typescript
// src/app/(admin)/planning/12-week-sync/actions/quarterly-review/__tests__/logic.test.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  buildReviewInsertPayload,
  buildDefaultSyncActions,
  calculateAvgScore,
} from '../logic';

describe('buildReviewInsertPayload', () => {
  it('builds payload with correct year/quarter/dates', () => {
    const result = buildReviewInsertPayload('u1', 2026, 1, '2025-12-29', '2026-03-30');
    expect(result).toMatchObject({
      user_id: 'u1',
      year: 2026,
      quarter: 1,
      start_date: '2025-12-29',
      end_date: '2026-03-30',
      is_completed: false,
    });
    expect(result.created_at).toBeTruthy();
  });
});

describe('buildDefaultSyncActions', () => {
  it('returns 8 default sync actions', () => {
    const actions = buildDefaultSyncActions('review-1');
    expect(actions).toHaveLength(8);
    expect(actions[0]).toMatchObject({
      quarterly_review_id: 'review-1',
      is_completed: false,
      sort_order: 0,
    });
    expect(actions[0].action_text).toBeTruthy();
  });

  it('each action has unique sort_order', () => {
    const actions = buildDefaultSyncActions('r1');
    const orders = actions.map(a => a.sort_order);
    expect(new Set(orders).size).toBe(actions.length);
  });
});

describe('calculateAvgScore', () => {
  it('returns average of non-null scores', () => {
    const goalReviews = [
      { progress_score: 8 },
      { progress_score: 6 },
      { progress_score: null },
    ] as any[];
    expect(calculateAvgScore(goalReviews)).toBeCloseTo(7.0);
  });

  it('returns null when no scores rated', () => {
    expect(calculateAvgScore([{ progress_score: null }] as any[])).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(calculateAvgScore([])).toBeNull();
  });
});
```

**Step 2: Run tests — expect FAIL**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/quarterly-review/__tests__/logic.test.ts
```
Expected: FAIL — "Cannot find module '../logic'"

### Step 3: Write failing tests for queries

```typescript
// src/app/(admin)/planning/12-week-sync/actions/quarterly-review/__tests__/queries.test.ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import {
  queryGetOrCreateReview,
  queryUpdateReview,
  queryCompleteReview,
  queryGetReviewWithRelations,
  queryGetReviewHistory,
} from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryUpdateReview', () => {
  it('calls update with correct payload and eq filters', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryUpdateReview(supabase, 'r1', 'u1', { challenges_faced: 'hard' });
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ challenges_faced: 'hard' }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'r1');
    expect(builder.eq).toHaveBeenCalledWith('user_id', 'u1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'update fail' } });
    const supabase = makeFrom(builder);
    await expect(queryUpdateReview(supabase, 'r1', 'u1', {})).rejects.toMatchObject({ message: 'update fail' });
  });
});

describe('queryCompleteReview', () => {
  it('sets is_completed true and completed_at', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryCompleteReview(supabase, 'r1', 'u1');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: true,
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'complete fail' } });
    const supabase = makeFrom(builder);
    await expect(queryCompleteReview(supabase, 'r1', 'u1')).rejects.toMatchObject({ message: 'complete fail' });
  });
});
```

**Step 4: Run tests — expect FAIL**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/quarterly-review/__tests__/queries.test.ts
```
Expected: FAIL — "Cannot find module '../queries'"

### Step 5: Write `logic.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/quarterly-review/logic.ts
import type { GoalReview } from '@/types/twelve-week-sync';

const DEFAULT_SYNC_ACTIONS = [
  'Review and rate each High Focus Goal',
  'List 5-10 accomplishments',
  'Answer reflection questions honestly',
  'Set reward and schedule it',
  'Archive completed quarter',
  'Set 3 new High Focus Goals for next quarter',
  'Update Best Week template based on learnings',
  'Review Habit Tracker patterns',
];

export function buildReviewInsertPayload(
  userId: string,
  year: number,
  quarter: number,
  startDate: string,
  endDate: string
) {
  return {
    user_id: userId,
    year,
    quarter,
    start_date: startDate,
    end_date: endDate,
    is_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function buildDefaultSyncActions(quarterlyReviewId: string) {
  return DEFAULT_SYNC_ACTIONS.map((action_text, index) => ({
    quarterly_review_id: quarterlyReviewId,
    action_text,
    is_completed: false,
    sort_order: index,
  }));
}

export function calculateAvgScore(goalReviews: Pick<GoalReview, 'progress_score'>[]): number | null {
  const scored = goalReviews.filter(g => g.progress_score !== null);
  if (scored.length === 0) return null;
  const sum = scored.reduce((acc, g) => acc + (g.progress_score as number), 0);
  return sum / scored.length;
}
```

### Step 6: Write `queries.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/quarterly-review/queries.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryGetOrCreateReview(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function queryInsertReview(
  supabase: SupabaseClient,
  payload: {
    user_id: string;
    year: number;
    quarter: number;
    start_date: string;
    end_date: string;
    is_completed: boolean;
    created_at: string;
    updated_at: string;
  }
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function queryUpdateReview(
  supabase: SupabaseClient,
  reviewId: string,
  userId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase
    .from('quarterly_reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryCompleteReview(
  supabase: SupabaseClient,
  reviewId: string,
  userId: string
) {
  const { error } = await supabase
    .from('quarterly_reviews')
    .update({
      is_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function queryGetReviewWithRelations(
  supabase: SupabaseClient,
  userId: string,
  year: number,
  quarter: number
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select(`
      *,
      goal_reviews(*),
      accomplishments(*),
      sync_actions(*)
    `)
    .eq('user_id', userId)
    .eq('year', year)
    .eq('quarter', quarter)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function queryGetReviewHistory(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('quarterly_reviews')
    .select('id, year, quarter, start_date, end_date, is_completed, completed_at')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('quarter', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
```

### Step 7: Write `actions.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/quarterly-review/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { getQuarterDates } from '@/lib/quarterUtils';
import type { TwelveWeekSyncData, QuarterlyReviewSummary, ReflectionField } from '@/types/twelve-week-sync';
import {
  queryGetOrCreateReview,
  queryInsertReview,
  queryUpdateReview,
  queryCompleteReview,
  queryGetReviewWithRelations,
  queryGetReviewHistory,
} from './queries';
import { buildReviewInsertPayload, buildDefaultSyncActions } from './logic';

export async function getOrCreateQuarterlyReview(
  year: number,
  quarter: number
): Promise<{ success: boolean; data?: TwelveWeekSyncData; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if review exists with all relations
    const existing = await queryGetReviewWithRelations(supabase, user.id, year, quarter);
    if (existing) {
      return {
        success: true,
        data: {
          review: existing,
          goalReviews: existing.goal_reviews ?? [],
          accomplishments: (existing.accomplishments ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
          syncActions: (existing.sync_actions ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        },
      };
    }

    // Create new review
    const { startDate, endDate } = getQuarterDates(year, quarter);
    const payload = buildReviewInsertPayload(
      user.id, year, quarter,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    const newReview = await queryInsertReview(supabase, payload);

    // Pre-populate goal_reviews from quests
    const { data: quests } = await supabase
      .from('quests')
      .select('id, title, label')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('quarter', quarter)
      .eq('is_committed', true)
      .order('priority_score', { ascending: false })
      .limit(3);

    if (quests && quests.length > 0) {
      const goalReviewPayloads = quests.map((q: any, idx: number) => ({
        quarterly_review_id: newReview.id,
        quest_id: q.id,
        goal_name: q.title,
        sort_order: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from('goal_reviews').insert(goalReviewPayloads);
    }

    // Pre-populate default sync_actions
    const syncActionPayloads = buildDefaultSyncActions(newReview.id);
    await supabase.from('sync_actions').insert(syncActionPayloads);

    // Return fresh data
    const fresh = await queryGetReviewWithRelations(supabase, user.id, year, quarter);
    return {
      success: true,
      data: {
        review: fresh,
        goalReviews: (fresh.goal_reviews ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        accomplishments: [],
        syncActions: (fresh.sync_actions ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      },
    };
  } catch (error) {
    const err = handleApiError(error, 'memuat quarterly review');
    return { success: false, message: err.message };
  }
}

export async function updateReflection(
  reviewId: string,
  field: ReflectionField,
  value: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryUpdateReview(supabase, reviewId, user.id, { [field]: value });
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menyimpan refleksi');
    return { success: false, message: err.message };
  }
}

export async function completeQuarterlyReview(
  reviewId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryCompleteReview(supabase, reviewId, user.id);
    revalidatePath('/planning/12-week-sync');
    revalidatePath('/planning/12-week-sync/history');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menyelesaikan quarterly review');
    return { success: false, message: err.message };
  }
}

export async function getQuarterlyReviewHistory(): Promise<{
  success: boolean;
  data?: QuarterlyReviewSummary[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const history = await queryGetReviewHistory(supabase, user.id);
    return { success: true, data: history };
  } catch (error) {
    const err = handleApiError(error, 'memuat history');
    return { success: false, message: err.message };
  }
}
```

**Step 8: Run logic tests — expect PASS**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/quarterly-review/__tests__/logic.test.ts
```
Expected: all PASS

**Step 9: Run query tests — expect PASS**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/quarterly-review/__tests__/queries.test.ts
```
Expected: all PASS

**Step 10: Run type-check**

```bash
npm run type-check
```
Expected: no errors

**Step 11: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/actions/quarterly-review/
git commit -m "feat(12-week-sync): add quarterly-review 3-layer server actions (fixes #4)"
```

---

## Task 4: Server Actions — `goal-review`, `accomplishments`, `sync-actions` domains

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/actions/goal-review/queries.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/goal-review/actions.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/goal-review/__tests__/queries.test.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/accomplishments/queries.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/accomplishments/actions.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/accomplishments/__tests__/queries.test.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/sync-actions/queries.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/sync-actions/actions.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/sync-actions/__tests__/queries.test.ts`
- Create: `src/app/(admin)/planning/12-week-sync/actions/index.ts`

### Step 1: Write failing test for goal-review queries

```typescript
// src/app/(admin)/planning/12-week-sync/actions/goal-review/__tests__/queries.test.ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryUpsertGoalReview } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryUpsertGoalReview', () => {
  it('calls update with score and notes', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryUpsertGoalReview(supabase, 'gr1', 'r1', 8, 'great work');
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      progress_score: 8,
      achievement_notes: 'great work',
    }));
    expect(builder.eq).toHaveBeenCalledWith('id', 'gr1');
    expect(builder.eq).toHaveBeenCalledWith('quarterly_review_id', 'r1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'upsert fail' } });
    const supabase = makeFrom(builder);
    await expect(queryUpsertGoalReview(supabase, 'gr1', 'r1', 5, null)).rejects.toMatchObject({ message: 'upsert fail' });
  });
});
```

**Step 2: Run — expect FAIL**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/goal-review/__tests__/queries.test.ts
```

### Step 3: Write failing test for accomplishments queries

```typescript
// src/app/(admin)/planning/12-week-sync/actions/accomplishments/__tests__/queries.test.ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryInsertAccomplishment, queryDeleteAccomplishment } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryInsertAccomplishment', () => {
  it('inserts and returns data', async () => {
    const row = { id: 'a1', description: 'Did great', sort_order: 0 };
    const builder = makeQueryBuilder({ data: row, error: null });
    const supabase = makeFrom(builder);
    const result = await queryInsertAccomplishment(supabase, 'r1', 'Did great', 0);
    expect(result).toEqual(row);
    expect(builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      quarterly_review_id: 'r1',
      description: 'Did great',
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'insert fail' } });
    const supabase = makeFrom(builder);
    await expect(queryInsertAccomplishment(supabase, 'r1', 'x', 0)).rejects.toMatchObject({ message: 'insert fail' });
  });
});

describe('queryDeleteAccomplishment', () => {
  it('deletes with correct id', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryDeleteAccomplishment(supabase, 'a1', 'r1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'a1');
    expect(builder.eq).toHaveBeenCalledWith('quarterly_review_id', 'r1');
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'delete fail' } });
    const supabase = makeFrom(builder);
    await expect(queryDeleteAccomplishment(supabase, 'a1', 'r1')).rejects.toMatchObject({ message: 'delete fail' });
  });
});
```

**Step 4: Run — expect FAIL**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/accomplishments/__tests__/queries.test.ts
```

### Step 5: Write failing test for sync-actions queries

```typescript
// src/app/(admin)/planning/12-week-sync/actions/sync-actions/__tests__/queries.test.ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { makeQueryBuilder } from '@/test-utils/supabase-mock';
import { queryToggleSyncAction } from '../queries';

const makeFrom = (builder: any) => ({ from: vi.fn().mockReturnValue(builder) } as any);

describe('queryToggleSyncAction', () => {
  it('sets is_completed true and completed_at when completing', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryToggleSyncAction(supabase, 'sa1', 'r1', true);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: true,
    }));
  });

  it('sets is_completed false and completed_at null when uncompleting', async () => {
    const builder = makeQueryBuilder({ data: null, error: null });
    const supabase = makeFrom(builder);
    await queryToggleSyncAction(supabase, 'sa1', 'r1', false);
    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({
      is_completed: false,
      completed_at: null,
    }));
  });

  it('throws on error', async () => {
    const builder = makeQueryBuilder({ data: null, error: { message: 'toggle fail' } });
    const supabase = makeFrom(builder);
    await expect(queryToggleSyncAction(supabase, 'sa1', 'r1', true)).rejects.toMatchObject({ message: 'toggle fail' });
  });
});
```

**Step 6: Run — expect FAIL**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/sync-actions/__tests__/queries.test.ts
```

### Step 7: Implement `goal-review/queries.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/goal-review/queries.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryUpsertGoalReview(
  supabase: SupabaseClient,
  goalReviewId: string,
  quarterlyReviewId: string,
  score: number | null,
  notes: string | null
) {
  const { error } = await supabase
    .from('goal_reviews')
    .update({
      progress_score: score,
      achievement_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalReviewId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
```

### Step 8: Implement `goal-review/actions.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/goal-review/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryUpsertGoalReview } from './queries';

export async function upsertGoalReview(
  goalReviewId: string,
  quarterlyReviewId: string,
  score: number | null,
  notes: string | null
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryUpsertGoalReview(supabase, goalReviewId, quarterlyReviewId, score, notes);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menyimpan goal review');
    return { success: false, message: err.message };
  }
}
```

### Step 9: Implement `accomplishments/queries.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/accomplishments/queries.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryInsertAccomplishment(
  supabase: SupabaseClient,
  quarterlyReviewId: string,
  description: string,
  sortOrder: number
) {
  const { data, error } = await supabase
    .from('accomplishments')
    .insert({
      quarterly_review_id: quarterlyReviewId,
      description,
      sort_order: sortOrder,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function queryDeleteAccomplishment(
  supabase: SupabaseClient,
  accomplishmentId: string,
  quarterlyReviewId: string
) {
  const { error } = await supabase
    .from('accomplishments')
    .delete()
    .eq('id', accomplishmentId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
```

### Step 10: Implement `accomplishments/actions.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/accomplishments/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryInsertAccomplishment, queryDeleteAccomplishment } from './queries';
import type { Accomplishment } from '@/types/twelve-week-sync';

export async function addAccomplishment(
  quarterlyReviewId: string,
  description: string,
  sortOrder: number
): Promise<{ success: boolean; data?: Accomplishment; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    const data = await queryInsertAccomplishment(supabase, quarterlyReviewId, description, sortOrder);
    revalidatePath('/planning/12-week-sync');
    return { success: true, data };
  } catch (error) {
    const err = handleApiError(error, 'menambah pencapaian');
    return { success: false, message: err.message };
  }
}

export async function removeAccomplishment(
  accomplishmentId: string,
  quarterlyReviewId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryDeleteAccomplishment(supabase, accomplishmentId, quarterlyReviewId);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'menghapus pencapaian');
    return { success: false, message: err.message };
  }
}
```

### Step 11: Implement `sync-actions/queries.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/sync-actions/queries.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export async function queryToggleSyncAction(
  supabase: SupabaseClient,
  syncActionId: string,
  quarterlyReviewId: string,
  isCompleted: boolean
) {
  const { error } = await supabase
    .from('sync_actions')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    })
    .eq('id', syncActionId)
    .eq('quarterly_review_id', quarterlyReviewId);
  if (error) throw error;
}
```

### Step 12: Implement `sync-actions/actions.ts`

```typescript
// src/app/(admin)/planning/12-week-sync/actions/sync-actions/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { handleApiError } from '@/lib/errorUtils';
import { queryToggleSyncAction } from './queries';

export async function toggleSyncAction(
  syncActionId: string,
  quarterlyReviewId: string,
  isCompleted: boolean
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    await queryToggleSyncAction(supabase, syncActionId, quarterlyReviewId, isCompleted);
    revalidatePath('/planning/12-week-sync');
    return { success: true };
  } catch (error) {
    const err = handleApiError(error, 'mengubah sync action');
    return { success: false, message: err.message };
  }
}
```

### Step 13: Create actions index

```typescript
// src/app/(admin)/planning/12-week-sync/actions/index.ts
export * from './quarterly-review/actions';
export * from './goal-review/actions';
export * from './accomplishments/actions';
export * from './sync-actions/actions';
```

**Step 14: Run all new tests — expect PASS**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/actions/
```
Expected: all PASS

**Step 15: Run type-check**

```bash
npm run type-check
```

**Step 16: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/actions/
git commit -m "feat(12-week-sync): add goal-review, accomplishments, sync-actions server actions (fixes #4)"
```

---

## Task 5: SWR Key Generators

**Files:**
- Modify: `src/lib/swr.ts`

**Step 1: Add `quarterlyReviewKeys` to swr.ts**

After the `habitKeys` block (line ~199), add:

```typescript
/**
 * SWR key generator for 12 week sync
 */
export const quarterlyReviewKeys = {
  all: ['quarterly-reviews'] as const,
  detail: (year: number, quarter: number) => [...quarterlyReviewKeys.all, 'detail', year, quarter] as const,
  history: () => [...quarterlyReviewKeys.all, 'history'] as const,
};
```

Also add to `dataKeys` object:
```typescript
quarterlyReviews: quarterlyReviewKeys,
```

**Step 2: Run type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/lib/swr.ts
git commit -m "feat(12-week-sync): add quarterlyReviewKeys to swr.ts (fixes #4)"
```

---

## Task 6: SWR Hook

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/hooks/useTwelveWeekSync.ts`

**Step 1: Write the hook**

```typescript
// src/app/(admin)/planning/12-week-sync/hooks/useTwelveWeekSync.ts
'use client';

import useSWR from 'swr';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { quarterlyReviewKeys } from '@/lib/swr';
import type { TwelveWeekSyncData, ReflectionField } from '@/types/twelve-week-sync';
import { getOrCreateQuarterlyReview, updateReflection, completeQuarterlyReview } from '../actions/quarterly-review/actions';
import { upsertGoalReview } from '../actions/goal-review/actions';
import { addAccomplishment, removeAccomplishment } from '../actions/accomplishments/actions';
import { toggleSyncAction } from '../actions/sync-actions/actions';

export function useTwelveWeekSync(year: number, quarter: number) {
  const key = quarterlyReviewKeys.detail(year, quarter);

  const { data, error, isLoading, mutate } = useSWR<TwelveWeekSyncData>(
    key,
    async () => {
      const result = await getOrCreateQuarterlyReview(year, quarter);
      if (!result.success || !result.data) throw new Error(result.message ?? 'Failed to load');
      return result.data;
    },
    {
      keepPreviousData: true,
      dedupingInterval: 2 * 60 * 1000,
      revalidateOnFocus: false,
    }
  );

  const handleUpdateReflection = useCallback(async (field: ReflectionField, value: string) => {
    if (!data) return;
    // Optimistic update
    mutate({ ...data, review: { ...data.review, [field]: value } }, false);
    const result = await updateReflection(data.review.id, field, value);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal menyimpan');
      mutate(); // revert
    }
  }, [data, mutate]);

  const handleUpsertGoalReview = useCallback(async (
    goalReviewId: string,
    score: number | null,
    notes: string | null
  ) => {
    if (!data) return;
    const result = await upsertGoalReview(goalReviewId, data.review.id, score, notes);
    if (result.success) {
      mutate();
    } else {
      toast.error(result.message ?? 'Gagal menyimpan score');
    }
  }, [data, mutate]);

  const handleAddAccomplishment = useCallback(async (description: string) => {
    if (!data) return;
    const sortOrder = data.accomplishments.length;
    const result = await addAccomplishment(data.review.id, description, sortOrder);
    if (result.success && result.data) {
      mutate({ ...data, accomplishments: [...data.accomplishments, result.data] }, false);
    } else {
      toast.error(result.message ?? 'Gagal menambah pencapaian');
      mutate();
    }
  }, [data, mutate]);

  const handleRemoveAccomplishment = useCallback(async (accomplishmentId: string) => {
    if (!data) return;
    mutate(
      { ...data, accomplishments: data.accomplishments.filter(a => a.id !== accomplishmentId) },
      false
    );
    const result = await removeAccomplishment(accomplishmentId, data.review.id);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal menghapus pencapaian');
      mutate();
    }
  }, [data, mutate]);

  const handleToggleSyncAction = useCallback(async (syncActionId: string, isCompleted: boolean) => {
    if (!data) return;
    mutate({
      ...data,
      syncActions: data.syncActions.map(a =>
        a.id === syncActionId ? { ...a, is_completed: isCompleted } : a
      ),
    }, false);
    const result = await toggleSyncAction(syncActionId, data.review.id, isCompleted);
    if (!result.success) {
      toast.error(result.message ?? 'Gagal update sync action');
      mutate();
    }
  }, [data, mutate]);

  const handleCompleteReview = useCallback(async () => {
    if (!data) return;
    const result = await completeQuarterlyReview(data.review.id);
    if (result.success) {
      toast.success('Review selesai! 🎉');
      mutate();
    } else {
      toast.error(result.message ?? 'Gagal menyelesaikan review');
    }
  }, [data, mutate]);

  return {
    data,
    isLoading,
    error,
    handleUpdateReflection,
    handleUpsertGoalReview,
    handleAddAccomplishment,
    handleRemoveAccomplishment,
    handleToggleSyncAction,
    handleCompleteReview,
  };
}
```

**Step 2: Run type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/hooks/
git commit -m "feat(12-week-sync): add useTwelveWeekSync SWR hook (fixes #4)"
```

---

## Task 7: UI Components

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/components/GoalReviewCard.tsx`
- Create: `src/app/(admin)/planning/12-week-sync/components/AccomplishmentsList.tsx`
- Create: `src/app/(admin)/planning/12-week-sync/components/ReflectionQuestions.tsx`
- Create: `src/app/(admin)/planning/12-week-sync/components/SyncActionChecklist.tsx`

### Step 1: `GoalReviewCard.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/components/GoalReviewCard.tsx
'use client';

import { useState } from 'react';
import type { GoalReview } from '@/types/twelve-week-sync';

interface Props {
  goalReview: GoalReview;
  onScoreChange: (goalReviewId: string, score: number, notes: string | null) => void;
}

function getScoreColor(score: number): string {
  if (score >= 9) return 'bg-emerald-500 border-emerald-500 text-white';
  if (score >= 7) return 'bg-blue-500 border-blue-500 text-white';
  if (score >= 5) return 'bg-amber-500 border-amber-500 text-white';
  return 'bg-red-500 border-red-500 text-white';
}

function getStars(score: number): string {
  if (score >= 9) return '⭐⭐⭐⭐⭐';
  if (score >= 7) return '⭐⭐⭐⭐';
  if (score >= 5) return '⭐⭐⭐';
  if (score >= 3) return '⭐⭐';
  return '⭐';
}

export default function GoalReviewCard({ goalReview, onScoreChange }: Props) {
  const [notes, setNotes] = useState(goalReview.achievement_notes ?? '');
  const [showNotes, setShowNotes] = useState(false);
  const score = goalReview.progress_score;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <p className="font-medium text-gray-900 dark:text-white">{goalReview.goal_name}</p>

      {/* Score buttons */}
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => onScoreChange(goalReview.id, n, notes || null)}
            className={`w-9 h-9 rounded-lg border-2 text-sm font-semibold transition-all duration-150 hover:scale-110 ${
              score === n
                ? getScoreColor(n)
                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {score && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Score: <span className="font-semibold text-gray-900 dark:text-white">{score}/10</span>{' '}
          {getStars(score)}
        </p>
      )}

      {/* Notes toggle */}
      <button
        onClick={() => setShowNotes(v => !v)}
        className="text-xs text-blue-500 hover:underline"
      >
        {showNotes ? 'Sembunyikan catatan' : '+ Tambah catatan (opsional)'}
      </button>

      {showNotes && (
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => onScoreChange(goalReview.id, score ?? 0, notes || null)}
          rows={2}
          placeholder="Catatan pencapaian..."
          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}
```

### Step 2: `AccomplishmentsList.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/components/AccomplishmentsList.tsx
'use client';

import { useState, useRef } from 'react';
import type { Accomplishment } from '@/types/twelve-week-sync';

interface Props {
  accomplishments: Accomplishment[];
  onAdd: (description: string) => void;
  onRemove: (id: string) => void;
}

export default function AccomplishmentsList({ accomplishments, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      {accomplishments.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-2 group">
          <span className="text-sm text-gray-400 w-5 shrink-0">{idx + 1}.</span>
          <span className="flex-1 text-sm text-gray-900 dark:text-white">{item.description}</span>
          <button
            onClick={() => onRemove(item.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity text-lg leading-none"
            aria-label="Hapus"
          >
            ×
          </button>
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="+ Tambah pencapaian... (Enter untuk simpan)"
          className="flex-1 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg disabled:opacity-40 hover:bg-blue-600 transition-colors"
        >
          Tambah
        </button>
      </div>

      <p className="text-xs text-gray-400">
        {accomplishments.length}/10 pencapaian.{' '}
        {accomplishments.length < 5 && 'Target minimal 5 item.'}
      </p>
    </div>
  );
}
```

### Step 3: `ReflectionQuestions.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/components/ReflectionQuestions.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';
import type { QuarterlyReview, ReflectionField } from '@/types/twelve-week-sync';

const QUESTIONS: { field: ReflectionField; label: string; placeholder: string }[] = [
  {
    field: 'challenges_faced',
    label: 'Kesulitan apa yang saya hadapi dalam proses 12 Minggu ini?',
    placeholder: 'Ceritakan tantangan, hambatan, atau hal yang tidak berjalan sesuai rencana...',
  },
  {
    field: 'advice_for_next',
    label: 'Nasihat dari saya untuk 12 Minggu ke depan',
    placeholder: 'Apa yang ingin kamu sampaikan ke dirimu sendiri untuk kuartal berikutnya?',
  },
  {
    field: 'reward',
    label: 'Reward Untuk Diri Saya',
    placeholder: 'Bagaimana cara merayakan pencapaian kuartal ini?',
  },
  {
    field: 'goals_needing_commitment',
    label: 'Goal mana yang memerlukan komitmen Anda kembali?',
    placeholder: 'Goal yang masih relevan tapi butuh fokus lebih...',
  },
  {
    field: 'goals_needing_revision',
    label: 'Goal mana yang perlu Anda revisi?',
    placeholder: 'Goal yang perlu diubah, dihapus, atau disesuaikan...',
  },
];

interface Props {
  review: QuarterlyReview;
  onUpdate: (field: ReflectionField, value: string) => void;
}

function ReflectionField({ question, initialValue, onUpdate }: {
  question: typeof QUESTIONS[0];
  initialValue: string;
  onUpdate: (field: ReflectionField, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue] = useDebounce(value, 1000);

  useEffect(() => {
    if (debouncedValue !== initialValue) {
      onUpdate(question.field, debouncedValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {question.label}
      </label>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={question.placeholder}
        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-xs text-gray-400 text-right">{value.length}/2000</p>
    </div>
  );
}

export default function ReflectionQuestions({ review, onUpdate }: Props) {
  return (
    <div className="space-y-6">
      {QUESTIONS.map(q => (
        <ReflectionField
          key={q.field}
          question={q}
          initialValue={review[q.field] ?? ''}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
```

### Step 4: `SyncActionChecklist.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/components/SyncActionChecklist.tsx
'use client';

import type { SyncAction } from '@/types/twelve-week-sync';

interface Props {
  syncActions: SyncAction[];
  onToggle: (id: string, isCompleted: boolean) => void;
}

export default function SyncActionChecklist({ syncActions, onToggle }: Props) {
  const completed = syncActions.filter(a => a.is_completed).length;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {completed}/{syncActions.length} completed
      </p>
      {syncActions.map(action => (
        <label
          key={action.id}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={action.is_completed}
            onChange={e => onToggle(action.id, e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
          />
          <span className={`text-sm ${
            action.is_completed
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {action.action_text}
          </span>
        </label>
      ))}
    </div>
  );
}
```

**Step 5: Check if `use-debounce` is installed**

```bash
cat package.json | grep use-debounce
```

If not found, note to install: `npm install use-debounce`

**Step 6: Run type-check**

```bash
npm run type-check
```

**Step 7: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/components/
git commit -m "feat(12-week-sync): add GoalReviewCard, AccomplishmentsList, ReflectionQuestions, SyncActionChecklist components (fixes #4)"
```

---

## Task 8: Main Client Component & Page

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/TwelveWeekSyncClient.tsx`
- Create: `src/app/(admin)/planning/12-week-sync/page.tsx`

### Step 1: `TwelveWeekSyncClient.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/TwelveWeekSyncClient.tsx
'use client';

import { useTwelveWeekSync } from './hooks/useTwelveWeekSync';
import GoalReviewCard from './components/GoalReviewCard';
import AccomplishmentsList from './components/AccomplishmentsList';
import ReflectionQuestions from './components/ReflectionQuestions';
import SyncActionChecklist from './components/SyncActionChecklist';
import { getQuarterDates, getQuarterString } from '@/lib/quarterUtils';
import { toast } from 'sonner';
import Link from 'next/link';

interface Props {
  year: number;
  quarter: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function TwelveWeekSyncClient({ year, quarter }: Props) {
  const {
    data,
    isLoading,
    handleUpdateReflection,
    handleUpsertGoalReview,
    handleAddAccomplishment,
    handleRemoveAccomplishment,
    handleToggleSyncAction,
    handleCompleteReview,
  } = useTwelveWeekSync(year, quarter);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-pulse p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { review, goalReviews, accomplishments, syncActions } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            12 Week Sync — {getQuarterString(year, quarter)}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(review.start_date)} – {formatDate(review.end_date)}
          </p>
          {review.is_completed && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
              ✓ Selesai
            </span>
          )}
        </div>
        <Link
          href="/planning/12-week-sync/history"
          className="text-sm text-blue-500 hover:underline"
        >
          Lihat History →
        </Link>
      </div>

      {/* Section 1: Goal Review */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          ✅ Review High Focus Goal
        </h2>
        {goalReviews.length === 0 ? (
          <p className="text-sm text-gray-500">
            Tidak ada High Focus Goal untuk kuartal ini.{' '}
            <Link href="/planning/12-week-quests" className="text-blue-500 hover:underline">
              Set goals →
            </Link>
          </p>
        ) : (
          goalReviews.map(gr => (
            <GoalReviewCard
              key={gr.id}
              goalReview={gr}
              onScoreChange={handleUpsertGoalReview}
            />
          ))
        )}
      </section>

      {/* Section 2: Accomplishments */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          🎯 Daftar Pencapaian 12 Minggu
        </h2>
        <AccomplishmentsList
          accomplishments={accomplishments}
          onAdd={handleAddAccomplishment}
          onRemove={handleRemoveAccomplishment}
        />
      </section>

      {/* Section 3: Reflection */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          💭 Reflection Questions
        </h2>
        <ReflectionQuestions
          review={review}
          onUpdate={handleUpdateReflection}
        />
      </section>

      {/* Section 4: Sync Actions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          ✅ Sync Action To-Do
        </h2>
        <SyncActionChecklist
          syncActions={syncActions}
          onToggle={handleToggleSyncAction}
        />
      </section>

      {/* Footer */}
      {!review.is_completed && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleCompleteReview}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            🎉 Complete Review — Tutup {getQuarterString(year, quarter)}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Step 2: `page.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/page.tsx
import { Suspense } from 'react';
import { parseQParam } from '@/lib/quarterUtils';
import TwelveWeekSyncClient from './TwelveWeekSyncClient';

export const metadata = {
  title: '12 Week Sync | Better Planner',
  description: 'Quarterly review untuk aplikasi Better Planner',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const { year, quarter } = parseQParam(params.q ?? null);

  return (
    <Suspense fallback={null}>
      <TwelveWeekSyncClient year={year} quarter={quarter} />
    </Suspense>
  );
}
```

**Step 3: Run type-check**

```bash
npm run type-check
```

**Step 4: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/TwelveWeekSyncClient.tsx src/app/\(admin\)/planning/12-week-sync/page.tsx
git commit -m "feat(12-week-sync): add main page and TwelveWeekSyncClient (fixes #4)"
```

---

## Task 9: History Page

**Files:**
- Create: `src/app/(admin)/planning/12-week-sync/history/page.tsx`

```tsx
// src/app/(admin)/planning/12-week-sync/history/page.tsx
import { getQuarterlyReviewHistory } from '../actions/quarterly-review/actions';
import { getQuarterString } from '@/lib/quarterUtils';
import Link from 'next/link';

export const metadata = {
  title: '12 Week Sync History | Better Planner',
};

function groupByYear(reviews: any[]) {
  return reviews.reduce((acc, r) => {
    const y = r.year;
    if (!acc[y]) acc[y] = [];
    acc[y].push(r);
    return acc;
  }, {} as Record<number, any[]>);
}

export default async function HistoryPage() {
  const result = await getQuarterlyReviewHistory();
  const reviews = result.data ?? [];
  const grouped = groupByYear(reviews);
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          12 Week Sync — History
        </h1>
        <Link href="/planning/12-week-sync" className="text-sm text-blue-500 hover:underline">
          ← Current Quarter
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">
          Belum ada review yang selesai.{' '}
          <Link href="/planning/12-week-sync" className="text-blue-500 hover:underline">
            Mulai review sekarang →
          </Link>
        </p>
      ) : (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {year}
              </h2>
              <div className="space-y-2">
                {grouped[year].map((r: any) => (
                  <Link
                    key={r.id}
                    href={`/planning/12-week-sync?q=${r.year}-Q${r.quarter}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getQuarterString(r.year, r.quarter)}
                      </p>
                      {r.completed_at && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Selesai {new Date(r.completed_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      r.is_completed
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    }`}>
                      {r.is_completed ? '✓ Selesai' : 'Draft'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Run type-check**

```bash
npm run type-check
```

**Step 3: Commit**

```bash
git add src/app/\(admin\)/planning/12-week-sync/history/
git commit -m "feat(12-week-sync): add history page (fixes #4)"
```

---

## Task 10: Navigation — Add to Sidebar

**Files:**
- Modify: `src/components/layouts/AppSidebar.tsx`

**Step 1: Add to `planningNav` array**

Find the `planningNav` array (after `EyeIcon` / Vision entry). Add after Best Week:

```typescript
{
  icon: <CheckCircleIcon />,
  name: '12 Week Sync',
  path: '/planning/12-week-sync',
},
```

`CheckCircleIcon` is already imported in the file.

**Step 2: Add to prefetch list**

In the `useEffect` that prefetches routes, `planningNav` is already included via `[...executionNav, ...planningNav, ...questsNav]`, so no change needed.

**Step 3: Run type-check**

```bash
npm run type-check
```

**Step 4: Run dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:3000/planning/12-week-sync` — verify:
- Sidebar shows "12 Week Sync" under Planning
- Page loads with current quarter header
- High Focus Goals pre-populated (if any `is_committed=true` quests exist)
- Can rate goals 1-10
- Can add/remove accomplishments with Enter key
- Reflection text areas auto-save after 1s
- Sync actions checkboxes toggle
- "Complete Review" button marks review as done
- History page at `/planning/12-week-sync/history` shows completed quarters

**Step 5: Commit**

```bash
git add src/components/layouts/AppSidebar.tsx
git commit -m "feat(12-week-sync): add 12 Week Sync nav item to planningNav (fixes #4)"
```

---

## Task 11: Final Verification & PR

**Step 1: Run all tests**

```bash
npx vitest run src/app/\(admin\)/planning/12-week-sync/
```
Expected: all PASS

**Step 2: Run type-check**

```bash
npm run type-check
```
Expected: no errors

**Step 3: Run build**

```bash
npm run build
```
Expected: build succeeds

**Step 4: Close beads issue**

```bash
bd close bp-a63
bd sync
```

**Step 5: Git push & PR**

```bash
git push origin feature/gh-4-12-week-sync
gh pr create \
  --title "feat: implement 12 Week Sync quarterly review (Phase 1 MVP)" \
  --body "## Summary
- Add 4 new Supabase tables: \`quarterly_reviews\`, \`goal_reviews\`, \`accomplishments\`, \`sync_actions\` with RLS
- 3-layer server actions for all domains (queries/logic/actions)
- SWR hook with optimistic updates
- GoalReviewCard (1-10 score buttons with color coding), AccomplishmentsList, ReflectionQuestions (auto-save debounce), SyncActionChecklist
- Main page at \`/planning/12-week-sync\` with \`?q=YYYY-QN\` param
- History page at \`/planning/12-week-sync/history\`
- Nav item under Planning section

## Test plan
- [ ] DB tables exist and RLS works
- [ ] All Vitest unit tests pass
- [ ] \`npm run type-check\` clean
- [ ] \`npm run build\` succeeds
- [ ] HFG pre-populated on first visit
- [ ] Rating 1-10 saves correctly
- [ ] Accomplishments add/remove work
- [ ] Reflection auto-saves after 1s
- [ ] Sync actions toggle
- [ ] Complete Review marks quarter done
- [ ] History page lists completed quarters

Closes #4

🤖 Generated with [Claude Code](https://claude.ai/claude-code)" \
  --base master
```
