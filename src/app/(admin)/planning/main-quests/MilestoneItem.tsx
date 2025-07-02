import TaskItem from './TaskItem';
import { useState, useEffect } from 'react';
import TaskDetailCard from './TaskDetailCard';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  parent_task_id?: string | null;
}

interface MilestoneItemProps {
  milestone: { id: string; title: string };
  milestoneNumber: number;
  onOpenSubtask?: (task: Task) => void;
}

export default function MilestoneItem({ milestone, milestoneNumber, onOpenSubtask }: MilestoneItemProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskInputs, setNewTaskInputs] = useState(['', '', '']);
  const [newTaskLoading, setNewTaskLoading] = useState([false, false, false]);
  const [lastSubmittedTask, setLastSubmittedTask] = useState(['', '', '']);
  // const [activeSubTask, setActiveSubTask] = useState(false);
  const [activeSubTask, setActiveSubTask] = useState<Task | null>(null);;

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
        await res.json();
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 0 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 0 ? val : v));
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
        await res.json();
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 1 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 1 ? val : v));
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
        await res.json();
        fetchTasks();
        setNewTaskInputs(inputs => inputs.map((v, i) => i === 2 ? '' : v));
        setLastSubmittedTask(vals => vals.map((v, i) => i === 2 ? val : v));
      } finally {
        setNewTaskLoading(l => l.map((v, i) => i === 2 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTaskInputs[2], milestone.id]);

  useEffect(() => {
    fetchTasks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone.id]);

  return (
    <div className="rounded-lg mb-2">
      {activeTask ? (
        <TaskDetailCard task={activeTask} onBack={() => setActiveTask(null)} milestoneTitle={milestone.title} milestoneId={milestone.id} />
      ) : (
        <>
          <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone {milestoneNumber} :</label>
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
                      onOpenSubtask={onOpenSubtask ? () => {onOpenSubtask(task); setActiveSubTask(task)} : undefined}
                      active={activeSubTask?.id === task.id}
                      orderNumber={idx + 1}
                    />
                  );
                } else {
                  return (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg pl-2 pr-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 transition">
                      <div className='flex gap-2 w-3/4'>
                        <span className="font-medium text-lg w-6 text-center select-none">{idx + 1}.</span>
                        <input
                          key={idx}
                          className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900"
                          placeholder="Tambah langkah untuk milestone..."
                          value={newTaskInputs[idx]}
                          onChange={e => {
                            const val = e.target.value;
                            setNewTaskInputs(inputs => inputs.map((v, i) => i === idx ? val : v));
                          }}
                          disabled={newTaskLoading[idx]}
                          />
                      </div>
                    </div>
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