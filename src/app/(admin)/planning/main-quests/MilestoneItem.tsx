import TaskItem from './TaskItem';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useState, useEffect } from 'react';

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

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
      <div className="font-semibold mb-2">{milestone.title}</div>
      <div className="space-y-2 mb-2">
        {loadingTasks ? (
          <p className="text-gray-400 text-sm">Memuat tugas utama...</p>
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} milestoneId={milestone.id} />
          ))
        ) : (
          <p className="text-gray-400 text-sm">Belum ada tugas utama.</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
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