"use client";
import { useTransition, useState } from "react";
import Checkbox from '@/components/form/input/Checkbox';
import { updateTaskStatus } from '../quests/actions';
import CustomToast from '@/components/ui/toast/CustomToast';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(task.status === 'DONE');

  const handleChange = () => {
    const newStatus = checked ? 'TODO' : 'DONE';
    setChecked(!checked);
    startTransition(async () => {
      try {
        await updateTaskStatus(task.id, newStatus);
        CustomToast.success('Status task berhasil diupdate!');
      } catch (err: any) {
        CustomToast.error(err.message || 'Gagal update status task');
        setChecked(checked); // rollback jika gagal
      }
    });
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Checkbox checked={checked} onChange={handleChange} disabled={isPending} />
      <span className={checked ? 'line-through text-gray-400' : ''}>{task.title}</span>
    </label>
  );
} 