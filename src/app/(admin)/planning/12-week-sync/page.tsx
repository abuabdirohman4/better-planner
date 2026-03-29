import { Suspense } from 'react';
import { parseQParam } from '@/lib/quarterUtils';
import TwelveWeekSyncClient from './TwelveWeekSyncClient';

export const metadata = {
  title: '12 Week Sync | Better Planner',
  description: 'Quarterly review untuk aplikasi Better Planner',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const { year, quarter } = parseQParam(params.q ?? null);

  return (
    <Suspense fallback={null}>
      <TwelveWeekSyncClient year={year} quarter={quarter} />
    </Suspense>
  );
}
