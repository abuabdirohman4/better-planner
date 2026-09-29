"use client";

import Link from 'next/link';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { useHfgWeekly } from '../hooks/useHfgWeekly';
import type { HfgStatus } from '../actions/hfg-weekly/logic';

const STATUS: Record<HfgStatus, { label: string; text: string; bar: string }> = {
  ON_TRACK: { label: '● ON TRACK', text: 'text-green-600 dark:text-green-400', bar: 'bg-green-500' },
  AT_RISK: { label: '▲ AT RISK', text: 'text-red-600 dark:text-red-400', bar: 'bg-red-500' },
  NO_TARGET: { label: 'Belum ada jatah', text: 'text-gray-500 dark:text-gray-400', bar: 'bg-gray-300 dark:bg-gray-600' },
  REST_WEEK: { label: 'Minggu istirahat', text: 'text-gray-500 dark:text-gray-400', bar: 'bg-gray-300 dark:bg-gray-600' },
};

export default function HfgWeeklyStatus() {
  const { data, isLoading, error } = useHfgWeekly();

  if (isLoading && !data) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (error || !data || data.cards.length === 0) return null;

  return (
    <section data-testid="dashboard-hfg-weekly" className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Jam HFG minggu ini</h2>
        <span className="text-xs text-gray-500">{data.weekLabel}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.cards.map((c) => {
          const s = STATUS[c.status];
          return (
            <div key={c.questId} data-testid="dashboard-hfg-card" className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={c.title}>{c.title}</p>
              <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                {c.actualLabel}
                {c.targetLabel && <span className="text-sm font-normal text-gray-500"> / {c.targetLabel}</span>}
              </p>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`h-2 rounded-full ${s.bar}`} style={{ width: `${c.percent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={`font-semibold ${s.text}`}>{s.label}</span>
                {c.remainingLabel ? (
                  <span className="text-gray-500">{c.remainingLabel}</span>
                ) : c.status === 'REST_WEEK' ? null : (
                  <Link href="/planning/main-quests" className="text-brand-500 hover:underline">Atur jatah</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
