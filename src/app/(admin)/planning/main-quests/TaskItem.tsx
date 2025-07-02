"use client";
import { useState, useEffect, useMemo } from 'react';
// import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import SubtaskModal from './SubtaskModal';
import { updateTask } from '../quests/actions';
import debounce from 'lodash/debounce';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
  milestoneId?: string;
  disableModal?: boolean;
  onOpenSubtask?: () => void;
}

export default function TaskItem({ task, milestoneId, disableModal, onOpenSubtask }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; status: 'TODO' | 'DONE' }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [editLoading, setEditLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Debounced auto-save
  const debouncedSaveTask = useMemo(() => debounce(async (val: string) => {
    setEditLoading(true);
    try {
      await updateTask(task.id, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      handleSubtasksChanged();
    } catch {}
    setEditLoading(false);
  }, 1500), [task.id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    debouncedSaveTask(e.target.value);
  };

  const fetchSubtasks = () => {
    setLoading(true);
    fetch(`/api/tasks?parent_task_id=${task.id}`)
      .then(res => res.json())
      .then(data => {
        setSubtasks(data.tasks || []);
        setLoading(false);
      })
      .catch(() => {
        setSubtasks([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSubtasks();
  }, [task.id]);

  const handleSubtasksChanged = () => {
    fetchSubtasks();
  };

  const completed = subtasks.filter(st => st.status === 'DONE').length;
  const total = subtasks.length;

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(task.title);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(task.title);
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 transition">
      <div>
        <div className="font-medium text-gray-800 dark:text-white/90 flex items-center gap-2">
          <input
            className="border rounded px-2 py-1 text-sm mr-2 bg-transparent font-medium"
            value={editValue}
            onChange={handleEditChange}
            disabled={editLoading}
            style={{ minWidth: 120 }}
          />
          {saved && <span className="text-xs text-green-500 ml-1">Tersimpan</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">{loading ? 'Memuat progres...' : `${completed}/${total} Selesai`}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onOpenSubtask} className="text-xs text-brand-500 underline px-2 py-1 rounded hover:bg-brand-50">Sub-tugas</button>
        {!disableModal && (
          <SubtaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} parentTaskId={task.id} milestoneId={milestoneId} onSubtasksChanged={handleSubtasksChanged} />
        )}
      </div>
    </div>
  );
} 