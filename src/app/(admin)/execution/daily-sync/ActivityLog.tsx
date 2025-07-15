'use client';
import React, { useEffect, useState } from 'react';
import { getTodayActivityLogs } from './actions';

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

const ActivityLog: React.FC<ActivityLogProps> = ({ date, refreshKey }) => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTodayActivityLogs(date)
      .then((data) => setLogs(data))
      .finally(() => setLoading(false));
  }, [date, refreshKey]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 max-h-[420px] flex flex-col">
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">Log Aktivitas Hari Ini</h3>
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Memuat aktivitas...</div>
        ) : logs.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            Belum ada aktivitas tercatat hari ini.
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((log) => {
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
                <li key={log.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-2">
                  <div className="shrink-0">{icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeRange(log.start_time, log.end_time)} &bull; {formatDuration(log.duration_minutes)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActivityLog; 