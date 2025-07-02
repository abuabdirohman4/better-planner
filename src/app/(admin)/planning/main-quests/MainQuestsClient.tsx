"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import QuestDetailCard from './QuestDetailCard';
import ComponentCard from '@/components/common/ComponentCard';
import { Suspense } from 'react';

function parseQParam(q: string | null): { year: number; quarter: number } {
  if (!q) {
    const now = new Date();
    const week = getWeekOfYear(now);
    let quarter = 1;
    if (week >= 1 && week <= 13) quarter = 1;
    else if (week >= 14 && week <= 26) quarter = 2;
    else if (week >= 27 && week <= 39) quarter = 3;
    else quarter = 4;
    return { year: now.getFullYear(), quarter };
  }
  const match = q.match(/(\d{4})-Q([1-4])/);
  if (match) {
    return { year: parseInt(match[1]), quarter: parseInt(match[2]) };
  }
  // fallback
  const now = new Date();
  const week = getWeekOfYear(now);
  let quarter = 1;
  if (week >= 1 && week <= 13) quarter = 1;
  else if (week >= 14 && week <= 26) quarter = 2;
  else if (week >= 27 && week <= 39) quarter = 3;
  else quarter = 4;
  return { year: now.getFullYear(), quarter };
}

function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

export default function MainQuestsClient() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q');
  const { year, quarter } = parseQParam(qParam);
  const [quests, setQuests] = useState<{ id: string; title: string; motivation?: string }[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quests?year=${year}&quarter=${quarter}`)
      .then(res => res.json())
      .then(data => {
        setQuests(data.quests || []);
        setLoading(false);
      })
      .catch(() => {
        setQuests([]);
        setLoading(false);
      });
  }, [year, quarter]);

  return (
    <div className="max-w-5xl mx-auto py-8 px-2 md:px-0">
      <h1 className="text-2xl text-center font-bold mb-6">Main Quests</h1>
      {loading ? (
        <ComponentCard title="Loading..." className="mb-4">
          <p className="text-gray-600">Memuat data Main Quest...</p>
        </ComponentCard>
      ) : (!quests || quests.length === 0) ? (
        <ComponentCard title="Belum ada Main Quest" className="mb-4">
          <p className="text-gray-600">Belum ada Main Quest yang di-commit untuk kuartal ini.</p>
        </ComponentCard>
      ) : (
        <div className="space-y-6">
          {quests.map((quest) => (
            <Suspense key={quest.id} fallback={<div>Loading...</div>}>
              <QuestDetailCard quest={quest} />
            </Suspense>
          ))}
        </div>
      )}
    </div>
  );
} 