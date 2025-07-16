'use client';

import QuarterUsageExample from "@/components/examples/QuarterUsageExample";
import Spinner from '@/components/ui/spinner/Spinner';
import { useTodayTasks, useActiveQuests, useHabitsStreak, useWeeklyProgress } from '@/hooks/dashboard/useDashboard';

interface DashboardClientProps {
  userEmail?: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const { todayTasks, isLoading: todayTasksLoading } = useTodayTasks();
  const { activeQuests, isLoading: activeQuestsLoading } = useActiveQuests();
  const { habitsStreak, isLoading: habitsStreakLoading } = useHabitsStreak();
  const { weeklyProgress, isLoading: weeklyProgressLoading } = useWeeklyProgress();

  const isLoading = todayTasksLoading || activeQuestsLoading || habitsStreakLoading || weeklyProgressLoading;

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
              Better Planner Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {userEmail}
            </p>
          </div>
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

      <div className="col-span-12">
        <QuarterUsageExample/>
      </div>
    </div>
  );
} 