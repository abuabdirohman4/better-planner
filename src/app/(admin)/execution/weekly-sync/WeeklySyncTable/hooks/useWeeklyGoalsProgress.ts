import { useMemo } from 'react';
import type { WeeklyGoal, ProgressData, WeeklyGoalsProgress } from '../../types';

/**
 * Custom hook untuk menghitung progress weekly goals di client-side
 * Menggantikan calculation yang dilakukan di database RPC function
 */
export function useWeeklyGoalsProgress(goals: WeeklyGoal[]): WeeklyGoalsProgress {
  return useMemo(() => {
    const progressMap: WeeklyGoalsProgress = {};
    
    goals.forEach(goal => {
      const total = goal.items.length;
      
      const completed = goal.items.filter(item => {
        switch (item.item_type) {
          case 'QUEST':
            return item.status === 'Completed';
          case 'MILESTONE':
            return true; // Milestones selalu dianggap completed
          case 'TASK':
          case 'SUBTASK':
            return item.status === 'DONE';
          default:
            return false;
        }
      }).length;
      
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      progressMap[goal.goal_slot] = {
        completed,
        total,
        percentage
      };
    });
    
    return progressMap;
  }, [goals]);
}

/**
 * Helper function untuk mendapatkan progress data untuk slot tertentu
 */
export function getSlotProgress(
  progress: WeeklyGoalsProgress, 
  slotNumber: number
): ProgressData {
  return progress[slotNumber] || { completed: 0, total: 0, percentage: 0 };
}

/**
 * Helper function untuk mengecek apakah goal slot sudah completed
 */
export function isSlotCompleted(progress: WeeklyGoalsProgress, slotNumber: number): boolean {
  return getSlotProgress(progress, slotNumber).percentage === 100;
}
