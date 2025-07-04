import { useEffect, useState, useMemo, useRef } from 'react';
import InputField from '@/components/form/input/InputField';
import Checkbox from '@/components/form/input/Checkbox';
import CustomToast from '@/components/ui/toast/CustomToast';
import { updateTask } from '../quests/actions';
import debounce from 'lodash/debounce';
import { CloseLineIcon } from '@/icons';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

// Tambahkan SVG hamburger icon
const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-grab text-gray-400 hover:text-gray-600">
    <rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="4" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);

// Komponen SortableItem untuk dnd-kit
type SortableItemProps = {
  subtask: Subtask;
  idx: number;
  setEditSubtaskId: (id: string) => void;
  setFocusSubtaskId: (id: string) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleCheck: (subtask: Subtask) => void;
  shouldFocus: boolean;
  clearFocusSubtaskId: () => void;
  draftTitle: string;
  onDraftTitleChange: (val: string, immediate?: boolean) => void;
  subtaskIds: string[];
  handleDeleteSubtask: (id: string, idx: number) => void;
};
function SortableItem({ subtask, idx, ...props }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 20 : 'auto',
    background: 'inherit',
  };
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 mb-1 bg-white dark:bg-gray-900 w-full`}>
      <span {...attributes} {...listeners} className="flex items-center cursor-grab select-none">
        <HamburgerIcon />
      </span>
      <SubtaskInput
        subtask={subtask}
        idx={idx}
        {...props}
      />
    </div>
  );
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
  const handleSubtaskEnter = async (idx: number, title: string = '') => {
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
      title: title, // Gunakan title yang diberikan atau string kosong
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
        body: JSON.stringify({ parent_task_id: task.id, title: title, milestone_id: milestoneId, display_order: newOrder })
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

  // Handler untuk bulk paste di input kosong
  const handleBulkPasteEmpty = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return; // Bukan multi-line, biarkan default behavior
    
    e.preventDefault();
    
    // Baris pertama set sebagai newSubtaskTitle
    setNewSubtaskTitle(lines[0]);
    
    // Buat sub-task baru untuk baris selanjutnya menggunakan handleSubtaskEnter
    lines.slice(1).forEach((line, lineIndex) => {
      setTimeout(() => {
        handleSubtaskEnter(lineIndex, line);
      }, 100 * (lineIndex + 1));
    });
  };



  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Handler drag end dnd-kit
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = subtasks.findIndex(st => st.id === activeId);
    const newIndex = subtasks.findIndex(st => st.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newSubtasks = arrayMove(subtasks, oldIndex, newIndex);
    // Hitung display_order baru (fractional indexing)
    let newOrder = newSubtasks[newIndex].display_order;
    if (newIndex === 0) {
      newOrder = newSubtasks[1]?.display_order ? newSubtasks[1].display_order - 1 : 1;
    } else if (newIndex === newSubtasks.length - 1) {
      newOrder = newSubtasks[newSubtasks.length - 2]?.display_order + 1;
    } else {
      const prev = newSubtasks[newIndex - 1].display_order;
      const next = newSubtasks[newIndex + 1].display_order;
      newOrder = (prev + next) / 2;
    }
    newSubtasks[newIndex] = { ...newSubtasks[newIndex], display_order: newOrder };
    setSubtasks(newSubtasks);
    try {
      await fetch(`/api/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newSubtasks[newIndex].id, display_order: newOrder })
      });
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={subtasks.map(st => st.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2 mt-2">
                {subtasks.map((subtask, idx) => (
                  <SortableItem
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
                    onDraftTitleChange={(val: string, immediate?: boolean) => handleDraftTitleChange(subtask.id, val, immediate)}
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
                    onPaste={handleBulkPasteEmpty}
                    disabled={newSubtaskLoading}
                  />
                )}
              </div>
            </SortableContext>
          </DndContext>
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
  handleSubtaskEnter: (idx: number, title?: string) => void;
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

  // Handler untuk bulk paste
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return; // Bukan multi-line, biarkan default behavior
    
    e.preventDefault();
    
    // Baris pertama digabung dengan text yang sudah ada
    const firstLine = lines[0];
    const remainingLines = lines.slice(1);
    
    // Update input yang sedang diedit dengan baris pertama dan simpan ke database
    const newTitle = draftTitle + firstLine;
    onDraftTitleChange(newTitle, true);
    
    // Buat sub-task baru untuk baris selanjutnya menggunakan handleSubtaskEnter
    remainingLines.forEach((line, lineIndex) => {
      setTimeout(() => {
        handleSubtaskEnter(idx + lineIndex, line);
      }, 100 * (lineIndex + 1));
    });
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
      <input
        className={`border rounded px-2 py-1 text-sm flex-1 w-full focus:outline-none focus:ring-0 ${subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}`}
        value={draftTitle}
        onChange={e => onDraftTitleChange(e.target.value)}
        onPaste={handlePaste}
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
            handleSubtaskEnter(idx, '');
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