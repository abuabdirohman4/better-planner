import React from 'react';
import TaskItemCard from './components/TaskItemCard';
import { TaskColumnProps } from './types';

const MainQuestListSection: React.FC<TaskColumnProps> = ({ 
  title, 
  items, 
  onStatusChange, 
  onSelectTasks, 
  onSetActiveTask, 
  selectedDate, 
  onTargetChange, 
  onFocusDurationChange, 
  completedSessions, 
  refreshSessionKey, 
  forceRefreshTaskId, 
  showAddQuestButton 
}) => {
  return (
    <div className="rounded-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <TaskItemCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onSetActiveTask={onSetActiveTask}
            selectedDate={selectedDate}
            onTargetChange={onTargetChange}
            onFocusDurationChange={onFocusDurationChange}
            completedSessions={completedSessions}
            refreshKey={refreshSessionKey?.[item.id]}
            forceRefreshTaskId={forceRefreshTaskId}
          />
        ))}
        {items.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="mb-6 py-8">Tidak ada tugas main quest hari ini</p>
            {onSelectTasks ? (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={onSelectTasks}
                  className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
                >
                  Tambah Quest
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        
        {/* Tombol Tambah Quest di dalam card Main Quest - hanya muncul jika ada task */}
        {showAddQuestButton && items.length > 0 ? (
          <div className="flex justify-center mt-6">
            <button 
              className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
              onClick={onSelectTasks}
            >
              Tambah Quest
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MainQuestListSection;
