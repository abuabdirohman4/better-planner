'use client';

import type { SyncAction } from '@/types/twelve-week-sync';

interface Props {
  syncActions: SyncAction[];
  onToggle: (id: string, isCompleted: boolean) => void;
}

export default function SyncActionChecklist({ syncActions, onToggle }: Props) {
  const completed = syncActions.filter(a => a.is_completed).length;

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {completed}/{syncActions.length} completed
      </p>
      {syncActions.map(action => (
        <label
          key={action.id}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <input
            type="checkbox"
            checked={action.is_completed}
            onChange={e => onToggle(action.id, e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
          />
          <span className={`text-sm ${
            action.is_completed
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {action.action_text}
          </span>
        </label>
      ))}
    </div>
  );
}
