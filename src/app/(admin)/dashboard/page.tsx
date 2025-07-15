import type { Metadata } from "next";

import { signOut } from '@/app/(full-width-pages)/(auth)/actions'
import QuarterUsageExample from "@/components/examples/QuarterUsageExample";
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: "Dashboard | Better Planner",
  description: "Dashboard untuk aplikasi Better Planner",
};

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Better Planner Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.email}
          </p>
          </div>
          
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-4 py-2 text-sm bg-red-500 text-white shadow-theme-xs hover:bg-red-600"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Today&apos;s Tasks
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            0
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Quests
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            0
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Habits Streak
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            0
          </p>
        </div>
      </div>

      <div className="col-span-12 xl:col-span-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Progress
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            0%
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
