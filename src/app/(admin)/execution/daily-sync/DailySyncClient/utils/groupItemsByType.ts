import { DailyPlanItem } from '../../DailySyncClient/types';

export const groupItemsByType = (items: DailyPlanItem[] = []) => {
  const groups = {
    'MAIN_QUEST': [] as DailyPlanItem[],
    'WORK': [] as DailyPlanItem[],
    'SIDE_QUEST': [] as DailyPlanItem[]
  };
  items.forEach(item => {
    if (item.item_type === 'QUEST' || item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
      groups['MAIN_QUEST'].push(item);
    } else if (item.item_type === 'MILESTONE') {
      groups['WORK'].push(item);
    } else if (item.item_type === 'SIDE_QUEST') {
      groups['SIDE_QUEST'].push(item);
    }
  });
  return groups;
};
