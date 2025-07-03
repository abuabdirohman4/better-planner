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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskLoading, setNewSubtaskLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const editInputRef = useRef<HTMLInputElement | null>(null);
  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

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

  // Saat Enter ditekan pada subtask, insert subtask kosong ke database dengan fractional indexing
  const handleSubtaskEnter = async (idx: number) => {
    // 1. Hitung display_order baru (fractional indexing)
    let prevOrder = 0;
    let nextOrder: number | undefined = undefined;
    let newOrder = 1.0;
    if (subtasks.length === 0) {
      newOrder = 1.0;
    } else {
      prevOrder = subtasks[idx]?.display_order ?? 0;
      nextOrder = subtasks[idx + 1]?.display_order;
      if (nextOrder !== undefined) {
        newOrder = (prevOrder + nextOrder) / 2;
      } else {
        newOrder = prevOrder + 1.0;
      }
    }
    // 2. Buat sub-task palsu (optimistic)
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const optimisticSubtask: Subtask = {
      id: tempId,
      title: '',
      status: 'TODO',
      display_order: newOrder,
    };
    setSubtasks(prev => {
      const arr = [...prev];
      arr.splice(idx + 1, 0, optimisticSubtask);
      return arr;
    });
    setFocusSubtaskId(tempId);
    // 4. Panggil server action di background
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_task_id: task.id, title: '', milestone_id: milestoneId, display_order: newOrder })
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setSubtasks(prev => prev.map(st => st.id === tempId ? data.task : st));
        setFocusSubtaskId(data.task.id);
      } else if (res.ok && data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        setSubtasks(prev => prev.map(st => st.id === tempId ? data.tasks[0] : st));
        setFocusSubtaskId(data.tasks[0].id);
      } else {
        setSubtasks(prev => prev.filter(st => st.id !== tempId));
        setFocusSubtaskId(null);
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal membuat tugas baru. Coba lagi.');
      }
    } catch {
      setSubtasks(prev => prev.filter(st => st.id !== tempId));
      setFocusSubtaskId(null);
      CustomToast.error('Gagal membuat tugas baru. Coba lagi.');
    }
  };

  const handleCheck = async (subtask: Subtask) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    // Optimistic update
    setSubtasks(prev => prev.map(st => st.id === subtask.id ? { ...st, status: newStatus } : st));
    try {
      const res = await fetch(`/api/tasks/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: subtask.id, newStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback jika gagal
        setSubtasks(prev => prev.map(st => st.id === subtask.id ? { ...st, status: subtask.status } : st));
        CustomToast.error(typeof data.error === 'string' ? data.error : 'Gagal update status');
      }
    } catch {
      setSubtasks(prev => prev.map(st => st.id === subtask.id ? { ...st, status: subtask.status } : st));
      CustomToast.error('Gagal update status');
    }
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

  // Fokus ke input baru setelah insert atau update id
  useEffect(() => {
    if (focusSubtaskId) {
      const idx = subtasks.findIndex(st => st.id === focusSubtaskId);
      if (idx !== -1 && inputRefs.current[idx]) {
        inputRefs.current[idx]?.focus();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSubtaskId, subtasks.length, inputRefs.current]);

  // Pastikan fokus tetap di input yang sedang diedit setelah update
  useEffect(() => {
    if (!editSubtaskId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editSubtaskId]);

  // Efek: Jika ada subtask baru (title kosong) yang id-nya berubah dari tempId ke id server, update focusSubtaskId ke id server
  useEffect(() => {
    const focused = subtasks.find(st => st.title === '' && st.id !== focusSubtaskId);
    if (focused && focusSubtaskId && !subtasks.some(st => st.id === focusSubtaskId)) {
      setFocusSubtaskId(focused.id);
    }
  }, [subtasks, focusSubtaskId]);

  // Debounced update ke server
  const debouncedUpdateTask = useMemo(() => debounce(async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks(subtasks => subtasks.map(st => st.id === id ? { ...st, title: val } : st));
    } catch {}
  }, 1000), []);

  // Update langsung ke server (tanpa debounce)
  const updateTaskImmediate = async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks(subtasks => subtasks.map(st => st.id === id ? { ...st, title: val } : st));
    } catch {}
  };

  // Saat id temp diganti id server, transfer draftTitle
  useEffect(() => {
    // Cari subtask dengan title kosong yang id-nya bukan focusSubtaskId, dan focusSubtaskId tidak ada di subtasks
    const focused = subtasks.find(st => st.title === '' && st.id !== focusSubtaskId);
    if (focused && focusSubtaskId && !subtasks.some(st => st.id === focusSubtaskId)) {
      setFocusSubtaskId(focused.id);
      setDraftTitles(draft => {
        const newDraft = { ...draft };
        if (draft[focusSubtaskId]) {
          newDraft[focused.id] = draft[focusSubtaskId];
          delete newDraft[focusSubtaskId];
        }
        return newDraft;
      });
    }
  }, [subtasks, focusSubtaskId]);

  // Handler perubahan draft title
  const handleDraftTitleChange = (id: string, val: string, immediate = false) => {
    setDraftTitles(draft => ({ ...draft, [id]: val }));
    if (immediate) {
      updateTaskImmediate(id, val);
    } else {
      debouncedUpdateTask(id, val);
    }
  };

  // Handler hapus subtask
  const handleDeleteSubtask = async (id: string, idx: number) => {
    // Optimistic remove
    setSubtasks(prev => prev.filter(st => st.id !== id));
    setDraftTitles(draft => {
      const newDraft = { ...draft };
      delete newDraft[id];
      return newDraft;
    });
    // Pindahkan fokus ke input sebelumnya jika ada
    if (idx > 0) {
      setFocusSubtaskId(subtasks[idx - 1].id);
    } else {
      setFocusSubtaskId(null);
    }
    // Hapus di server jika id bukan temp
    if (!id.match(/^\d+$/) && id.length < 24) return; // skip temp id (uuid pendek)
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    } catch {}
  };

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
              <SubtaskInput
                key={subtask.id}
                subtask={subtask}
                idx={idx}
                setEditSubtaskId={setEditSubtaskId}
                setFocusSubtaskId={setFocusSubtaskId}
                handleSubtaskEnter={handleSubtaskEnter}
                handleCheck={handleCheck}
                shouldFocus={focusSubtaskId === subtask.id}
                clearFocusSubtaskId={() => setFocusSubtaskId(null)}
                draftTitle={draftTitles[subtask.id] ?? subtask.title ?? ''}
                onDraftTitleChange={(val, immediate) => handleDraftTitleChange(subtask.id, val, immediate)}
                subtaskIds={subtasks.map(st => st.id)}
                handleDeleteSubtask={handleDeleteSubtask}
              />
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

// Komponen inline untuk granular state per subtask
interface SubtaskInputProps {
  subtask: Subtask;
  idx: number;
  setEditSubtaskId: (id: string) => void;
  setFocusSubtaskId: (id: string) => void;
  handleSubtaskEnter: (idx: number) => void;
  handleCheck: (subtask: Subtask) => void;
  shouldFocus: boolean;
  clearFocusSubtaskId: () => void;
  draftTitle: string;
  onDraftTitleChange: (val: string, immediate?: boolean) => void;
  subtaskIds: string[];
  handleDeleteSubtask: (id: string, idx: number) => void;
}
function SubtaskInput({ subtask, idx, setEditSubtaskId, setFocusSubtaskId, handleSubtaskEnter, handleCheck, shouldFocus, clearFocusSubtaskId, draftTitle, onDraftTitleChange, subtaskIds, handleDeleteSubtask }: SubtaskInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);
  return (
    <div className="flex items-center gap-2 mb-1">
      <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
      <input
        className={`border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-0 ${subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}`}
        value={draftTitle}
        onChange={e => onDraftTitleChange(e.target.value)}
        onFocus={() => {
          setEditSubtaskId(subtask.id);
          setFocusSubtaskId(subtask.id);
        }}
        onBlur={e => {
          const next = e.relatedTarget as HTMLElement | null;
          onDraftTitleChange(e.target.value, true); // update langsung ke server saat blur
          if (!next || next.tagName !== 'INPUT') {
            clearFocusSubtaskId();
          } else {
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            // Cmd+Enter (Mac) atau Ctrl+Enter (non-Mac) untuk checklist/unchecklist
            e.preventDefault();
            handleCheck(subtask);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            onDraftTitleChange(e.currentTarget.value, true); // update langsung ke server saat Enter
            handleSubtaskEnter(idx);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (idx > 0) {
              setFocusSubtaskId(subtaskIds[idx - 1]);
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (idx < subtaskIds.length - 1) {
              setFocusSubtaskId(subtaskIds[idx + 1]);
            }
          } else if ((e.key === 'Backspace' || e.key === 'Delete') && draftTitle === '') {
            e.preventDefault();
            handleDeleteSubtask(subtask.id, idx);
          }
        }}
        ref={inputRef}
      />
    </div>
  );
} 