import { useState, useTransition } from 'react';
import MainQuestSection from '../MainQuest/MainQuestSection';
import { TaskColumnProps } from '../DailySyncClient/types';
import { SideQuestFormProps } from './types';

// SideQuestForm component (merged from SideQuestForm.tsx)
const SideQuestForm: React.FC<SideQuestFormProps> = ({ onSubmit, onCancel }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    startTransition(async () => {
      await onSubmit(newTaskTitle);
      setNewTaskTitle('');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <div className="flex space-x-2">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Masukkan judul side quest..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={!newTaskTitle.trim() || isPending}
          className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 disabled:opacity-50"
        >
          {isPending ? 'Menambah...' : 'Tambah'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
};

// Main SideQuestSection component (merged from TaskColumn.tsx)
const SideQuestSection: React.FC<TaskColumnProps> = ({ 
  title, 
  items, 
  onStatusChange, 
  onAddSideQuest, 
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
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSideQuest = (title: string) => {
    if (onAddSideQuest) {
      onAddSideQuest(title);
      setShowAddForm(false);
    }
  };

  return (
    <div className="rounded-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
        {onAddSideQuest ? (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          >
            + Tambah Side Quest
          </button>
        ) : null}
      </div>

      {showAddForm && onAddSideQuest ? (
        <SideQuestForm
          onSubmit={handleAddSideQuest}
          onCancel={() => setShowAddForm(false)}
        />
      ) : null}

      <div className="space-y-3">
        {items.map((item) => (
          <MainQuestSection
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

export default SideQuestSection;
