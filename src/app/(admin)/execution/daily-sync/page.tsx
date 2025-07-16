"use client";
import React, { useState, useMemo, useTransition, useEffect } from "react";
import DailySyncClient, { type DailyPlan } from "./DailySyncClient";
import PomodoroTimer from "./PomodoroTimer";
import ActivityLog from "./ActivityLog";
import { useWeek } from '@/hooks/useWeek';
import { getWeekOfYear, getQuarterWeekRange, getDateFromWeek } from '@/lib/quarterUtils';
import { daysOfWeek, getWeekDates } from '@/lib/dateUtils';
import { logActivity } from "./actions";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Spinner from '@/components/ui/spinner/Spinner';
import { getDailyPlan, setDailyPlan } from './actions';
import { useTimer } from '@/context/TimerContext';
import { useActivityStore } from '@/stores/activityStore';

const getTodayDate = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Gunakan jam 12 siang untuk menghindari bug zona waktu
  return today;
};

// Helper: pastikan date adalah hari Senin
function ensureMonday(date: Date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0); // Set jam ke 12 siang
  const day = d.getDay();
  // 0 = Minggu, 1 = Senin, ...
  const diff = (day === 0 ? -6 : 1 - day); // Jika Minggu, mundur 6 hari, selain itu ke Senin
  d.setDate(d.getDate() + diff);
  return d;
}

