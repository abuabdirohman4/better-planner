'use client';
import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@/lib/icons';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { useTimeAnalysis } from './hooks/useTimeAnalysis';
import { DailyPlan } from '../DailyQuest/types';

interface DailyStatsProps {
  selectedDate: string;
  dailyPlan: DailyPlan | null;
}

export default function DailyStats({ selectedDate, dailyPlan }: DailyStatsProps) {
  const { focusTime, breakTime, sessionCount, isLoading } = useTimeAnalysis(selectedDate);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate Quest Stats
  const items = dailyPlan?.daily_plan_items || [];

  const calculateStats = (type: string) => {
    const typeItems = items.filter(i => i.item_type === type);
    const total = typeItems.length;
    const completed = typeItems.filter(i => i.status === 'DONE').length;
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const mainStats = calculateStats('MAIN_QUEST');
  const workStats = calculateStats('WORK_QUEST');
  const sideStats = calculateStats('SIDE_QUEST');

  const allItems = items.filter(i => ['MAIN_QUEST', 'WORK_QUEST', 'SIDE_QUEST'].includes(i.item_type));
  const totalItems = allItems.length;
  const totalCompleted = allItems.filter(i => i.status === 'DONE').length;
  const completionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  // Visual & Color Logic
  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return 'text-green-500 dark:text-green-400';
    if (pct >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getMotivationalText = () => {
    // 3. Motivational Messaging
    if (workStats.percentage > 100) return `🔥 Personal best! ${workStats.percentage}% of work quest!`;
    if (completionRate >= 80) return `✅ Great job! ${completionRate}% done!`;

    const to80 = Math.ceil(totalItems * 0.8) - totalCompleted;
    if (to80 > 0 && to80 <= 2) return `⚡ Almost there! ${to80} more quests to hit 80%`;

    if (completionRate >= 50) return `🎯 Good progress! ${completionRate}% completed.`;

    // 0-49%
    const remaining = totalItems - totalCompleted;
    if (remaining === 0 && totalItems === 0) return `⚪ Ready to start the day?`;
    if (remaining > 0) return `🔴 Below target, focus up!`;

    return `⚪ Neutral`;
  };

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <CollapsibleCard
      isCollapsed={isCollapsed}
      onToggle={() => setIsCollapsed(!isCollapsed)}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700 relative">
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">📊 Daily Stats</h3>

        <div className="flex flex-col gap-5">
          {/* Most Important: Completion Rate & Focus Time */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-gray-100 dark:border-gray-700 pb-4 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Completion Rate</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold ${getCompletionColor(completionRate)}`}>
                  {completionRate}%
                </span>
                <span className="text-lg text-gray-400 font-medium">({totalCompleted}/{totalItems})</span>
              </div>
              <span className="text-sm mt-1 text-gray-600 dark:text-gray-300 font-medium">
                {getMotivationalText()}
              </span>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Focus</span>
              <span className="text-3xl font-bold text-gray-800 dark:text-white">{formatTime(focusTime)}</span>
              <span className="text-xs text-gray-400 mt-1">
                Break: {formatTime(breakTime)}
              </span>
            </div>
          </div>

          {/* Secondary: Session Stats */}
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
            <div className="flex gap-6">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span>Sessions:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{sessionCount}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <span>Avg Duration:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{sessionCount > 0 ? Math.round(focusTime / sessionCount) : 0}m</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown (Collapsible) */}
          <div>
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none"
            >
              {detailsOpen ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
              <span className="ml-1 uppercase tracking-wide">Detailed Breakdown</span>
            </button>

            {detailsOpen && (
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-brand-500/20 dark:border-brand-400/20 animate-in slide-in-from-top-2 duration-200">
                {/* Main Quest */}
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    ⚔️ Main Quest {mainStats.percentage === 100 && <span className="text-green-500">✓</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${mainStats.percentage}%` }}></div>
                    </div>
                    <span className="font-mono text-gray-600 dark:text-gray-400 w-16 text-right">
                      {mainStats.completed}/{mainStats.total}
                    </span>
                  </div>
                </div>

                {/* Work Quest */}
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    💼 Work Quest {workStats.percentage > 100 && <span className="text-orange-500">🔥</span>}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${workStats.percentage > 100 ? 'bg-orange-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(workStats.percentage, 100)}%` }}></div>
                    </div>
                    <span className="font-mono text-gray-600 dark:text-gray-400 w-16 text-right">
                      {workStats.completed}/{workStats.total}
                    </span>
                  </div>
                </div>

                {/* Side Quest */}
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    📜 Side Quest
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sideStats.percentage}%` }}></div>
                    </div>
                    <span className="font-mono text-gray-600 dark:text-gray-400 w-16 text-right">
                      {sideStats.completed}/{sideStats.total}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
