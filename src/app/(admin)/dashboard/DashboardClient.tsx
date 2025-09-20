'use client';

import Spinner from '@/components/ui/spinner/Spinner';
import { useDashboardMetrics } from '@/hooks/dashboard/useDashboard';
import Link from 'next/link';
import { EyeIcon, TaskIcon, PieChartIcon } from '@/icons/index';

interface DashboardClientProps {
  userEmail?: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  // ✅ SINGLE HOOK - Much faster than 4 separate hooks!
  const { todayTasks, activeQuests, habitsStreak, weeklyProgress, isLoading } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size={64} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {userEmail}
            </p>
          </div>
        </div>
      </div>

      <div className="col-span-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Getting Started
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to Better Planner! This is where you&apos;ll manage your goals, tasks, and habits. 
            The dashboard will show your daily progress and important metrics once you start using the app.
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today&apos;s Tasks
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {todayTasks}
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Quests
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {activeQuests}
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Habits Streak
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {habitsStreak}
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Progress
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {weeklyProgress}%
          </p>
        </div>
      </div>

      {/* Mobile Cards - Only visible on mobile */}
      <div className="col-span-12 md:hidden">
        <div className="grid grid-cols-3 gap-4 mt-4">
          {/* Vision Card */}
          <Link 
            href="/planning/vision"
            className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-100 to-purple-100 rounded-full flex items-center justify-center mb-3">
                <EyeIcon />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Vision</h3>
            </div>
          </Link>

          {/* 12 Week Quests Card */}
          <Link 
            href="/planning/12-week-quests"
            className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-3">
                <TaskIcon />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">12 Week Quests</h3>
            </div>
          </Link>

          {/* Main Quests Card */}
          <Link 
            href="/planning/main-quests"
            className="block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 hover:shadow-xl transition-all"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-3">
                <PieChartIcon />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Main Quests</h3>
            </div>
          </Link>
        </div>
      </div>

    </div>
  );
} 