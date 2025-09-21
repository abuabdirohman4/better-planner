import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import { TaskSelectionModalProps } from '../types';

const TaskSelectionModal: React.FC<TaskSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  selectedTasks, 
  onTaskToggle, 
  onSave, 
  isLoading 
}) => {
  const groupByGoalSlot = (tasks: any[]) => {
    const groups: Record<number, any[]> = {};
    tasks.forEach(task => {
      if (!groups[task.goal_slot]) {
        groups[task.goal_slot] = [];
      }
      groups[task.goal_slot].push(task);
    });
    return groups;
  };

  if (!isOpen) return null;

  const groupedTasks = groupByGoalSlot(tasks);
  const selectedCount = Object.values(selectedTasks).filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kelola Rencana Harian</h2>
          <p className="text-gray-600 mb-2">
            Tugas yang sudah tercentang adalah yang sudah ada di rencana harian. Anda bisa menambah atau menghapus tugas sesuai kebutuhan.
          </p>
          <p className="text-blue-600 font-medium">
            {selectedCount} tugas dipilih
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([goalSlot, slotTasks]) => (
              <div key={goalSlot} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Goal Mingguan {goalSlot}</h3>
                <div className="space-y-3">
                  {slotTasks.map((task) => {
                    const isSelected = selectedTasks[task.id] || false;
                    return (
                      <div 
                        key={task.id} 
                        className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTaskToggle(task.id)}
                          className={`w-4 h-4 rounded focus:ring-2 ${
                            isSelected
                              ? 'text-blue-600 bg-blue-600 border-blue-600 focus:ring-blue-500'
                              : 'text-brand-500 bg-gray-100 border-gray-300 focus:ring-brand-500'
                          }`}
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium block ${
                            isSelected ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </span>
                          <span className={`text-xs block ${
                            isSelected ? 'text-gray-600' : 'text-gray-500'
                          }`}>
                            {task.quest_title} • {task.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 font-medium"
          >
            Pilih ({selectedCount} Quest)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSelectionModal;
