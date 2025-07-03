import { useEffect, useState, useMemo, useRef } from 'react';
import InputField from '@/components/form/input/InputField';
import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import { updateTask } from '../quests/actions';
import debounce from 'lodash/debounce';
import { CloseLineIcon } from '@/icons';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

export default function TaskDetailCard({ task, onBack, milestoneId }: { task: { id: string; title: string; status: 'TODO' | 'DONE' }; onBack: () => void; milestoneId: string }) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);
  const [editSubtaskId, setEditSubtaskId] = useState<string | null>(null);
  const [editSubtaskValue, setEditSubtaskValue] = useState('');
  const [editSubtaskLoading, setEditSubtaskLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskLoading, setNewSubtaskLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement | null>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  // Saat Enter ditekan pada subtask, insert subtask kosong ke database
  const handleSubtaskEnter = async (idx: number) => {
    // Hitung display_order float baru
    const prevOrder = subtasks[idx]?.display_order ?? 0;
    const nextOrder = subtasks[idx + 1]?.display_order;
    let newOrder = 0;
    if (nextOrder !== undefined) {
      newOrder = (prevOrder + nextOrder) / 2;
    } else {
      newOrder = prevOrder + 100;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: task.id, title: '', milestone_id: milestoneId, display_order: newOrder })
      });
      const data = await res.json();
      if (res.ok) {
        setFocusIdx(idx + 1); // Fokus ke input baru setelah fetch
        fetchSubtasks();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Sub-tugas berhasil ditambahkan');
      } else {
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal menambah sub-tugas');
      }
    } catch {
      CustomToast.error('Gagal menambah sub-tugas');
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
      // Update state lokal agar hasil edit langsung muncul
      setSubtasks(subtasks => subtasks.map(st => st.id === id ? { ...st, title: val } : st));
    } catch {
      // Tidak perlu toast, biarkan hasil edit langsung muncul
    }
    setEditSubtaskLoading(false);
    // Fokuskan kembali ke input yang sedang diedit
    if (editInputRef.current) {
      editInputRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, 1500), []);

  const handleEditSubtaskChange = (id: string, val: string) => {
    setEditSubtaskId(id);
    setEditSubtaskValue(val);
    debouncedSaveSubtask(id, val);
  };

  // Debounce insert subtask baru
  const debouncedInsertNewSubtask = useMemo(() => debounce(async (title: string) => {
    if (!title) return;
    setNewSubtaskLoading(true);
    // Workflowy-style: display_order = display_order terbesar + 100 (atau 1)
    const lastOrder = subtasks.length > 0 ? subtasks[subtasks.length - 1].display_order : 0;
    const newOrder = lastOrder + 100;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: task.id, title, milestone_id: milestoneId, display_order: newOrder })
      });
      const data = await res.json();
      if (res.ok) {
        setNewSubtaskTitle('');
        fetchSubtasks();
        CustomToast.success(typeof data.message === 'string' ? data.message : 'Sub-tugas berhasil ditambahkan');
      } else {
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal menambah sub-tugas');
      }
    } catch {
      CustomToast.error('Gagal menambah sub-tugas');
    } finally {
      setNewSubtaskLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, 500), [task.id, milestoneId, subtasks]);

  // Trigger debounce saat newSubtaskTitle berubah
  useEffect(() => {
    if (newSubtaskTitle) debouncedInsertNewSubtask(newSubtaskTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSubtaskTitle]);

  // Fokus ke input baru setelah insert
  useEffect(() => {
    if (focusIdx !== null && !loadingSubtasks) {
      inputRefs.current[focusIdx]?.focus();
      setFocusIdx(null);
    }
  }, [focusIdx, loadingSubtasks, subtasks.length]);

  // Pastikan fokus tetap di input yang sedang diedit setelah update
  useEffect(() => {
    if (!editSubtaskLoading && editSubtaskId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editSubtaskLoading, editSubtaskId]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="relative flex items-center mb-4 min-h-[40px]">
        <button
          onClick={onBack}
          className="absolute right-0 p-1 rounded-full border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Tutup"
        >
          <CloseLineIcon className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 flex justify-center">
          <div className="font-bold text-lg text-center">{task.title}</div>
        </div>
      </div>
      <div className="mb-4">
        <div className="font-semibold mb-2">List quest untuk langkah ini:</div>
        {loadingSubtasks ? (
          <p className="text-gray-400 text-sm">Memuat sub-tugas...</p>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {subtasks.map((subtask, idx) => (
              <div key={subtask.id} className="flex items-center gap-2 mb-1">
                <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
                <input
                  className={`border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-0 ${subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}`}
                  value={editSubtaskId === subtask.id ? editSubtaskValue : subtask.title}
                  onChange={e => handleEditSubtaskChange(subtask.id, e.target.value)}
                  onFocus={() => { setEditSubtaskId(subtask.id); setEditSubtaskValue(subtask.title); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubtaskEnter(idx);
                    }
                  }}
                  disabled={editSubtaskLoading}
                  ref={el => {
                    inputRefs.current[idx] = el;
                    if (editSubtaskId === subtask.id) {
                      editInputRef.current = el;
                    }
                  }}
                />
              </div>
            ))}
            {subtasks.length === 0 && (
              <InputField
                key="input-0"
                name="title-0"
                placeholder="Tambah sub-tugas baru..."
                className="flex-1"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                disabled={newSubtaskLoading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 