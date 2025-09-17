import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../types';

interface TaskItemDraggableProps {
  task: Task;
  id: string;
}

export function TaskItemDraggable({ task, id }: TaskItemDraggableProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border bg-white dark:bg-gray-800 shadow-sm cursor-move mb-2 transition ${isDragging ? "opacity-60" : ""}`}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      <span className="font-medium">{task.title}</span>
    </div>
  );
}
