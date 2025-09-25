import React from 'react';
import Skeleton from '@/components/ui/skeleton/Skeleton';
import Button from '@/components/ui/button/Button';
import { TaskSelectionModalProps } from '../types';

const MainQuestModal: React.FC<TaskSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  selectedTasks, 
  onTaskToggle, 
  onSave, 
  isLoading,
  savingLoading = false
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

  // Filter out tasks that are not available for selection
  // Tasks that were completed yesterday are already filtered out in getTasksForWeek
  // But we need to ensure tasks added today are still available
  const availableTasks = tasks.filter(task => {
    // Always show tasks that are currently selected (added today)
    if (selectedTasks[task.id]) {
      return true;
    }
    // Show all other available tasks (filtered by getTasksForWeek)
    return true;
  });

  const groupedTasks = groupByGoalSlot(availableTasks);
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
          <p className="text-gray-500 text-sm mb-2">
            💡 Tugas yang sudah selesai di hari sebelumnya tidak akan muncul di pilihan untuk menghindari duplikasi.
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
                  {slotTasks.map((task, index) => {
                    const isSelected = selectedTasks[task.id] || false;
                    // Create unique key by combining task.id with goal_slot and index to prevent duplicates
                    const uniqueKey = `${task.id}-${task.goal_slot}-${index}`;
                    return (
                      <div 
                        key={uniqueKey} 
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                          savingLoading 
                            ? 'cursor-not-allowed opacity-50' 
                            : 'cursor-pointer'
                        } ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onTaskToggle(task.id)}
                          disabled={savingLoading}
                          className={`w-4 h-4 rounded focus:ring-2 ${
                            isSelected
                              ? 'text-blue-600 bg-blue-600 border-blue-600 focus:ring-blue-500'
                              : 'text-brand-500 bg-gray-100 border-gray-300 focus:ring-brand-500'
                          } ${savingLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          <Button
            onClick={onClose}
            disabled={savingLoading}
            variant="outline"
            size="md"
          >
            Batal
          </Button>
          <Button
            onClick={onSave}
            loading={savingLoading}
            loadingText="Menyimpan..."
            variant="primary"
            size="md"
          >
            Pilih ({selectedCount} Quest)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainQuestModal;
