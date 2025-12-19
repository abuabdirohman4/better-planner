'use client';
import React, { useState } from 'react';
import CollapsibleCard from '@/components/common/CollapsibleCard';
import { DailyPlan } from '../DailyQuest/types';

interface DailyStatsProps {
  dailyPlan: DailyPlan | null;
  completedSessions: Record<string, number>;
}

export default function DailyStats({ dailyPlan, completedSessions }: DailyStatsProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Calculate Quest Stats
  const items = dailyPlan?.daily_plan_items || [];

  const calculateStats = (type: string) => {
    const typeItems = items.filter(i => i.item_type === type);
    const total = typeItems.length;
    const completed = typeItems.filter(i => i.status === 'DONE').length;

    // Calculate sessions
    const targetSession = typeItems.reduce((sum, item) => sum + (item.daily_session_target || 0), 0);
    const actualSession = typeItems.reduce((sum, item) => sum + (completedSessions[item.id] || 0), 0);

    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      targetSession,
      actualSession
    };
  };

  const mainStats = calculateStats('MAIN_QUEST');
  const workStats = calculateStats('WORK_QUEST');
  const sideStats = calculateStats('SIDE_QUEST');
  const dailyStats = calculateStats('DAILY_QUEST');

  const questStats = [
    {
      type: 'MAIN_QUEST',
      label: 'Main Quest',
      icon: '⚔️',
      stats: mainStats,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      barColor: 'bg-green-500'
    },
    {
      type: 'WORK_QUEST',
      label: 'Work Quest',
      icon: '💼',
      stats: workStats,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      barColor: workStats.percentage > 100 ? 'bg-orange-500' : 'bg-blue-500'
    },
    {
      type: 'DAILY_QUEST',
      label: 'Daily Quest',
      icon: '⚡',
      stats: dailyStats,
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      barColor: 'bg-indigo-500'
    },
    {
      type: 'SIDE_QUEST',
      label: 'Side Quest',
      icon: '📜',
      stats: sideStats,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      barColor: 'bg-yellow-500'
    }
  ];

  return (
    <CollapsibleCard
      isCollapsed={isCollapsed}
      onToggle={() => setIsCollapsed(!isCollapsed)}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 pt-5 shadow-sm border border-gray-200 dark:border-gray-700 relative">
        <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Quests Stats</h3>

        <div className="flex flex-col gap-5">

          {/* Detailed Breakdown */}
          <div className="space-y-3">
            {/* Config Loop */}
            {questStats.map((quest) => (
              <div key={quest.type} className={`p-3 rounded-lg ${quest.bgColor} space-y-2`}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span>{quest.icon}</span>
                    {quest.label}
                    {quest.stats.percentage >= 100 && <span className="text-green-500">✓</span>}
                    {quest.stats.percentage > 100 && quest.type === 'WORK_QUEST' && <span className="text-orange-500">🔥</span>}
                  </span>
                </div>

                {/* Sessions Progress */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Sessions</span>
                    <span>
                      {quest.stats.actualSession}/{quest.stats.targetSession}{' '}
                      {quest.stats.targetSession > 0
                        ? `(${(quest.stats.actualSession / quest.stats.targetSession * 100).toFixed(0)}%)`
                        : '(0%)'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden border border-gray-100 dark:border-gray-600">
                    <div
                      className={`h-full rounded-full ${quest.barColor}`}
                      style={{ width: `${quest.stats.targetSession > 0 ? Math.min((quest.stats.actualSession / quest.stats.targetSession) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tasks Progress */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Tasks</span>
                    <span>
                      {quest.stats.completed}/{quest.stats.total}{' '}
                      {quest.stats.total > 0
                        ? `(${quest.stats.percentage.toFixed(0)}%)`
                        : '(0%)'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden border border-gray-100 dark:border-gray-600">
                    <div
                      className={`h-full rounded-full ${quest.barColor} opacity-70`}
                      style={{ width: `${quest.stats.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
}
