import type { Metadata } from "next";
import { Suspense } from 'react';

import DashboardSkeleton from '@/components/ui/skeleton/DashboardSkeleton';
import WeeklyProgressChartWrapper from './components/WeeklyProgressChartWrapper';
import DashboardHome from './components/DashboardHome';
import { getDashboardHome } from './actions/home/actions';
import { parseQParam } from '@/lib/quarterUtils';

export const metadata: Metadata = {
  title: "Dashboard | Better Planner",
  description: "Dashboard untuk aplikasi Better Planner",
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Dashboard({ searchParams }: Props) {
  const { q } = await searchParams;
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent viewed={parseQParam(q ?? null)} />
    </Suspense>
  );
}

async function DashboardContent({ viewed }: { viewed: { year: number; quarter: number } }) {
  const home = await getDashboardHome(viewed);

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
