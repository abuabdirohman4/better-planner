"use client";
import { useState, useEffect } from 'react';
// import Checkbox from '@/components/form/input/Checkbox';
// import CustomToast from '@/components/ui/toast/CustomToast';
import SubtaskModal from './SubtaskModal';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
  milestoneId?: string;
}

export default function TaskItem({ task, milestoneId }: TaskItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; status: 'TODO' | 'DONE' }[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/10 transition" onClick={() => setIsModalOpen(true)}>
      <div>
        <div className="font-medium text-gray-800 dark:text-white/90">{task.title}</div>
        <div className="text-xs text-gray-500 mt-1">{loading ? 'Memuat progres...' : `${completed}/${total} Selesai`}</div>
      </div>
      <SubtaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} parentTaskId={task.id} milestoneId={milestoneId} onSubtasksChanged={handleSubtasksChanged} />
    </div>
  );
} 