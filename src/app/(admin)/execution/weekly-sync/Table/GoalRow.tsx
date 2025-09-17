"use client";

import React from 'react';
import Button from '@/components/ui/button/Button';
import HorizontalGoalDisplay from './HorizontalGoalDisplay';
import ProgressIndicator from './ProgressIndicator';
import type { WeeklyGoal } from '../types';

interface GoalRowProps {
  slotNumber: number;
  goal: WeeklyGoal | undefined;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  onSlotClick: (slotNumber: number) => void;
}

export default function GoalRow({ slotNumber, goal, progress, onSlotClick }: GoalRowProps) {
  const isCompleted = progress.percentage === 100;
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      {/* Column 1 - Auto Checkbox */}
      <td className="py-4 px-4 w-16 text-center">
        <input
          type="checkbox"
          checked={isCompleted}
          readOnly
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
      </td>
      
      {/* Column 2 - Focus Selector */}
      <td className={`py-4 ${goal && goal.items.length > 0 ? 'px-4' : 'px-7'}`}>
        {goal && goal.items.length > 0 ? (
          <HorizontalGoalDisplay
            items={goal.items}
            onClick={() => onSlotClick(slotNumber)}
            slotNumber={slotNumber}
          />
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSlotClick(slotNumber)}
            className="w-full justify-start"
          >
            + Tetapkan Fokus
          </Button>
        )}
      </td>
      
      {/* Column 3 - Auto Progress */}
      <td className="py-4 px-4 w-32">
        <ProgressIndicator progress={progress} />
      </td>
    </tr>
  );
}
