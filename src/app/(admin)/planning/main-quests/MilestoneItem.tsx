import TaskItem from './TaskItem';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useState, useEffect } from 'react';
import { updateMilestone } from '../quests/actions';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  parent_task_id?: string | null;
}

interface MilestoneItemProps {
  milestone: { id: string; title: string };
}

export default function MilestoneItem({ milestone }: MilestoneItemProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(milestone.title);
  const [editLoading, setEditLoading] = useState(false);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/tasks?milestone_id=${milestone.id}`);
      const data = await res.json();
      setTasks((data.tasks || []).filter((t: Task) => !t.parent_task_id)); // hanya tugas utama
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestone_id: milestone.id, title: input })
      });
      const data = await res.json();
      if (res.ok) {
        setInput('');
        fetchTasks();
        CustomToast.success(data.message || 'Tugas utama berhasil ditambahkan');
      } else {
        CustomToast.error(data.error || 'Gagal menambah tugas utama');
      }
    } catch {
      CustomToast.error('Gagal menambah tugas utama');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(milestone.title);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(milestone.title);
  };

  const handleEditSave = async () => {
    if (!editValue.trim()) return;
    setEditLoading(true);
    try {
      await updateMilestone(milestone.id, editValue);
      setIsEditing(false);
      setEditValue(editValue);
      fetchTasks();
      CustomToast.success('Milestone berhasil diupdate');
    } catch (e) {
      CustomToast.error('Gagal update milestone');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
      <div className="font-semibold mb-2 flex items-center gap-2">
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
            <span>{milestone.title}</span>
            <button onClick={handleEdit} className="ml-2 text-xs text-brand-500 underline">Edit</button>
          </>
        )}
      </div>
      <div className="space-y-2 mb-2">
        {loadingTasks ? (
          <p className="text-gray-400 text-sm">Memuat tugas utama...</p>
        ) : (
          Array.from({ length: 3 }).map((_, idx) => {
            const task = tasks[idx];
            if (task) {
              return <TaskItem key={task.id} task={task} milestoneId={milestone.id} />;
            } else {
              return (
                <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center min-h-[48px]">
                  <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <InputField
                      name="title"
                      placeholder="Tambah tugas utama..."
                      required
                      className="flex-1"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      disabled={loading}
                    />
                    <Button type="submit" size="sm" variant="primary" disabled={loading}>
                      {loading ? 'Menambah...' : 'Tambah'}
                    </Button>
                  </form>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
} 