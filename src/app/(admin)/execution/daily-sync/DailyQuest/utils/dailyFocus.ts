// app-70vs: pengelompokan halaman Daily Sync menurut JENIS item (bukan flag).
// Daily Focus = HFG + Work (urut display_order; 3 teratas = inti), Tugas Lain = Side + rutin Daily (app-fj81).
import type { DailyPlanItem } from '@/types/daily-plan';

export const CORE_SLOTS = 3;

const FOCUS_TYPES = ['MAIN_QUEST', 'WORK_QUEST'];
const OTHER_TYPES = ['SIDE_QUEST', 'DAILY_QUEST'];

const KIND_LABEL: Record<string, string> = {
  MAIN_QUEST: 'HFG',
  WORK_QUEST: 'Work',
  SIDE_QUEST: 'Side',
  DAILY_QUEST: 'Daily',
};

export const kindLabel = (itemType: string) => KIND_LABEL[itemType] ?? itemType;

const byOrder = (a: DailyPlanItem, b: DailyPlanItem) => (a.display_order ?? 0) - (b.display_order ?? 0);

export interface SplitItems {
  /** 3 item HFG/Work pertama (urut display_order). Boleh kurang dari 3. */
  core: DailyPlanItem[];
  /** Sisanya, dikerjakan setelah inti beres. */
  bonus: DailyPlanItem[];
  /** Tugas Lain: Side Quest + rutin (Daily Quest), satu urutan drag. */
  other: DailyPlanItem[];
  /** Ada item inti tapi tak satu pun HFG. */
  missingHfg: boolean;
}

export function splitDailyItems(items: DailyPlanItem[] = []): SplitItems {
  const focus = items.filter((i) => FOCUS_TYPES.includes(i.item_type)).sort(byOrder);
  const core = focus.slice(0, CORE_SLOTS);
  return {
    core,
    bonus: focus.slice(CORE_SLOTS),
    other: items.filter((i) => OTHER_TYPES.includes(i.item_type)).sort(byOrder),
    missingHfg: core.length > 0 && !core.some((i) => i.item_type === 'MAIN_QUEST'),
  };
}

/** Pindahkan item `activeId` ke posisi `overId` dalam `ids`; hasilnya display_order 1..n. */
export function reorderIds(ids: string[], activeId: string, overId: string): { id: string; display_order: number }[] | null {
  const from = ids.indexOf(activeId);
  const to = ids.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const next = [...ids];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next.map((id, i) => ({ id, display_order: i + 1 }));
}

export type Cycle = 90 | 60 | 25;
export const CYCLES: { focus: Cycle; label: string }[] = [
  { focus: 90, label: '90/15' },
  { focus: 60, label: '60/10' },
  { focus: 25, label: '25/5' },
];
