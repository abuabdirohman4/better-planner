"use client";
import { useEffect, useState } from "react";
import QuestWorkspace from './QuestWorkspace';
import ComponentCard from '@/components/common/ComponentCard';

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
  const [quests, setQuests] = useState<{ id: string; title: string; motivation?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const qParam = searchParams ? searchParams.get('q') : null;
  const { year, quarter } = parseQParam(qParam);

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

  if (loading) {
    return (
      <ComponentCard title="Loading..." className="mb-4">
        <p className="text-gray-600">Memuat data Main Quest...</p>
      </ComponentCard>
    );
  }

  if (!quests || quests.length === 0) {
    return (
      <ComponentCard title="Belum ada Main Quest" className="mb-4">
        <p className="text-gray-600">Belum ada Main Quest yang di-commit untuk kuartal ini.</p>
      </ComponentCard>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 md:px-0">
      {/* <h1 className="text-2xl text-center font-bold mb-6">Main Quest 🎯</h1> */}
      <div className="mb-6">
        <div className="flex justify-evenly border-b border-gray-200 dark:border-gray-700 mx-36">
          {quests.map((quest, idx) => (
            <button
              key={quest.id}
              className={`px-4 py-2 -mb-px font-medium border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === idx ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab(idx)}
            >
              HIGH FOCUS QUEST #{idx + 1}
            </button>
          ))}
        </div>
        <div className="mt-6">
          {quests.map((quest, idx) => (
            <div key={quest.id} style={{ display: activeTab === idx ? 'block' : 'none' }}>
              <QuestWorkspace quest={quest} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 