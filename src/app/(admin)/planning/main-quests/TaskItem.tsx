"use client";
import { useState, useEffect } from 'react';
// import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import SubtaskModal from './SubtaskModal';
import { updateTask } from '../quests/actions';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
  milestoneId?: string;
}

export default function TaskItem({ task, milestoneId }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; status: 'TODO' | 'DONE' }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [editLoading, setEditLoading] = useState(false);

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

  const handleEditSave = async () => {
    if (!editValue.trim()) return;
    setEditLoading(true);
    try {
      await updateTask(task.id, editValue);
      setIsEditing(false);
      setEditValue(editValue);
      handleSubtasksChanged(); // refresh subtasks & progress
      CustomToast.success('Task berhasil diupdate');
    } catch (e) {
      CustomToast.error('Gagal update task');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/10 transition" onClick={() => setIsModalOpen(true)}>
      <div>
        <div className="font-medium text-gray-800 dark:text-white/90 flex items-center gap-2">
          {isEditing ? (
            <>
              <input
                className="border rounded px-2 py-1 text-sm mr-2"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                disabled={editLoading}
                autoFocus
              />
              <button onClick={handleEditSave} disabled={editLoading} className="text-brand-600 font-bold text-xs mr-1">Simpan</button>
              <button onClick={handleEditCancel} disabled={editLoading} className="text-gray-400 text-xs">Batal</button>
            </>
          ) : (
            <>
              <span>{task.title}</span>
              <button onClick={handleEdit} className="ml-2 text-xs text-brand-500 underline">Edit</button>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">{loading ? 'Memuat progres...' : `${completed}/${total} Selesai`}</div>
      </div>
      <SubtaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} parentTaskId={task.id} milestoneId={milestoneId} onSubtasksChanged={handleSubtasksChanged} />
    </div>
  );
} 