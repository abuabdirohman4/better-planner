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
import debounce from 'lodash/debounce';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

import ComponentCard from '@/components/common/ComponentCard';
import Checkbox from '@/components/form/input/Checkbox';
import InputField from '@/components/form/input/InputField';
import CustomToast from '@/components/ui/toast/CustomToast';

import { updateTask, addTask, updateTaskStatus, deleteTask, updateTaskDisplayOrder, getSubtasksForTask } from '../quests/actions';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

const HamburgerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="cursor-grab text-gray-400 hover:text-gray-600">
    <rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="4" y="9.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
    <rect x="4" y="12.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
  </svg>
);

// Custom hook for subtask management
function useSubtaskManagement(taskId: string) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loadingSubtasks, setLoadingSubtasks] = useState(true);

  const fetchSubtasks = useCallback(async () => {
    setLoadingSubtasks(true);
    try {
      const data = await getSubtasksForTask(taskId);
      setSubtasks(Array.isArray(data) ? data : []);
    } finally {
      setLoadingSubtasks(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  return {
    subtasks,
    setSubtasks,
    loadingSubtasks,
    fetchSubtasks
  };
}

// Custom hook for subtask state management
function useSubtaskState() {
  const [focusSubtaskId, setFocusSubtaskId] = useState<string | null>(null);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>({});

  return {
    focusSubtaskId,
    setFocusSubtaskId,
    draftTitles,
    setDraftTitles
  };
}

// Custom hook for subtask CRUD operations
function useSubtaskCRUD(taskId: string, milestoneId: string, subtasks: Subtask[], setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>) {
  const handleSubtaskEnter = async (
    idx: number,
    title: string = '',
    subtasksOverride?: Subtask[]
  ): Promise<number | null> => {
    const subtasksArr = subtasksOverride ?? subtasks;
    let newOrder = 1.0;
    if (subtasksArr.length === 0) {
      newOrder = 1.0;
    } else if (idx >= subtasksArr.length - 1) {
      const lastOrder = subtasksArr.length;
      newOrder = lastOrder + 1.0;
    } else {
      const prevOrder = subtasksArr[idx]?.display_order ?? 0;
      const nextOrder = subtasksArr[idx + 1]?.display_order;
      if (nextOrder !== undefined) {
        newOrder = (prevOrder + nextOrder) / 2;
      } else {
        newOrder = prevOrder + 1.0;
      }
    }
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const optimisticSubtask: Subtask = {
      id: tempId,
      title: title,
      status: 'TODO' as const,
      display_order: newOrder,
    };
    setSubtasks((prev: Subtask[]) => {
      const arr = [...prev];
      if (idx >= arr.length - 1) {
        arr.push(optimisticSubtask);
      } else {
        arr.splice(idx + 1, 0, optimisticSubtask);
      }
      return arr;
    });
    try {
      const formData = new FormData();
      formData.append('parent_task_id', taskId);
      formData.append('title', title);
      formData.append('milestone_id', milestoneId);
      formData.append('display_order', String(newOrder));
      const res = await addTask(formData);
      if (res && res.task) {
        setSubtasks((prev: Subtask[]) => {
          const arr = prev.map((st: Subtask) => st.id === tempId ? (res.task as Subtask) : st);
          return arr;
        });
        // Cari index subtask baru di subtasks
        const idxBaru = (subtasksOverride ?? subtasks).findIndex(st => st.id === tempId);
        return idxBaru !== -1 ? idxBaru : null;
      } else {
        setSubtasks((prev: Subtask[]) => prev.filter((st: Subtask) => st.id !== tempId));
        CustomToast.error('Gagal membuat tugas baru. Coba lagi.');
        return null;
      }
    } catch {
      setSubtasks((prev: Subtask[]) => prev.filter((st: Subtask) => st.id !== tempId));
      CustomToast.error('Gagal membuat tugas baru. Coba lagi.');
      return null;
    }
  };

  const handleCheck = async (subtask: Subtask) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: newStatus } : st));
    try {
      const res = await updateTaskStatus(subtask.id, newStatus);
      if (!res) {
        setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: subtask.status } : st));
        CustomToast.error('Gagal update status');
      }
    } catch {
      setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: subtask.status } : st));
      CustomToast.error('Gagal update status');
    }
  };

  const handleDeleteSubtask = async (id: string, idx: number): Promise<number> => {
    setSubtasks((prev: Subtask[]) => prev.filter((st: Subtask) => st.id !== id));
    if (idx > 0) {
      return idx - 1;
    }
    return -1;
  };

  return {
    handleSubtaskEnter,
    handleCheck,
    handleDeleteSubtask
  };
}

