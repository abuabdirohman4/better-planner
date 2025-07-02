import TaskItem from './TaskItem';
import Button from '@/components/ui/button/Button';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';
import { useState, useEffect, useMemo } from 'react';
import { updateMilestone } from '../quests/actions';
import debounce from 'lodash/debounce';
import TaskDetailCard from './TaskDetailCard';

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
  const [saved, setSaved] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState(['', '', '']);
  const [newTaskLoading, setNewTaskLoading] = useState([false, false, false]);
  const [lastSubmittedTask, setLastSubmittedTask] = useState(['', '', '']);

  // Debounced auto-save
  const debouncedSaveMilestone = useMemo(() => debounce(async (val: string) => {
    setEditLoading(true);
    try {
      await updateMilestone(milestone.id, val);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {}
    setEditLoading(false);
  }, 1500), [milestone.id]);

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

  // Debounce submit task utama berbasis useEffect per slot (3 useEffect terpisah)
  useEffect(() => {
    const val = newTaskInputs[0];
    if (!val || val === lastSubmittedTask[0]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 0 ? true : v));
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone_id: milestone.id, title: val })
        });
        const data = await res.json();
        if (res.ok) {
          fetchTasks();
          setNewTaskInputs(inputs => inputs.map((v, i) => i === 0 ? '' : v));
          setLastSubmittedTask(vals => vals.map((v, i) => i === 0 ? val : v));
        }
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 0 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[0], milestone.id]);

  useEffect(() => {
    const val = newTaskInputs[1];
    if (!val || val === lastSubmittedTask[1]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 1 ? true : v));
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone_id: milestone.id, title: val })
        });
        const data = await res.json();
        if (res.ok) {
          fetchTasks();
          setNewTaskInputs(inputs => inputs.map((v, i) => i === 1 ? '' : v));
          setLastSubmittedTask(vals => vals.map((v, i) => i === 1 ? val : v));
        }
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 1 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[1], milestone.id]);

  useEffect(() => {
    const val = newTaskInputs[2];
    if (!val || val === lastSubmittedTask[2]) return;
    const handler = setTimeout(async () => {
      setNewTaskLoading(l => l.map((v, i) => i === 2 ? true : v));
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestone_id: milestone.id, title: val })
        });
        const data = await res.json();
        if (res.ok) {
          fetchTasks();
          setNewTaskInputs(inputs => inputs.map((v, i) => i === 2 ? '' : v));
          setLastSubmittedTask(vals => vals.map((v, i) => i === 2 ? val : v));
        }
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 2 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[2], milestone.id]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    debouncedSaveMilestone(e.target.value);
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

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
      {activeTask ? (
        <TaskDetailCard task={activeTask} onBack={() => setActiveTask(null)} milestoneTitle={milestone.title} milestoneId={milestone.id} />
      ) : (
        <>
          <div className="font-semibold mb-2 flex items-center gap-2">
            {isEditing ? (
              <>
                <input
                  className="border rounded px-2 py-1 text-sm mr-2 bg-transparent font-semibold"
                  value={editValue}
                  onChange={handleEditChange}
                  disabled={editLoading}
                  style={{ minWidth: 120 }}
                />
                {saved && <span className="text-xs text-green-500 ml-1">Tersimpan</span>}
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
                  return (
                    <TaskItem
                      key={task.id}
                      task={task}
                      milestoneId={milestone.id}
                      disableModal
                      onOpenSubtask={() => setActiveTask(task)}
                    />
                  );
                } else {
                  return (
                    <input
                      key={idx}
                      className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                      placeholder="Tambah tugas utama..."
                      value={newTaskInputs[idx]}
                      onChange={e => {
                        const val = e.target.value;
                        setNewTaskInputs(inputs => inputs.map((v, i) => i === idx ? val : v));
                      }}
                      disabled={newTaskLoading[idx]}
                    />
                  );
                }
              })
            )}
          </div>
        </>
      )}
    </div>
  );
} 