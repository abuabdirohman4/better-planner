import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DayDroppableProps {
  date: string;
  children: React.ReactNode;
}

export function DayDroppable({ date, children }: DayDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: date });
  
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] transition rounded-lg ${isOver ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
    >
      {children}
    </div>
  );
}