// Custom hook for subtask operations
function useSubtaskOperations(taskId: string, _milestoneId: string, subtasks: Subtask[], setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>, draftTitles: Record<string, string>, setDraftTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>) {
  const { focusSubtaskId, setFocusSubtaskId } = useSubtaskState();
  const { handleSubtaskEnter, handleCheck, handleDeleteSubtask } = useSubtaskCRUD(taskId, _milestoneId, subtasks, setSubtasks);

  const debouncedUpdateTask = useMemo(() => debounce(async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks((subtasks: Subtask[]) => subtasks.map((st: Subtask) => st.id === id ? { ...st, title: val } : st));
    } catch {}
  }, 1000), [setSubtasks]);

  const updateTaskImmediate = async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks((subtasks: Subtask[]) => subtasks.map((st: Subtask) => st.id === id ? { ...st, title: val } : st));
    } catch {}
  };

  const handleDraftTitleChange = (id: string, val: string, immediate = false) => {
    setDraftTitles(draft => ({ ...draft, [id]: val }));
    if (immediate) {
      updateTaskImmediate(id, val);
    } else {
      debouncedUpdateTask(id, val);
    }
  };

  const handleDeleteSubtaskWithFocus = async (id: string, idx: number) => {
    const newFocusId = await handleDeleteSubtask(id, idx);
    setDraftTitles(draft => {
      const newDraft = { ...draft };
      delete newDraft[id];
      return newDraft;
    });
    if (newFocusId !== -1 && newFocusId >= 0 && newFocusId < subtasks.length) {
      setFocusSubtaskId(subtasks[newFocusId].id);
    } else {
      setFocusSubtaskId(null);
    }
    if (!id.match(/^[\da-f]{24}$/i)) return;
    try {
      await deleteTask(id);
    } catch {}
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = subtasks.findIndex(st => st.id === activeId);
    const newIndex = subtasks.findIndex(st => st.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const newSubtasks = arrayMove(subtasks, oldIndex, newIndex);
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
    setSubtasks(() => newSubtasks);
    try {
      await updateTaskDisplayOrder(newSubtasks[newIndex].id, newOrder);
    } catch {}
  };

  const handleSubtaskEnterWithFocus = async (idx: number, title: string = '', subtasksOverride?: Subtask[]): Promise<number> => {
    const result = await handleSubtaskEnter(idx, title, subtasksOverride);
    return typeof result === 'number' ? result : -1;
  };

  return {
    focusSubtaskId,
    setFocusSubtaskId,
    draftTitles,
    setDraftTitles,
    handleSubtaskEnter: handleSubtaskEnterWithFocus,
    handleSubtaskEnterWithFocus,
    handleCheck,
    handleDraftTitleChange,
    handleDeleteSubtask: handleDeleteSubtaskWithFocus,
    handleDragEnd
  };
}

// Custom hook for new subtask management
function useNewSubtaskManagement(taskId: string, milestoneId: string, subtasks: Subtask[], fetchSubtasks: () => void) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskLoading, setNewSubtaskLoading] = useState(false);

  const debouncedInsertNewSubtask = useMemo(() => debounce(async (title: string) => {
    if (!title) return;
    setNewSubtaskLoading(true);
    let newOrder = 1.0;
    if (subtasks.length > 0) {
      const lastOrder = subtasks[subtasks.length - 1].display_order;
      newOrder = lastOrder + 1.0;
    }
    try {
      const formData = new FormData();
      formData.append('parent_task_id', taskId);
      formData.append('title', title);
      formData.append('milestone_id', milestoneId);
      formData.append('display_order', String(newOrder));
      const res = await addTask(formData);
      if (res && res.task) {
        setNewSubtaskTitle('');
        fetchSubtasks();
        CustomToast.success(res.message || 'Sub-tugas berhasil ditambahkan');
      } else {
        CustomToast.error('Gagal menambah sub-tugas');
      }
    } catch {
      CustomToast.error('Gagal menambah sub-tugas');
    } finally {
      setNewSubtaskLoading(false);
    }
  }, 500), [taskId, milestoneId, subtasks, fetchSubtasks]);

  useEffect(() => {
    if (newSubtaskTitle) debouncedInsertNewSubtask(newSubtaskTitle);
  }, [newSubtaskTitle, debouncedInsertNewSubtask]);

  const handleBulkPasteEmpty = async (e: React.ClipboardEvent, handleSubtaskEnter: (idx: number, title?: string, subtasksOverride?: Subtask[]) => Promise<number | null>) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return;
    
    e.preventDefault();
    
    setNewSubtaskTitle(lines[0]);
    
    const localSubtasks = subtasks.map(st => ({ ...st }));
    for (let i = 1; i < lines.length; i++) {
      const idx = localSubtasks.length - 1;
      const newOrder = await handleSubtaskEnter(idx, lines[i], localSubtasks);
      if (newOrder !== null) {
        localSubtasks.push({
          id: `dummy-${i}`,
          title: lines[i],
          status: 'TODO' as const,
          display_order: newOrder,
        });
      }
    }
  };

  return {
    newSubtaskTitle,
    setNewSubtaskTitle,
    newSubtaskLoading,
    handleBulkPasteEmpty
  };
}

