import { useEffect, useState, useMemo } from 'react';
import InputField from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import { updateTask } from '../quests/actions';
import debounce from 'lodash/debounce';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

export default function TaskDetailCard({ task, onBack, milestoneTitle, milestoneId }: { task: { id: string; title: string; status: 'TODO' | 'DONE' }; onBack: () => void; milestoneTitle: string; milestoneId: string }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);
  const [editSubtaskId, setEditSubtaskId] = useState<string | null>(null);
  const [editSubtaskValue, setEditSubtaskValue] = useState('');
  const [editSubtaskLoading, setEditSubtaskLoading] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const fetchSubtasks = async () => {
    setLoadingSubtasks(true);
    try {
      const res = await fetch(`/api/tasks?parent_task_id=${task.id}`);
      const data = await res.json();
      setSubtasks(data.tasks || []);
    } finally {
      setLoadingSubtasks(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [task.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: task.id, title: input, milestone_id: milestoneId })
      });
      const data = await res.json();
      if (res.ok) {
        setInput('');
        fetchSubtasks();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Sub-tugas berhasil ditambahkan');
      } else {
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal menambah sub-tugas');
      }
    } catch {
      CustomToast.error('Gagal menambah sub-tugas');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async (subtask: Subtask) => {
    try {
      const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
      const res = await fetch(`/api/tasks/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: subtask.id, newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSubtasks();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Status sub-tugas diupdate');
      } else {
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal update status');
      }
    } catch {
      CustomToast.error('Gagal update status');
    }
  };

  // Inline edit subtask
  const debouncedSaveSubtask = useMemo(() => debounce(async (id: string, val: string) => {
    setEditSubtaskLoading(true);
    try {
      await updateTask(id, val);
      setSaved(id);
      setTimeout(() => setSaved(null), 1200);
      fetchSubtasks();
    } catch {}
    setEditSubtaskLoading(false);
  }, 1500), []);

  const handleEditSubtaskChange = (id: string, val: string) => {
    setEditSubtaskId(id);
    setEditSubtaskValue(val);
    debouncedSaveSubtask(id, val);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-3 text-xs text-brand-500 underline">&larr; Kembali</button>
        <div className="font-bold text-lg">{task.title}</div>
      </div>
      <div className="mb-2 text-xs text-gray-400">Milestone: {milestoneTitle}</div>
      <div className="mb-4">
        <div className="font-semibold mb-2">Sub-tugas</div>
        {loadingSubtasks ? (
          <p className="text-gray-400 text-sm">Memuat sub-tugas...</p>
        ) : subtasks.length > 0 ? (
          subtasks.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2 mb-1">
              <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
              <input
                className={`border rounded px-2 py-1 text-sm flex-1 ${subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}`}
                value={editSubtaskId === subtask.id ? editSubtaskValue : subtask.title}
                onChange={e => handleEditSubtaskChange(subtask.id, e.target.value)}
                onFocus={() => { setEditSubtaskId(subtask.id); setEditSubtaskValue(subtask.title); }}
                disabled={editSubtaskLoading}
              />
              {saved === subtask.id && <span className="text-xs text-green-500 ml-1">Tersimpan</span>}
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">Belum ada sub-tugas.</p>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <InputField
            name="title"
            placeholder="Tambah sub-tugas baru..."
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
    </div>
  );
} 