export type HfgStatus = 'ON_TRACK' | 'AT_RISK' | 'NO_TARGET' | 'REST_WEEK';

// Satu baris hasil fungsi SQL hfg_weekly_status — semua hitungan sudah jadi di SQL.
export interface HfgWeeklyRow {
  quest_id: string;
  title: string;
  urut: number;
  weekly_target_hours: number | null;
  actual_minutes: number;
  expected_minutes: number;
  status: HfgStatus;
  week_start: string;
  week_end: string;
  year: number;
  quarter: number;
  week_in_quarter: number;
}

export interface HfgCard {
  questId: string;
  title: string;
  status: HfgStatus;
  actualLabel: string;
  targetLabel: string | null;
  percent: number;
  remainingLabel: string | null;
}

export interface HfgWeeklySummary {
  weekLabel: string | null;
  cards: HfgCard[];
}

export function formatHours(minutes: number): string {
  return `${Math.round(minutes / 6) / 10}h`;
}

export function toHfgCard(row: HfgWeeklyRow): HfgCard {
  const target = row.weekly_target_hours == null ? null : Number(row.weekly_target_hours);
  const targetMin = target ? target * 60 : 0;
  const remaining = targetMin && row.status !== 'REST_WEEK' ? Math.max(0, targetMin - row.actual_minutes) : null;
  return {
    questId: row.quest_id,
    title: row.title,
    status: row.status,
    actualLabel: formatHours(row.actual_minutes),
    targetLabel: target ? formatHours(targetMin) : null,
    percent: targetMin ? Math.min(100, Math.round((row.actual_minutes / targetMin) * 100)) : 0,
    remainingLabel: remaining === null ? null : remaining === 0 ? 'tercapai' : `sisa ${formatHours(remaining)}`,
  };
}

export function buildHfgSummary(rows: HfgWeeklyRow[]): HfgWeeklySummary {
  if (rows.length === 0) return { weekLabel: null, cards: [] };
  const first = rows[0];
  return {
    weekLabel: `W${first.week_in_quarter} Q${first.quarter} ${first.year}`,
    cards: rows.map(toHfgCard),
  };
}
