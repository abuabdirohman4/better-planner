"use client";

import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

import { formatDuration, type FocusSummary } from '../actions/weekly-refuel/logic';

type ChartType = 'line' | 'bar';

// Meniru konfigurasi WeeklyProgressChart (dashboard): margin, grid, tooltip, toggle Bar/Line, warna #3b82f6.
export default function FocusWeekChart({ days }: { days: FocusSummary['days'] }) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const data = days.map((d) => ({ ...d, hours: Math.round((d.minutes / 60) * 10) / 10 }));
  const margin = isMobile ? { top: 25, right: 10, left: -30, bottom: 5 } : { top: 25, right: 30, left: 20, bottom: 5 };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{d.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Fokus:</span> {formatDuration(d.minutes)}</p>
        <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">Sesi:</span> {d.sessions}</p>
      </div>
    );
  };

  const axisProps = {
    className: 'text-gray-600 dark:text-gray-400',
    tick: { fontSize: isMobile ? 10 : 12 },
    tickLine: { stroke: '#6B7280' },
  };
  const label = (
    <LabelList
      dataKey="hours"
      position="top"
      formatter={(v: any) => (v > 0 ? `${v}j` : '')}
      className="text-xs fill-gray-700 dark:fill-gray-300"
    />
  );

  const btn = (t: ChartType, text: string) => (
    <button
      onClick={() => setChartType(t)}
      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
        chartType === t
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      }`}
    >
      {text}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Fokus per hari</p>
        <div className="flex gap-2">{btn('bar', 'Bar')}{btn('line', 'Line')}</div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" interval={0} {...axisProps} />
              <YAxis allowDecimals={false} width={isMobile ? 55 : 40} {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }}>
                {label}
              </Line>
            </LineChart>
          ) : (
            <BarChart data={data} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="label" interval={0} {...axisProps} />
              <YAxis allowDecimals={false} width={isMobile ? 55 : 40} {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]}>{label}</Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
