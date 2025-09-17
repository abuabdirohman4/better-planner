import React from 'react';
import ComponentCard from '@/components/common/ComponentCard';
import { DayDroppable } from './DayDroppable';
import { TaskItemDraggable } from './TaskItemDraggable';
import type { Task } from '../types';

interface TaskPoolProps {
  taskPool: Task[];
  loading: boolean;
}

export function TaskPool({ taskPool, loading }: TaskPoolProps) {
  return (
    <section>
      <h4 className="text-base font-semibold mb-2">Kolam Tugas</h4>
      <ComponentCard title="Kolam Tugas" desc="Tugas yang belum terjadwal">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <DayDroppable date="task-pool">
            {taskPool.length === 0 && <div className="text-gray-400">Tidak ada tugas</div>}
            {taskPool.map((task) => (
              <TaskItemDraggable key={task.id} task={task} id={task.id} />
            ))}
          </DayDroppable>
        )}
      </ComponentCard>
    </section>
  );
}
