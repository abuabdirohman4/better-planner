'use client';

import { useTwelveWeekSync } from './hooks/useTwelveWeekSync';
import GoalReviewCard from '../components/GoalReviewCard';
import AccomplishmentsList from '../components/AccomplishmentsList';
import ReflectionQuestions from '../components/ReflectionQuestions';
import SyncActionChecklist from '../components/SyncActionChecklist';
import { getQuarterString } from '@/lib/quarterUtils';
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
