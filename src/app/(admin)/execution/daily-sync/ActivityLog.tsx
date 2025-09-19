'use client';
import React, { useEffect, useState } from 'react';

import { useActivityStore } from '@/stores/activityStore';

import { getTodayActivityLogs } from './actions/activityLoggingActions';

interface ActivityLogProps {
  date: string;
  refreshKey?: number;
}

interface ActivityLogItem {
  id: string;
  type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'BREAK';
  task_id?: string;
  task_title?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  milestone_id?: string;
  milestone_title?: string | null;
  quest_id?: string;
  quest_title?: string | null;
}

const ICONS = {
  FOCUS: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-brand-500"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="#3b82f6" opacity="0.15"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  ),
  BREAK: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-amber-500"><rect x="4" y="8" width="16" height="8" rx="4" fill="#f59e42" opacity="0.15"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  SHORT_BREAK: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-amber-500"><rect x="4" y="8" width="16" height="8" rx="4" fill="#f59e42" opacity="0.15"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
  LONG_BREAK: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-amber-600"><rect x="2" y="7" width="20" height="10" rx="5" fill="#f59e42" opacity="0.15"/><path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ),
};

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}

// Struktur pohon
interface ActivityLogTree {
  id: string;
  title: string;
  type: 'quest' | 'milestone' | 'task';
  children: ActivityLogTree[];
  logs?: ActivityLogItem[]; // hanya di level task
}

// Komponen rekursif untuk render pohon
const LogTreeItem: React.FC<{ node: ActivityLogTree; level?: number }> = ({ node, level = 0 }) => {
  return (
    <div style={{ marginLeft: level * 20 }} className="mb-2">
      <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
        {node.title}
      </div>
      {node.children && node.children.length > 0 ? <div className="mt-1">
          {node.children.map((child) => (
            <LogTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div> : null}
      {node.logs && node.logs.length > 0 ? <ul className="mt-1 space-y-1">
          {node.logs.map((log) => {
            const icon = ICONS[log.type] || ICONS.BREAK;
            let title = '';
            if (log.type === 'FOCUS') {
              title = log.task_title ? `Fokus pada: ${log.task_title}` : 'Sesi Fokus';
            } else if (log.type === 'SHORT_BREAK') {
              title = 'Istirahat Pendek';
            } else if (log.type === 'LONG_BREAK') {
              title = 'Istirahat Panjang';
            } else {
              title = 'Istirahat';
            }
            return (
              <li key={log.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                <div className="shrink-0">{icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">{title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeRange(log.start_time, log.end_time)} &bull; {formatDuration(log.duration_minutes)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul> : null}
    </div>
  );
};

const ActivityLog: React.FC<ActivityLogProps> = ({ date, refreshKey }) => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const lastActivityTimestamp = useActivityStore((state) => state.lastActivityTimestamp);
  useEffect(() => {
    setLoading(true);
    getTodayActivityLogs(date)
      .then((data) => setLogs(data))
      .finally(() => setLoading(false));
  }, [date, refreshKey, lastActivityTimestamp]);

  // Group logs by task_id
  const grouped = logs.reduce((acc, log) => {
    if (!log.task_id) return acc;
    if (!acc[log.task_id]) {
      acc[log.task_id] = {
        title: log.task_title || 'Task',
        sessions: [],
        totalMinutes: 0,
      };
    }
    acc[log.task_id].sessions.push(log);
    acc[log.task_id].totalMinutes += log.duration_minutes;
    return acc;
  }, {} as Record<string, { title: string; sessions: ActivityLogItem[]; totalMinutes: number }>);
  const summary = Object.values(grouped);

  // Helper format waktu
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  const formatTotal = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} hrs${m > 0 ? ' ' + m + ' mins' : ''}` : `${m} mins`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 max-h-[420px] flex flex-col">
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Memuat aktivitas...</div>
        ) : summary.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            Belum ada aktivitas tercatat hari ini.
          </div>
        ) : (
          <div className="space-y-4">
            {summary.map((item) => (
              <div key={`summary-${item.title}`} className="border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 bg-white dark:bg-gray-800">
                <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">{item.title}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-1 rounded-full text-xs font-semibold">
                    {item.sessions.length} sessions
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-300">({formatTotal(item.totalMinutes)})</span>
                </div>
                <ul className="space-y-1 ml-2">
                  {item.sessions.map((log) => (
                    <li key={log.id} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                      <span>•</span>
                      <span className="flex items-center gap-2 font-mono">
                        <span className="w-9 text-left">{formatTime(log.start_time)}</span>
                        <span className="w-6 text-center">→</span>
                        <span className="w-12 text-left">{formatTime(log.end_time)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog; 