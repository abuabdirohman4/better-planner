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