// Component for sortable item
type SortableItemProps = {
  subtask: Subtask;
  idx: number;
  setEditSubtaskId: (id: string) => void;
  setFocusSubtaskId: (id: string | null) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleSubtaskEnterWithOverride?: (idx: number, title: string, subtasksOverride: Subtask[]) => Promise<number>;
  handleCheck: (subtask: Subtask) => void;
  shouldFocus: boolean;
  clearFocusSubtaskId: () => void;
  draftTitle: string;
  onDraftTitleChange: (val: string, immediate?: boolean) => void;
  subtaskIds: string[];
  handleDeleteSubtask: (id: string, idx: number) => void;
};

function SortableItem({ subtask, idx, handleSubtaskEnterWithOverride, ...props }: SortableItemProps) {
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
        handleSubtaskEnterWithOverride={handleSubtaskEnterWithOverride}
      />
    </div>
  );
}

// Component for subtask input
interface SubtaskInputProps {
  subtask: Subtask;
  idx: number;
  setEditSubtaskId: (id: string) => void;
  setFocusSubtaskId: (id: string | null) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleSubtaskEnterWithOverride?: (idx: number, title: string, subtasksOverride: Subtask[]) => Promise<number>;
  handleCheck: (subtask: Subtask) => void;
  shouldFocus: boolean;
  clearFocusSubtaskId: () => void;
  draftTitle: string;
  onDraftTitleChange: (val: string, immediate?: boolean) => void;
  subtaskIds: string[];
  handleDeleteSubtask: (id: string, idx: number) => void;
}

