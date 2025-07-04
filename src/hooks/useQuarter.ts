"use client";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

// Helper: get week of year
function getWeekOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = (date.getTime() - start.getTime()) / 86400000;
  const day = start.getDay() || 7;
  return Math.ceil((diff + day) / 7);
}

// Helper: parse q param (e.g. 2025-Q2)
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

export interface QuarterData {
  year: number;
  quarter: number;
  quarterString: string; // e.g., "Q2 2025"
  startDate: Date;
  endDate: Date;
  isCurrentQuarter: boolean;
  weekRange: string; // e.g., "Week 14-26"
}

export function useQuarter(): QuarterData {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  
  return useMemo(() => {
    const { year, quarter } = parseQParam(qParam);
    
    // Calculate quarter dates
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0); // Last day of the quarter
    
    // Calculate week range
    const startWeek = getWeekOfYear(startDate);
    const endWeek = getWeekOfYear(endDate);
    
    // Check if this is current quarter
    const now = new Date();
    const currentQuarter = parseQParam(null);
    const isCurrentQuarter = currentQuarter.year === year && currentQuarter.quarter === quarter;
    
    return {
      year,
      quarter,
      quarterString: `Q${quarter} ${year}`,
      startDate,
      endDate,
      isCurrentQuarter,
      weekRange: `Week ${startWeek}-${endWeek}`
    };
  }, [qParam]);
} 