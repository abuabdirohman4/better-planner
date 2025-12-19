import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import { TaskSelectionModalProps } from '../types';

const DailyQuestModal: React.FC<TaskSelectionModalProps> = ({
  isOpen,
  onClose,
  tasks,
  selectedTasks,
  onTaskToggle,
  onSave,
  isLoading,
  savingLoading = false
}) => {
  if (!isOpen) return null;

  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Daily Quest</h2>
            <p className="text-gray-700 font-medium">
              Selected : {selectedCount} Quest
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quest List */}
        <div className="flex-1 overflow-y-auto mb-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded" />
                  <div className="flex-1 h-4 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.filter(t => !t.is_archived).length > 0 ? (
                tasks.filter(t => !t.is_archived).map((task) => {
                  const isSelected = !!selectedTasks[task.id];
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected
                        ? 'border-brand-500 bg-brand-50/50'
                        : 'border-gray-200 hover:border-brand-200 hover:bg-gray-50'
                        }`}
                      onClick={() => onTaskToggle(task.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onTaskToggle(task.id)}
                        disabled={savingLoading}
                      />
                      <div className="flex-1">
                        <span className={`text-sm font-medium ${isSelected ? 'text-brand-900' : 'text-gray-900'}`}>
                          {task.title}
                        </span>
                        {task.quest_title && (
                          <div className="text-xs text-brand-600 mt-0.5">
                            {task.quest_title}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="font-medium">No daily quests found</p>
                  <p className="text-sm mt-1">Go to management to create some</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 flex-shrink-0">
          <Button
            onClick={onClose}
            disabled={savingLoading}
            variant="outline"
            size="md"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={selectedCount === 0 || savingLoading}
            loading={savingLoading}
            loadingText="Menyimpan..."
            variant="primary"
            size="md"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DailyQuestModal;