function SubtaskInput({ subtask, idx, setEditSubtaskId, setFocusSubtaskId, handleSubtaskEnter, handleSubtaskEnterWithOverride, handleCheck, shouldFocus, clearFocusSubtaskId, draftTitle, onDraftTitleChange, subtaskIds, handleDeleteSubtask }: SubtaskInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldFocus]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return;
    
    e.preventDefault();
    
    const firstLine = lines[0];
    const remainingLines = lines.slice(1);
    
    const newTitle = draftTitle + firstLine;
    onDraftTitleChange(newTitle, true);
    
    const localSubtasks = subtaskIds.map((id) => ({
      id,
      title: '',
      status: 'TODO' as const,
      display_order: 0,
    }));
    if (handleSubtaskEnterWithOverride) {
      for (let i = 0; i < remainingLines.length; i++) {
        const idx = localSubtasks.length - 1;
        const newOrder = await handleSubtaskEnterWithOverride(idx, remainingLines[i], localSubtasks);
        localSubtasks.push({
          id: `dummy-paste-${i}`,
          title: remainingLines[i],
          status: 'TODO' as const,
          display_order: newOrder,
        });
      }
    } else {
      for (let i = 0; i < remainingLines.length; i++) {
        await handleSubtaskEnter(idx, remainingLines[i]);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
      <input
        className={`border rounded px-2 py-1 text-sm flex-1 w-full focus:outline-none focus:ring-0 ${subtask.status === 'DONE' ? 'line-through text-gray-400' : ''}`}
        value={draftTitle}
        onChange={e => onDraftTitleChange(e.target.value)}
        onPaste={(e) => handlePaste(e)}
        onFocus={() => {
          setEditSubtaskId(subtask.id);
          setFocusSubtaskId(subtask.id);
        }}
        onBlur={e => {
          const next = e.relatedTarget as HTMLElement | null;
          onDraftTitleChange(e.target.value, true);
          if (!next || next.tagName !== 'INPUT') {
            clearFocusSubtaskId();
          }
        }}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleCheck(subtask);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            onDraftTitleChange(e.currentTarget.value, true);
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


// Component for subtask list
function SubtaskList({ 
  subtasks, 
  loadingSubtasks, 
  newSubtaskTitle, 
  setNewSubtaskTitle, 
  newSubtaskLoading, 
  handleBulkPasteEmpty,
  handleSubtaskEnter,
  handleSubtaskEnterWithOverride,
  handleCheck,
  focusSubtaskId,
  setFocusSubtaskId,
  draftTitles,
  handleDraftTitleChange,
  handleDeleteSubtask,
  handleDragEnd
}: {
  subtasks: Subtask[];
  loadingSubtasks: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (title: string) => void;
  newSubtaskLoading: boolean;
  handleBulkPasteEmpty: (e: React.ClipboardEvent) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleSubtaskEnterWithOverride: (idx: number, title: string, subtasksOverride: Subtask[]) => Promise<number>;
  handleCheck: (subtask: Subtask) => void;
  focusSubtaskId: string | null;
  setFocusSubtaskId: (id: string | null) => void;
  draftTitles: Record<string, string>;
  handleDraftTitleChange: (id: string, val: string, immediate?: boolean) => void;
  handleDeleteSubtask: (id: string, idx: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  return (
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
                  setEditSubtaskId={() => {}}
                  setFocusSubtaskId={setFocusSubtaskId}
                  handleSubtaskEnter={handleSubtaskEnter}
                  handleSubtaskEnterWithOverride={handleSubtaskEnterWithOverride}
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
  );
}

export default function SubTask({ task, onBack, milestoneId }: { task: { id: string; title: string; status: 'TODO' | 'DONE' }; onBack: () => void; milestoneId: string; }) {
  const { subtasks, setSubtasks, loadingSubtasks, fetchSubtasks } = useSubtaskManagement(task.id);
  const { focusSubtaskId, setFocusSubtaskId, draftTitles, setDraftTitles } = useSubtaskState();
  const { handleSubtaskEnter, handleCheck } = useSubtaskCRUD(task.id, milestoneId, subtasks, setSubtasks);
  const { handleDraftTitleChange, handleDeleteSubtask: handleDeleteSubtaskWithFocus, handleDragEnd } = useSubtaskOperations(task.id, milestoneId, subtasks, setSubtasks, draftTitles, setDraftTitles);
  const { newSubtaskTitle, setNewSubtaskTitle, newSubtaskLoading, handleBulkPasteEmpty } = useNewSubtaskManagement(task.id, milestoneId, subtasks, fetchSubtasks);

  useEffect(() => {
    if (focusSubtaskId) {
      const idx = subtasks.findIndex(st => st.id === focusSubtaskId);
      if (idx !== -1 && inputRefs.current[idx]) {
        inputRefs.current[idx]?.focus();
      }
    }
  }, [focusSubtaskId, subtasks]);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubtaskEnterWithOverride = async (idx: number, title: string, subtasksOverride: Subtask[]): Promise<number> => {
    const result = await handleSubtaskEnter(idx, title, subtasksOverride);
    return typeof result === 'number' ? result : -1;
  };

  const handleBulkPasteEmptyWrapper = (e: React.ClipboardEvent) => {
    handleBulkPasteEmpty(e, handleSubtaskEnter);
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto">
      <ComponentCard 
        title={task.title} 
        className='' 
        classNameTitle='text-center text-xl !font-extrabold' 
        classNameHeader="pb-0"
        onClose={onBack}
      >
        <SubtaskList
          subtasks={subtasks}
          loadingSubtasks={loadingSubtasks}
          newSubtaskTitle={newSubtaskTitle}
          setNewSubtaskTitle={setNewSubtaskTitle}
          newSubtaskLoading={newSubtaskLoading}
          handleBulkPasteEmpty={handleBulkPasteEmptyWrapper}
          handleSubtaskEnter={handleSubtaskEnter}
          handleSubtaskEnterWithOverride={handleSubtaskEnterWithOverride}
          handleCheck={handleCheck}
          focusSubtaskId={focusSubtaskId}
          setFocusSubtaskId={setFocusSubtaskId}
          draftTitles={draftTitles}
          handleDraftTitleChange={handleDraftTitleChange}
          handleDeleteSubtask={handleDeleteSubtaskWithFocus}
          handleDragEnd={handleDragEnd}
        />
      </ComponentCard>
    </div>
  );
} 