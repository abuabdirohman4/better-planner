import type { Metadata } from "next";
import Link from 'next/link';
import { Suspense } from 'react';

import { createClient } from '@/lib/supabase/server'
import { EyeIcon, TaskIcon, PieChartIcon, CalenderIcon } from '@/lib/icons';
import DashboardSkeleton from '@/components/ui/skeleton/DashboardSkeleton';
import QuarterSelector from '@/components/common/QuarterSelector';
import WeeklyProgressChartWrapper from './components/WeeklyProgressChartWrapper';

export const metadata: Metadata = {
  title: "Dashboard | Better Planner",
  description: "Dashboard untuk aplikasi Better Planner",
};

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <QuarterSelector />
        </div>

        <div className="col-span-12 mt-4">
          <WeeklyProgressChartWrapper />
        </div>

        <div className="col-span-12">
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
            {/* Vision Card */}
            <Link 
              href="/planning/vision"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#F4EBFF] group-hover:bg-[#e0d5fe] transition-colors md:mr-4">
                <EyeIcon className="w-6 h-6 text-[#7F56D9] ps-0.5 pt-0.5" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Vision</h3>
                <p className="text-xs text-gray-500 hidden md:block">Lihat visi utama</p>
              </div>
            </Link>
            {/* 12 Week Quests Card */}
            <Link 
              href="/planning/12-week-quests"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#EFF8FF] group-hover:bg-[#d3eafe] transition-colors md:mr-4">
                <TaskIcon className="w-6 h-6 text-[#2E90FA]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">12 Week Quests</h3>
                <p className="text-xs text-gray-500 hidden md:block">Rencana 12 minggu</p>
              </div>
            </Link>
            {/* Main Quests Card */}
            <Link 
              href="/planning/main-quests"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#FFEFE3] group-hover:bg-[#ffd9bd] transition-colors md:mr-4">
                <PieChartIcon className="w-6 h-6 text-[#F79009]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Main Quests</h3>
                <p className="text-xs text-gray-500 hidden md:block">Target utama</p>
              </div>
            </Link>
            {/* Weekly Sync Card */}
            <Link 
              href="/execution/weekly-sync"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#FFF6ED] group-hover:bg-[#ffebd3] transition-colors md:mr-4">
                <CalenderIcon className="w-6 h-6 text-[#FDB022]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Weekly Sync</h3>
                <p className="text-xs text-gray-500 hidden md:block">Review mingguan</p>
              </div>
            </Link>
            {/* Daily Sync Card */}
            <Link 
              href="/execution/daily-sync"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#FEF3F2] group-hover:bg-[#ffd7d6] transition-colors md:mr-4">
                <TaskIcon className="w-6 h-6 text-[#F04438]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Daily Sync</h3>
                <p className="text-xs text-gray-500 hidden md:block">Rutinitas harian</p>
              </div>
            </Link>
            {/* Work Quests Card */}
            <Link 
              href="/quests/work-quests"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#E6F5EA] group-hover:bg-[#b7ebcd] transition-colors md:mr-4">
                <TaskIcon className="w-6 h-6 text-[#13B176]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Work Quests</h3>
                <p className="text-xs text-gray-500 hidden md:block">Tugas pekerjaan</p>
              </div>
            </Link>
            {/* Side Quests Card */}
            <Link 
              href="/quests/side-quests"
              className="group flex flex-col md:flex-row items-center gap-4 gap-md-0 bg-white dark:bg-gray-50 rounded-xl border border-gray-200 shadow-none p-5 hover:shadow transition-colors duration-150"
            >
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#FDF2FA] group-hover:bg-[#eed4ec] transition-colors md:mr-4">
                <TaskIcon className="w-6 h-6 text-[#E31B54]" />
              </div>
              <div>
                <h3 className="text-base text-center md:text-left font-semibold text-gray-900 mb-1">Side Quests</h3>
                <p className="text-xs text-gray-500 hidden md:block">Tugas sampingan</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
  );
}
