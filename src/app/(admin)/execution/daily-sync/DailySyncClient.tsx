"use client";
import React, { useState, useEffect, useTransition } from "react";
import { getTasksForWeek, getDailyPlan, setDailyPlan, addSideQuest, updateDailyPlanItemStatus } from "./actions";

interface WeeklyTaskItem {
  id: string;
  type: 'QUEST' | 'MILESTONE' | 'TASK' | 'SUBTASK';
  title: string;
  status: string;
  quest_title: string;
  goal_slot: number;
}

interface DailyPlanItem {
  id: string;
  item_id: string;
  item_type: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  title?: string;
  quest_title?: string;
}

interface DailyPlan {
  id: string;
  plan_date: string;
  daily_plan_items?: DailyPlanItem[];
}

interface DailySyncClientProps {
  year: number;
  quarter: number;
  weekNumber: number;
  selectedDate: string; // format YYYY-MM-DD
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
}

const TaskCard: React.FC<{ 
  item: DailyPlanItem; 
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
}> = ({ item, onStatusChange, onSetActiveTask }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-3">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
          {item.title || `Task ${item.item_id}`}
        </h4>
        <div className="flex items-center space-x-2">
          <select
            value={item.status}
            onChange={(e) => onStatusChange(item.item_id, e.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE')}
            className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}
          >
            <option value="TODO">Belum Dimulai</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="DONE">Selesai</option>
          </select>
        </div>
      </div>
      
      {item.quest_title && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          {item.quest_title}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        {onSetActiveTask && (
          <button 
            className="text-xs bg-brand-500 text-white px-3 py-1 rounded hover:bg-brand-600 transition-colors"
            onClick={() => {
              onSetActiveTask({
                id: item.item_id,
                title: item.title || `Task ${item.item_id}`,
                item_type: item.item_type
              });
            }}
          >
            Mulai Sesi
          </button>
        )}
        
        <div className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={item.status === 'DONE'}
            onChange={(e) => onStatusChange(item.item_id, e.target.checked ? 'DONE' : 'TODO')}
            className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
          />
        </div>
      </div>
    </div>
  );
};

const TaskColumn: React.FC<{
  title: string;
  items: DailyPlanItem[];
  onStatusChange: (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  onAddSideQuest?: (title: string) => void;
  onSelectTasks?: () => void;
  onSetActiveTask?: (task: { id: string; title: string; item_type: string }) => void;
}> = ({ title, items, onStatusChange, onAddSideQuest, onSelectTasks, onSetActiveTask }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddSideQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !onAddSideQuest) return;
    
    startTransition(async () => {
      await onAddSideQuest(newTaskTitle);
      setNewTaskTitle('');
      setShowAddForm(false);
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
        {onAddSideQuest && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          >
            + Tambah Side Quest
          </button>
        )}
      </div>

      {showAddForm && onAddSideQuest && (
        <form onSubmit={handleAddSideQuest} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Judul side quest..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !newTaskTitle.trim()}
              className="px-4 py-2 bg-brand-500 text-white rounded-md text-sm font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? '...' : 'Tambah'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            Tidak ada tugas {title.toLowerCase()} hari ini
          </div>
        ) : (
          items.map((item) => (
            <TaskCard key={item.id} item={item} onStatusChange={onStatusChange} onSetActiveTask={onSetActiveTask} />
          ))
        )}
      </div>

              {/* Select Tasks button for Main Quest column */}
        {onSelectTasks && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onSelectTasks}
              className="w-full px-4 py-2 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors text-sm"
            >
              Kelola Rencana Harian
            </button>
          </div>
        )}
    </div>
  );
};

const TaskSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  tasks: WeeklyTaskItem[];
  selectedTasks: Record<string, boolean>;
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  isLoading: boolean;
}> = ({ isOpen, onClose, tasks, selectedTasks, onTaskToggle, onSave, isLoading }) => {
  if (!isOpen) return null;

  const groupByGoalSlot = (tasks: WeeklyTaskItem[]) => {
    const groups: Record<number, WeeklyTaskItem[]> = { 1: [], 2: [], 3: [] };
    tasks.forEach(task => {
      if (groups[task.goal_slot]) {
        groups[task.goal_slot].push(task);
      }
    });
    return groups;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 min-w-[600px] max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Kelola Rencana Harian
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tugas yang sudah tercentang adalah yang sudah ada di rencana harian. Anda bisa menambah atau menghapus tugas sesuai kebutuhan.
          </p>
          {Object.keys(selectedTasks).filter(k => selectedTasks[k]).length > 0 && (
            <div className="mt-2 text-sm text-brand-600 dark:text-brand-400">
              {Object.keys(selectedTasks).filter(k => selectedTasks[k]).length} tugas dipilih
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">Memuat tugas mingguan...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada tugas mingguan tersedia. Silakan atur goal mingguan terlebih dahulu.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupByGoalSlot(tasks)).map(([slot, slotTasks]) => (
              <div key={slot} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">
                  Goal Mingguan {slot}
                </h3>
                <div className="space-y-2">
                  {slotTasks.map((task) => (
                    <div key={task.id} className={`flex items-center space-x-3 p-3 rounded-lg ${selectedTasks[task.id] ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <input
                        type="checkbox"
                        id={task.id}
                        checked={!!selectedTasks[task.id]}
                        onChange={() => onTaskToggle(task.id)}
                        className="w-4 h-4 text-brand-500 bg-gray-100 border-gray-300 rounded focus:ring-brand-500 focus:ring-2"
                      />
                      <label htmlFor={task.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {task.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {task.quest_title} • {task.type}
                        </div>
                      </label>
                      {selectedTasks[task.id] && (
                        <div className="text-xs bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-full">
                          Dalam Rencana
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={isLoading || Object.keys(selectedTasks).filter(k => selectedTasks[k]).length === 0}
            className="px-6 py-2 bg-brand-500 text-white rounded-md font-medium hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Menyimpan...' : `Update Rencana (${Object.keys(selectedTasks).filter(k => selectedTasks[k]).length} tugas)`}
          </button>
        </div>
      </div>
    </div>
  );
};

const DailySyncClient: React.FC<DailySyncClientProps> = ({ year, weekNumber, selectedDate, onSetActiveTask }) => {
  const [dailyPlan, setDailyPlanState] = useState<DailyPlan | null>(null);
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskItem[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  const [, startTransition] = useTransition();

  // Load daily plan setiap kali selectedDate berubah
  useEffect(() => {
    const loadDailyPlan = async () => {
      setLoading(true);
          try {
      const plan = await getDailyPlan(selectedDate);
      setDailyPlanState(plan);
    } catch (err) {
      // It's okay if no plan exists yet
      console.log('No daily plan found for date:', selectedDate, err);
    } finally {
        setLoading(false);
      }
    };
    loadDailyPlan();
  }, [selectedDate]);

  // Helper function to get current daily plan items as initial selections
  const getCurrentDailyPlanSelections = () => {
    if (!dailyPlan?.daily_plan_items) return {};
    
    const selections: Record<string, boolean> = {};
    dailyPlan.daily_plan_items.forEach(item => {
      selections[item.item_id] = true;
    });
    return selections;
  };

  // Load weekly tasks saat modal dibuka
  const handleOpenModal = async () => {
    setShowModal(true);
    setModalLoading(true);
    
    // Initialize with current daily plan selections
    const currentSelections = getCurrentDailyPlanSelections();
    setSelectedTasks(currentSelections);
    
    try {
      const tasks = await getTasksForWeek(year, weekNumber);
      setWeeklyTasks(tasks);
    } catch (err) {
      console.error('Error loading weekly tasks:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSaveSelection = async () => {
    const selectedItems = Object.entries(selectedTasks)
      .filter(([, selected]) => selected)
      .map(([taskId]) => {
        const task = weeklyTasks.find(t => t.id === taskId);
        return {
          item_id: taskId,
          item_type: task?.type || 'TASK'
        };
      });
    if (selectedItems.length === 0) return;
    startTransition(async () => {
      try {
        await setDailyPlan(selectedDate, selectedItems);
        // Reload daily plan
        const plan = await getDailyPlan(selectedDate);
        setDailyPlanState(plan);
        setShowModal(false);
      } catch (err) {
        console.error('Error saving daily plan:', err);
      }
    });
  };

  const handleStatusChange = async (itemId: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    startTransition(async () => {
      try {
        await updateDailyPlanItemStatus(itemId, status);
        if (dailyPlan) {
          setDailyPlanState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              daily_plan_items: prev.daily_plan_items?.map(item =>
                item.item_id === itemId ? { ...item, status } : item
              )
            };
          });
        }
      } catch (err) {
        console.error('Error updating task status:', err);
      }
    });
  };

  const handleAddSideQuest = async (title: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('date', selectedDate);
        await addSideQuest(formData);
        const plan = await getDailyPlan(selectedDate);
        setDailyPlanState(plan);
      } catch (err) {
        console.error('Error adding side quest:', err);
      }
    });
  };



  // Group daily plan items by type
  const groupItemsByType = (items: DailyPlanItem[] = []) => {
    const groups = {
      'MAIN_QUEST': [] as DailyPlanItem[],
      'WORK': [] as DailyPlanItem[],
      'SIDE_QUEST': [] as DailyPlanItem[]
    };
    items.forEach(item => {
      if (item.item_type === 'QUEST' || item.item_type === 'TASK' || item.item_type === 'SUBTASK') {
        groups['MAIN_QUEST'].push(item);
      } else if (item.item_type === 'MILESTONE') {
        groups['WORK'].push(item);
      } else if (item.item_type === 'SIDE_QUEST') {
        groups['SIDE_QUEST'].push(item);
      }
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-lg">Memuat rencana harian...</div>
      </div>
    );
  }

  const groupedItems = groupItemsByType(dailyPlan?.daily_plan_items);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Daily Sync
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {new Date(selectedDate).toLocaleDateString('id-ID', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
      {/* Multi-column task board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn
          title="Main Quest"
          items={groupedItems['MAIN_QUEST']}
          onStatusChange={handleStatusChange}
          onSelectTasks={handleOpenModal}
          onSetActiveTask={onSetActiveTask}
        />
        <TaskColumn
          title="AW Quest"
          items={groupedItems['WORK']}
          onStatusChange={handleStatusChange}
          onSetActiveTask={onSetActiveTask}
        />
        <TaskColumn
          title="Side Quest"
          items={groupedItems['SIDE_QUEST']}
          onStatusChange={handleStatusChange}
          onAddSideQuest={handleAddSideQuest}
          onSetActiveTask={onSetActiveTask}
        />
      </div>
      {/* Additional tools section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Brain Dump</h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            [Brain Dump Placeholder]
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-gray-100">Log Aktivitas</h3>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            [Log Aktivitas Placeholder]
          </div>
        </div>
      </div>
      {/* Task Selection Modal */}
      <TaskSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        tasks={weeklyTasks}
        selectedTasks={selectedTasks}
        onTaskToggle={handleTaskToggle}
        onSave={handleSaveSelection}
        isLoading={modalLoading}
      />
    </div>
  );
};

export default DailySyncClient; 