"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
// import Checkbox from '@/components/form/input/Checkbox';
import { updateTask } from '../quests/actions';
import debounce from 'lodash/debounce';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
  onOpenSubtask?: () => void;
  orderNumber?: number;
  active?: boolean;
}

export default function TaskItem({ task, onOpenSubtask, orderNumber, active }: TaskItemProps) {
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; status: 'TODO' | 'DONE' }[]>([]);
  const [editValue, setEditValue] = useState(task.title);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const debouncedSaveTask = useMemo(() =>
    debounce(async (val: string) => {
      try {
        await updateTask(task.id, val);
        fetchSubtasks();
      } catch {}
      if (editInputRef.current) {
        editInputRef.current.focus();
      }
    }, 1500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [task.id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    debouncedSaveTask(e.target.value);
  };

  const fetchSubtasks = () => {
    fetch(`/api/tasks?parent_task_id=${task.id}`)
      .then(res => res.json())
      .then(data => {
        setSubtasks(data.tasks || []);
      })
      .catch(() => {
        setSubtasks([]);
      });
  };

  useEffect(() => {
    fetchSubtasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  // const completed = subtasks.filter(st => st.status === 'DONE').length;
  // const total = subtasks.length;

  return (
    <div className={`flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg mb-3 pl-2 pr-4 py-2 shadow-sm border transition ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className='flex gap-2 w-full'>
        {orderNumber && (
          <span className="font-medium text-lg w-6 text-center select-none">{orderNumber}.</span>
        )}
        <input
          className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 font-medium focus:outline-none focus:ring-0"
          value={editValue}
          onChange={handleEditChange}
          ref={editInputRef}
        />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onOpenSubtask} className="text-xs border px-2 py-1.5 ml-3 rounded-lg whitespace-nowrap min-w-[90px] bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300">
          {subtasks.length > 0 ? 'See Details' : 'Add Detail'}
        </button>
        {/* {(!loading && subtasks.length > 0) && (
          <span className="text-xs text-gray-500 ml-1 whitespace-nowrap">
            {`${subtasks.filter(st => st.status === 'DONE').length}/${subtasks.length} (${Math.round((subtasks.filter(st => st.status === 'DONE').length / subtasks.length) * 100)}%)`}
          </span>
        )} */}
      </div>
    </div>
  );
} 