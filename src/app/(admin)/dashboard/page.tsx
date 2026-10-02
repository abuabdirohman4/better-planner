import type { Metadata } from "next";
import { Suspense } from 'react';

import DashboardSkeleton from '@/components/ui/skeleton/DashboardSkeleton';
import WeeklyProgressChartWrapper from './components/WeeklyProgressChartWrapper';
import DashboardHome from './components/DashboardHome';
import { getDashboardHome } from './actions/home/actions';

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
  const home = await getDashboardHome();

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
        {home && (
          <div className="col-span-12">
            <DashboardHome data={home} />
          </div>
        )}

        <div className="col-span-12">
          <WeeklyProgressChartWrapper />
        </div>
      </div>
  );
}
