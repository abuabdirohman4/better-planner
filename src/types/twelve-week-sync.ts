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
