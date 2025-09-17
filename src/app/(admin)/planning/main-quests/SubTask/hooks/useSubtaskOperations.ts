import { useMemo, useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import debounce from 'lodash/debounce';
import { updateTask, updateTaskDisplayOrder, deleteTask } from '../../../quests/actions';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

export function useSubtaskOperations(
  taskId: string,
  _milestoneId: string,
  subtasks: Subtask[],
  setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>,
  draftTitles: Record<string, string>,
  setDraftTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  focusSubtaskId: string | null,
  setFocusSubtaskId: (id: string | null) => void,
  handleSubtaskEnter: (idx: number, title?: string, subtasksOverride?: Subtask[]) => Promise<number | null>,
  handleCheck: (subtask: Subtask) => void,
  handleDeleteSubtask: (id: string, idx: number) => Promise<number>
) {
  const debouncedUpdateTask = useMemo(() => debounce(async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks((subtasks: Subtask[]) => subtasks.map((st: Subtask) => st.id === id ? { ...st, title: val } : st));
    } catch {}
  }, 1000), [setSubtasks]);

  const updateTaskImmediate = useCallback(async (id: string, val: string) => {
    try {
      await updateTask(id, val);
      setSubtasks((subtasks: Subtask[]) => subtasks.map((st: Subtask) => st.id === id ? { ...st, title: val } : st));
    } catch {}
  }, [setSubtasks]);

  const handleDraftTitleChange = useCallback((id: string, val: string, immediate = false) => {
    setDraftTitles(draft => ({ ...draft, [id]: val }));
    if (immediate) {
      updateTaskImmediate(id, val);
    } else {
      debouncedUpdateTask(id, val);
    }
  }, [setDraftTitles, updateTaskImmediate, debouncedUpdateTask]);

  const handleDeleteSubtaskWithFocus = useCallback(async (id: string, idx: number) => {
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
  }, [handleDeleteSubtask, setDraftTitles, setFocusSubtaskId, subtasks]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
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
  }, [subtasks, setSubtasks]);

  const handleSubtaskEnterWithFocus = useCallback(async (idx: number, title: string = '', subtasksOverride?: Subtask[]): Promise<number> => {
    const result = await handleSubtaskEnter(idx, title, subtasksOverride);
    return typeof result === 'number' ? result : -1;
  }, [handleSubtaskEnter]);

  return {
    handleDraftTitleChange,
    handleDeleteSubtask: handleDeleteSubtaskWithFocus,
    handleDragEnd,
    handleSubtaskEnter: handleSubtaskEnterWithFocus,
    handleSubtaskEnterWithFocus,
    handleCheck
  };
}
