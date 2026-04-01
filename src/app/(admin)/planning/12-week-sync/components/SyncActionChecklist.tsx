'use client';

import type { SyncAction } from '@/types/twelve-week-sync';

interface Props {
  syncActions: SyncAction[];
  onToggle: (id: string, isCompleted: boolean) => void;
}

export default function SyncActionChecklist({ syncActions, onToggle }: Props) {
  return (
    <div className="space-y-4">
      {syncActions.map(action => (
        <label
          key={action.id}
          className="flex items-start gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center h-5">
            <input
              type="checkbox"
              checked={action.is_completed}
              onChange={e => onToggle(action.id, e.target.checked)}
              className="h-5 w-5 rounded-lg border-gray-300 dark:border-gray-700 text-blue-500 focus:ring-blue-500 cursor-pointer transition-all dark:bg-gray-900"
            />
          </div>
          <span className={`text-sm font-medium transition-all duration-300 ${
            action.is_completed
              ? 'line-through text-gray-400'
              : 'text-gray-700 dark:text-gray-300'
          }`}>
            {action.action_text}
          </span>
        </label>
      ))}
      {syncActions.length === 0 && (
        <p className="text-sm text-gray-500 italic pb-2">Tidak ada sync action.</p>
      )}
    </div>
  );
}
