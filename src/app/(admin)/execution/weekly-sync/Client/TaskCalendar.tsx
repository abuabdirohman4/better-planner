import React from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import ComponentCard from '@/components/common/ComponentCard';
import { formatDateIndo, daysOfWeek } from '@/lib/dateUtils';
import { DayDroppable } from './DayDroppable';
import { TaskItemDraggable } from './TaskItemDraggable';
import type { Task } from '../types';

interface TaskCalendarProps {
  weekDates: Date[];
  weekTasks: { [date: string]: Task[] };
  handleDragEnd: (event: DragEndEvent) => void;
}

export function TaskCalendar({ 
  weekDates, 
  weekTasks, 
  handleDragEnd 
}: TaskCalendarProps) {
  return (
    <section>
      <h4 className="text-base font-semibold mb-2">Kalender Mingguan</h4>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid md:grid-rows-7 md:grid-cols-1">
          {weekDates.map((date: Date, idx: number) => {
            const dateStr = date.toISOString().slice(0, 10);
            return (
              <ComponentCard
                key={dateStr}
                title={`${daysOfWeek[idx]}, ${formatDateIndo(date)}`}
              >
                <DayDroppable date={dateStr}>
                  {weekTasks[dateStr] && weekTasks[dateStr].length === 0 ? <div className="text-gray-400">Belum ada tugas</div> : null}
                  {weekTasks[dateStr] ? weekTasks[dateStr].map((task) => (
                      <TaskItemDraggable key={task.id} task={task} id={task.id} />
                    )) : null}
                </DayDroppable>
              </ComponentCard>
            );
          })}
        </div>
      </DndContext>
    </section>
  );
}
