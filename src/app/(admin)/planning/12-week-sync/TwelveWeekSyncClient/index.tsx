'use client';

import { useTwelveWeekSync } from './hooks/useTwelveWeekSync';
import GoalReviewCard from '../components/GoalReviewCard';
import AccomplishmentsList from '../components/AccomplishmentsList';
import ReflectionQuestions from '../components/ReflectionQuestions';
import SyncActionChecklist from '../components/SyncActionChecklist';
import { getQuarterString } from '@/lib/quarterUtils';
import Link from 'next/link';
import {
  TaskIcon,
  ShootingStarIcon,
  AlertIcon,
  InfoIcon,
  BoltIcon,
  PencilIcon,
  CheckCircleIcon,
} from '@/lib/icons';

interface Props {
  year: number;
  quarter: number;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

function SectionCard({ title, icon, badge, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold">
          <span className="text-blue-500">{icon}</span>
          <span>{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
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
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-100 dark:bg-gray-800 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { review, goalReviews, accomplishments, syncActions } = data;

  return (
    <div className="mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 px-6 py-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            12 Week Sync — <span className="text-blue-500">{getQuarterString(year, quarter)}</span>
            <span className="mx-2 text-gray-300 dark:text-gray-700">•</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {formatDate(review.start_date)} – {formatDate(review.end_date)}
            </span>
          </h1>
        </div>
        <Link
          href="/planning/12-week-sync/history"
          className="flex items-center gap-1 text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors"
        >
          History <span className="text-lg">→</span>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Goal Review Table */}
          <SectionCard title="Review High Focus Goal" icon={<TaskIcon />}>
            {goalReviews.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 italic text-center">
                Tidak ada High Focus Goal. {' '}
                <Link href="/planning/12-week-quests" className="text-blue-500 hover:underline">
                  Set goals
                </Link>
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm mt-1">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700/50">
                      <th className="pb-2 text-left font-semibold w-10">Status</th>
                      <th className="pb-2 text-left font-semibold">High Focus Goal</th>
                      <th className="pb-2 text-right font-semibold w-28">Progress (0-10)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {goalReviews.map(gr => (
                      <GoalReviewCard
                        key={gr.id}
                        goalReview={gr}
                        onScoreChange={handleUpsertGoalReview}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Accomplishments */}
          <SectionCard
            title="Daftar Pencapaian 12 Minggu"
            icon={<ShootingStarIcon />}
            badge={`${accomplishments.length} Hal`}
          >
            <AccomplishmentsList
              accomplishments={accomplishments}
              onAdd={handleAddAccomplishment}
              onRemove={handleRemoveAccomplishment}
            />
          </SectionCard>

          {/* Challenges Reflection */}
          <SectionCard title="Apakah Saya Kesulitan Mencapai Goal?" icon={<AlertIcon />}>
            <ReflectionQuestions
              field="challenges_faced"
              label="Kesulitan"
              value={review.challenges_faced}
              onUpdate={handleUpdateReflection}
            />
          </SectionCard>

          {/* Advice Reflection */}
          <SectionCard title="Nasihat dari Saya untuk 12 Minggu ke Depan" icon={<InfoIcon />}>
            <ReflectionQuestions
              field="advice_for_next"
              label="Nasihat"
              value={review.advice_for_next}
              onUpdate={handleUpdateReflection}
            />
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Reward Reflection */}
          <SectionCard title="Reward Untuk Diri Saya" icon={<BoltIcon />}>
            <ReflectionQuestions
              field="reward"
              label="Reward"
              value={review.reward}
              onUpdate={handleUpdateReflection}
            />
          </SectionCard>

          {/* Goal Commitment & Revision Mini Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SectionCard title="Butuh komitmen?" icon={<PencilIcon />} className="p-4">
              <ReflectionQuestions
                field="goals_needing_commitment"
                label="Komitmen"
                value={review.goals_needing_commitment}
                onUpdate={handleUpdateReflection}
              />
            </SectionCard>
            <SectionCard title="Perlu direvisi?" icon={<PencilIcon />} className="p-4">
              <ReflectionQuestions
                field="goals_needing_revision"
                label="Revisi"
                value={review.goals_needing_revision}
                onUpdate={handleUpdateReflection}
              />
            </SectionCard>
          </div>

          {/* Sync Action To-Do */}
          <SectionCard title="Sync Action To-Do" icon={<CheckCircleIcon />}>
            <SyncActionChecklist
              syncActions={syncActions}
              onToggle={handleToggleSyncAction}
            />
          </SectionCard>
        </div>
      </div>

      {/* Footer */}
      {!review.is_completed ? (
        <div className="pt-4">
          <button
            onClick={handleCompleteReview}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95"
          >
            🎉 Complete Review — Tutup {getQuarterString(year, quarter)}
          </button>
        </div>
      ) : (
        <div className="pt-4 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <span>✓ Review Selesai</span>
              <span className="text-gray-400 text-xs font-normal">•</span>
              <span className="text-xs font-normal">Disimpan pada {formatDate(review.completed_at || review.updated_at)}</span>
            </div>
        </div>
      )}
    </div>
  );
}
