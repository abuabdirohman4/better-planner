import { Suspense } from 'react';
import { parseQParam } from '@/lib/quarterUtils';
import BrainDumpPageClient from './BrainDumpPageClient';

export const metadata = {
  title: 'Brain Dump | Better Planner',
  description: 'Review semua brain dump Anda per minggu',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BrainDumpPage({ searchParams }: Props) {
  const params = await searchParams;
  const { year, quarter } = parseQParam(params.q ?? null);

  return (
    <Suspense fallback={null}>
      <BrainDumpPageClient year={year} quarter={quarter} />
    </Suspense>
  );
}
