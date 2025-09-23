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
  what_done?: string | null;
  what_think?: string | null;
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
  // Convert to local time
  const startLocal = s.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  const endLocal = e.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  return `${startLocal} - ${endLocal}`;
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

// Komponen untuk menampilkan journal entry
const JournalEntry: React.FC<{ log: ActivityLogItem }> = ({ log }) => {
  if (!log.what_done && !log.what_think) return null;

  return (
    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2 mb-2">
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">One Minute Journal</span>
      </div>
      
      {log.what_done && (
        <div className="mb-2">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Apa yang diselesaikan:
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2 border">
            {log.what_done}
          </div>
        </div>
      )}
      
      {log.what_think && (
        <div>
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Yang masih dipikirkan:
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 rounded p-2 border">
            {log.what_think}
          </div>
        </div>
      )}
    </div>
  );
};

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
              <li key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div className="shrink-0">{icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">{title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeRange(log.start_time, log.end_time)} &bull; {formatDuration(log.duration_minutes)}
                    </div>
                  </div>
                </div>
                <JournalEntry log={log} />
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
  const [dynamicHeight, setDynamicHeight] = useState('400px');

  const lastActivityTimestamp = useActivityStore((state) => state.lastActivityTimestamp);
  
  // Calculate dynamic height based on Main Quest + Side Quest + Pomodoro Timer heights
  useEffect(() => {
    const calculateHeight = () => {
      try {
        // Get Main Quest + Side Quest + Pomodoro Timer
        const mainQuestCard = document.querySelector('.main-quest-card');
        const sideQuestCard = document.querySelector('.side-quest-card');
        const pomodoroTimer = document.querySelector('.pomodoro-timer');
        
        // Get viewport height
        const mainQuestHeight = mainQuestCard ? mainQuestCard.getBoundingClientRect().height : 0;
        const sideQuestHeight = sideQuestCard ? sideQuestCard.getBoundingClientRect().height : 0;
        const pomodoroHeight = pomodoroTimer ? pomodoroTimer.getBoundingClientRect().height : 0;
        
        // Calculate heights
        const finalHeight = (mainQuestHeight + sideQuestHeight) - pomodoroHeight - 100;

        // Set dynamic height based on available space
        setDynamicHeight(`${finalHeight}px`);
        
      } catch (error) {
        console.warn('Error calculating dynamic height:', error);
      }
    };
    
    // Calculate height on mount and window resize
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => window.removeEventListener('resize', calculateHeight);
  }, [date]); // Recalculate when date changes
  
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

  // Helper format waktu - convert UTC to local time
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  };
  const formatTotal = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} hrs${m > 0 ? ' ' + m + ' mins' : ''}` : `${m} mins`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 flex flex-col" style={{ height: dynamicHeight }}>
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
                      <div className="flex items-center gap-2">
                        <span>•</span>
                        <span className="flex items-center gap-2 font-mono">
                          <span className="w-9 text-left">{formatTime(log.start_time)}</span>
                          <span className="w-6 text-center">→</span>
                          <span className="w-12 text-left">{formatTime(log.end_time)}</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        ({formatDuration(log.duration_minutes)})
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
