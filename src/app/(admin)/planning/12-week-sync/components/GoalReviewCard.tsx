'use client';

import { useState, useEffect } from 'react';
import type { GoalReview } from '@/types/twelve-week-sync';
import { getQuestProgress } from '../actions';

interface Props {
  goalReview: GoalReview;
  onScoreChange: (goalReviewId: string, score: number, notes: string | null) => void;
}

export default function GoalReviewCard({ goalReview, onScoreChange }: Props) {
  const [suggestedScore, setSuggestedScore] = useState<number | null>(null);
  const [overallProgress, setOverallProgress] = useState<number | null>(null);
  const score = goalReview.progress_score;

  useEffect(() => {
    async function fetchProgress() {
      if (!goalReview.quest_id) return;
      const result = await getQuestProgress(goalReview.quest_id);
      if (result.success && result.data !== undefined) {
        const progress = result.data.overallProgress;
        if (progress > 0) {
          const suggested = Math.max(1, Math.min(10, Math.round(progress / 10)));
          setOverallProgress(progress);
          setSuggestedScore(suggested);
          // Auto-fill hanya jika score belum diisi
          if (score === null) {
            onScoreChange(goalReview.id, suggested, goalReview.achievement_notes);
          }
        }
      }
    }
    fetchProgress();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalReview.quest_id, goalReview.id]);

  const isCompleted = score !== null && score >= 7;

  return (
    <tr className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
      {/* Col 1: STATUS */}
      <td className="py-4 pl-1">
        {isCompleted ? (
          <div className="w-5 h-5 flex items-center justify-center bg-emerald-500 rounded-full">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-700" />
        )}
      </td>

      {/* Col 2: HIGH FOCUS GOAL */}
      <td className="py-4">
        <span className={`font-medium transition-all duration-300 ${
          isCompleted 
            ? 'text-gray-400 line-through' 
            : 'text-gray-900 dark:text-white'
        }`}>
          {goalReview.goal_name}
        </span>
      </td>

      {/* Col 3: PROGRESS 0-10 */}
      <td className="py-4 text-right">
        <div className="flex flex-col items-end gap-1">
          <input
            type="number"
            min={1}
            max={10}
            value={score ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value);
              if (val === null) return;
              if (val >= 1 && val <= 10) {
                onScoreChange(goalReview.id, val, goalReview.achievement_notes);
              }
            }}
            placeholder="–"
            className="w-16 h-9 text-center text-sm font-bold border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all dark:text-white"
          />
          {suggestedScore !== null && score === null && (
            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
              💡 {suggestedScore}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}
