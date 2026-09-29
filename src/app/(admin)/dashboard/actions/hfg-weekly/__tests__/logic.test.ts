import { describe, it, expect } from 'vitest';
import { formatHours, toHfgCard, buildHfgSummary, type HfgWeeklyRow } from '../logic';

const row = (over: Partial<HfgWeeklyRow> = {}): HfgWeeklyRow => ({
  quest_id: 'q1',
  title: 'GM',
  urut: 1,
  weekly_target_hours: 10,
  actual_minutes: 390,
  expected_minutes: 257,
  status: 'ON_TRACK',
  week_start: '2026-09-28',
  week_end: '2026-10-04',
  year: 2026,
  quarter: 4,
  week_in_quarter: 1,
  ...over,
});

describe('formatHours', () => {
  it('membulatkan ke 0.1 jam dan membuang .0', () => {
    expect(formatHours(390)).toBe('6.5h');
    expect(formatHours(600)).toBe('10h');
    expect(formatHours(0)).toBe('0h');
    expect(formatHours(25)).toBe('0.4h');
  });
});

describe('toHfgCard', () => {
  it('menghitung label, persen, dan sisa', () => {
    expect(toHfgCard(row())).toEqual({
      questId: 'q1',
      title: 'GM',
      status: 'ON_TRACK',
      actualLabel: '6.5h',
      targetLabel: '10h',
      percent: 65,
      remainingLabel: 'sisa 3.5h',
    });
  });

  it('menerima numeric sebagai string dari PostgREST', () => {
    expect(toHfgCard(row({ weekly_target_hours: '10.0' as unknown as number })).targetLabel).toBe('10h');
  });

  it('persen mentok 100 dan sisa jadi "tercapai" kalau target lewat', () => {
    const card = toHfgCard(row({ actual_minutes: 700 }));
    expect(card.percent).toBe(100);
    expect(card.remainingLabel).toBe('tercapai');
  });

  it('minggu 13: jam & target tetap tampil, tanpa sisa (tidak dinilai)', () => {
    const card = toHfgCard(row({ status: 'REST_WEEK', week_in_quarter: 13 }));
    expect(card.status).toBe('REST_WEEK');
    expect(card.actualLabel).toBe('6.5h');
    expect(card.targetLabel).toBe('10h');
    expect(card.remainingLabel).toBeNull();
  });

  it('tanpa target: targetLabel & remainingLabel null, persen 0', () => {
    const card = toHfgCard(row({ weekly_target_hours: null, status: 'NO_TARGET' }));
    expect(card.targetLabel).toBeNull();
    expect(card.remainingLabel).toBeNull();
    expect(card.percent).toBe(0);
  });
});

describe('buildHfgSummary', () => {
  it('kosong → weekLabel null, cards []', () => {
    expect(buildHfgSummary([])).toEqual({ weekLabel: null, cards: [] });
  });

  it('memberi label minggu dari baris pertama dan menjaga urutan', () => {
    const s = buildHfgSummary([row(), row({ quest_id: 'q2', title: 'Sabilillah', urut: 2 })]);
    expect(s.weekLabel).toBe('W1 Q4 2026');
    expect(s.cards.map((c) => c.questId)).toEqual(['q1', 'q2']);
  });
});
