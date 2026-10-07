import React from 'react';
import QuestPickerShell from './QuestPickerShell';
import QuestPickRow from './QuestPickRow';
import { TaskSelectionModalProps } from '../types';

const DailyQuestModal: React.FC<TaskSelectionModalProps> = ({
  isOpen,
  onClose,
  tasks,
  selectedTasks,
  onTaskToggle,
  onSave,
  tabs,
  isLoading,
  savingLoading = false
}) => {
  if (!isOpen) return null;

  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;
  const visible = tasks.filter(t => !t.is_archived);

  return (
    <QuestPickerShell
      title="Tugas Lain"
      selectedCount={selectedCount}
      onClose={onClose}
      onSave={onSave}
      tabs={tabs}
      cancelDisabled={savingLoading}
      saveDisabled={savingLoading}
      saving={savingLoading}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 animate-pulse">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : visible.length > 0 ? (
        <div className="space-y-1">
          {visible.map((task) => (
            <QuestPickRow
              key={task.id}
              title={task.title}
              selected={!!selectedTasks[task.id]}
              disabled={savingLoading}
              onToggle={() => onTaskToggle(task.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="font-medium">Belum ada Daily Quest</p>
          <p className="text-sm mt-1">Tambah di halaman Daily Quests</p>
        </div>
      )}
    </QuestPickerShell>
  );
};

export default DailyQuestModal;