function DailySyncContent() {
  const [, startTransition] = useTransition();
  const { year, quarter } = useWeek();
  const today = getTodayDate();
  const [currentWeek, setCurrentWeek] = useState(() => ensureMonday(today));

  useEffect(() => {
    // Log atau efek lain saat minggu berubah
  }, [currentWeek]);

  const weekDates = getWeekDates(currentWeek);
  const [activityLogRefreshKey, setActivityLogRefreshKey] = useState(0);

  const getDefaultDayIndexForWeek = (weekStartDate: Date) => {
    const weekDateStrs = getWeekDates(weekStartDate).map(d => d.toISOString().slice(0, 10));
    const todayStr = today.toISOString().slice(0, 10);
    const todayIndex = weekDateStrs.indexOf(todayStr);
    return todayIndex !== -1 ? todayIndex : 0;
  };

  const [selectedDayIdx, setSelectedDayIdx] = useState(() => getDefaultDayIndexForWeek(currentWeek));
  const selectedDate = weekDates[selectedDayIdx];
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dailyPlan, setDailyPlanState] = useState<DailyPlan | null>(null);

  useEffect(() => {
    setLoading(true);
    getDailyPlan(selectedDateStr)
      .then(plan => setDailyPlanState(plan))
      .finally(() => setLoading(false));
  }, [selectedDateStr]);

  useEffect(() => {
    if (!loading && initialLoading) {
      setInitialLoading(false);
    }
  }, [loading, initialLoading]);

  useEffect(() => {
    setSelectedDayIdx(getDefaultDayIndexForWeek(currentWeek));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeek]);

  const weekCalculations = useMemo(() => {
    const currentWeekNumber = getWeekOfYear(currentWeek);
    const { startWeek, endWeek } = getQuarterWeekRange(year, quarter);
    const totalWeeks = endWeek - startWeek + 1;
    const weekInQuarter = Math.max(1, Math.min(totalWeeks, currentWeekNumber - startWeek + 1));
    return {
      displayWeek: weekInQuarter,
      totalWeeks,
      startWeek,
    };
  }, [currentWeek, year, quarter]);

  const { displayWeek, totalWeeks, startWeek } = weekCalculations;

  const goPrevWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(ensureMonday(prev));
  };
  const goNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(ensureMonday(next));
  };

  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const handleSelectWeek = (weekIdx: number) => {
    const weekNumber = startWeek + weekIdx - 1;
    const rawDate = getDateFromWeek(year, weekNumber, 1);
    setCurrentWeek(ensureMonday(rawDate));
    setIsWeekDropdownOpen(false);
  };

  const { startFocusSession, timerState, secondsElapsed, activeTask: activeTaskCtx, lastSessionComplete, setLastSessionComplete } = useTimer();

  useEffect(() => {
    const defaultTitle = 'Daily Sync | Better Planner';
    function formatTime(secs: number) {
      const m = Math.floor(secs / 60).toString().padStart(2, '0');
      const s = (secs % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    }
    if (timerState === 'FOCUSING' && activeTaskCtx) {
      document.title = `${formatTime(secondsElapsed)} - ${activeTaskCtx.title} | Better Planner`;
    } else {
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    };
  }, [timerState, secondsElapsed, activeTaskCtx]);

  const handleSessionComplete = async (sessionData: {
    taskId: string;
    taskTitle: string;
    type: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
    startTime: string;
    endTime: string;
  }) => {
    startTransition(async () => {
      try {
        if (!sessionData.taskId || !sessionData.type || !sessionData.startTime || !sessionData.endTime) {
          console.error('Missing required fields', sessionData);
          return;
        }
        const formData = new FormData();
        formData.append('taskId', sessionData.taskId);
        formData.append('taskTitle', sessionData.taskTitle);
        formData.append('sessionType', sessionData.type);
        formData.append('date', selectedDateStr);
        formData.append('startTime', sessionData.startTime);
        formData.append('endTime', sessionData.endTime);
        await logActivity(formData);
        setActivityLogRefreshKey((k) => k + 1);
        useActivityStore.getState().triggerRefresh();
      } catch (err) {
        console.error('Error logging session:', err);
      }
    });
  };

  useEffect(() => {
    if (lastSessionComplete) {
      handleSessionComplete(lastSessionComplete);
      setLastSessionComplete(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSessionComplete]);

  const handleSetActiveTask = (task: { id: string; title: string; item_type: string }) => {
    startFocusSession(task);
  };

  return (
    <div className="mx-auto py-8 px-4">
      {initialLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[600px]">
          <Spinner size={164} />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-2">
              <Button size="sm" className="!py-5" variant="outline" onClick={goPrevWeek} disabled={displayWeek <= 1}>
                &lt;
              </Button>
              <div className="relative">
                <button
                  className="flex items-center justify-center gap-1 px-8 py-4 rounded-lg border border-gray-400 bg-white dark:text-white dark:bg-gray-900 cursor-pointer min-w-24 dropdown-toggle hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setIsWeekDropdownOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isWeekDropdownOpen}
                >
                  <span>Week {displayWeek}</span>
                </button>
                <Dropdown className="w-28 !right-1" isOpen={isWeekDropdownOpen} onClose={() => setIsWeekDropdownOpen(false)}>
                  <div className="max-h-64 overflow-y-auto">
                    {Array.from({ length: totalWeeks }, (_, i) => (
                      <DropdownItem
                        key={i + 1}
                        onClick={() => handleSelectWeek(i + 1)}
                        className={displayWeek === i + 1 ? "bg-brand-100 dark:bg-brand-900/30 font-semibold !text-center" : "!text-center"}
                      >
                        Week {i + 1}
                      </DropdownItem>
                    ))}
                  </div>
                </Dropdown>
              </div>
              <Button size="sm" className="!py-5" variant="outline" onClick={goNextWeek} disabled={displayWeek >= totalWeeks}>
                &gt;
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {weekDates.map((date, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedDayIdx(idx)}
                  className={`w-24 min-w-[110px] px-3 py-2 rounded-lg border text-sm font-medium transition-all text-center ${selectedDayIdx === idx ? 'bg-brand-500 text-white border-brand-500' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-brand-100 dark:hover:bg-brand-900/30'}`}
                >
                  {daysOfWeek[idx]}
                  <span className="block text-xs mt-1 whitespace-nowrap">
                    {date.getDate()} {date.toLocaleDateString('en-US', { month: 'short' })} {date.getFullYear()}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] py-16">
              <Spinner size={164} />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <DailySyncClient
                    year={year}
                    quarter={quarter}
                    weekNumber={displayWeek}
                    selectedDate={selectedDateStr}
                    onSetActiveTask={handleSetActiveTask}
                    dailyPlan={dailyPlan}
                    setDailyPlanState={setDailyPlanState}
                    setDailyPlanAction={setDailyPlan}
                    loading={loading}
                  />
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <PomodoroTimer />
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">Log Aktivitas Hari Ini</h3>
                    <ActivityLog date={selectedDateStr} refreshKey={activityLogRefreshKey} />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Brain Dump</h3>
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    [Brain Dump Placeholder]
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function DailySyncPage() {
  return <DailySyncContent />;
}