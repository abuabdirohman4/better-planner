"use client";

import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import type { WeeklyProgressData } from '../actions/weeklyProgressActions';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { getProgressColor } from '@/lib/utils';

interface WeeklyProgressChartProps {
  data: WeeklyProgressData[];
  isLoading?: boolean;
  error?: Error | null;
}

type ChartType = 'line' | 'bar';

export default function WeeklyProgressChart({ data, isLoading, error }: WeeklyProgressChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Dynamic chart margin based on screen size
  const chartMargin = isMobile 
    ? { top: 25, right: 10, left: -30, bottom: 5 }  // Negative left margin to eliminate gap, more top for labels
    : { top: 25, right: 30, left: 20, bottom: 5 }   // Normal margin for desktop

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        {/* Chart area skeleton */}
        <div className="w-full h-80 mb-6">
          <Skeleton className="h-full w-full" />
        </div>

        {/* Summary stats skeleton */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <Skeleton className="h-4 w-20 mx-auto mb-2" />
            <Skeleton className="h-8 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-20 mx-auto mb-2" />
            <Skeleton className="h-8 w-16 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <Skeleton className="h-8 w-16 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-2">Error loading chart data</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start planning your weekly goals to see progress</p>
        </div>
      </div>
    );
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Completed:</span> {data.completed} / {data.total}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Percentage:</span> {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Color function for bars based on percentage
  // Uses centralized utility function for consistency

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header with chart type selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Weekly Goals Progress
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              chartType === 'bar'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              chartType === 'line'
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="weekLabel" 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: '#6B7280' }}
                interval={isMobile ? 0 : 'preserveStartEnd'}
                // angle={isMobile ? -45 : 0}
                // textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-gray-600 dark:text-gray-400"
                tickLine={{ stroke: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="percentage" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              >
                <LabelList 
                  dataKey="percentage" 
                  position="top" 
                  formatter={(value: any) => `${value}%`}
                  className="text-xs fill-gray-700 dark:fill-gray-300"
                />
              </Line>
            </LineChart>
          ) : (
            <BarChart data={data} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis 
                dataKey="weekLabel" 
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: '#6B7280' }}
                interval={isMobile ? 0 : 'preserveStartEnd'}
                // angle={isMobile ? -45 : 0}
                // textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis 
                domain={[0, 100]}
                className="text-gray-600 dark:text-gray-400"
                tick={{ fontSize: isMobile ? 10 : 12 }}
                tickLine={{ stroke: '#6B7280' }}
                width={isMobile ? 55 : 40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getProgressColor(entry.percentage)} />
                ))}
                <LabelList 
                  dataKey="percentage" 
                  position="top" 
                  formatter={(value: any) => `${value}%`}
                  className="text-xs fill-gray-700 dark:fill-gray-300"
                />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Tasks</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {data.reduce((sum, week) => sum + week.total, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Completed</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {data.reduce((sum, week) => sum + week.completed, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Completion</p>
          <p className="text-2xl font-semibold text-brand-500">
            {data.length > 0 
              ? Math.round(data.reduce((sum, week) => sum + week.percentage, 0) / data.length)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
}

