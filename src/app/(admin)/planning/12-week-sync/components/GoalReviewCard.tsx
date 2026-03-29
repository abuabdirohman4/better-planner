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
