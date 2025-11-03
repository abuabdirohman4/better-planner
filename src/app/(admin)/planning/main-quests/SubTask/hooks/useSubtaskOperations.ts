import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { updateTask, updateTaskDisplayOrder, deleteTask } from '../../actions/taskActions';
import type { KeyedMutator } from 'swr';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
  parent_task_id?: string | null;
  milestone_id?: string | null;
}

type SubtaskData = Array<{
  id: any;
  title: any;
  status: any;
  display_order: any;
  parent_task_id?: any;
  milestone_id?: any;
}>;

export function useSubtaskOperations(
  taskId: string,
  _milestoneId: string,
  subtasks: Subtask[],
  mutateSubtasks: KeyedMutator<SubtaskData>,
  draftTitles: Record<string, string>,
  setDraftTitles: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  focusSubtaskId: string | null,
  setFocusSubtaskId: (id: string | null) => void,
  handleSubtaskEnter: (idx: number, title?: string, subtasksOverride?: Subtask[]) => Promise<{ newIndex: number | null; newSubtaskId?: string } | null>,
  handleCheck: (subtask: Subtask) => void,
  handleDeleteSubtask: (id: string, idx: number) => Promise<{ newIndex: number; newFocusId?: string }>
) {
  // Removed debouncedUpdateTask - now using manual save only
  // Removed updateTaskImmediate - now using SWR mutate for optimistic updates

  const handleDraftTitleChange = useCallback(async (id: string, val: string, immediate = false) => {
    setDraftTitles(draft => ({ ...draft, [id]: val }));
    
    // Only make API call if immediate is true (from Edit button)
    if (immediate) {
      const currentSubtask = subtasks.find(st => st.id === id);
      const hasChanges = currentSubtask && val.trim() !== (currentSubtask.title || '').trim();
      
      if (hasChanges) {
        try {
          // Simply call API - draftTitle already updated, no need for optimistic update
          await updateTask(id, val);
          toast.success('Subtask berhasil diperbarui');
        } catch (error) {
          // Refetch on error to ensure data consistency
          mutateSubtasks();
          toast.error('Gagal memperbarui subtask');
          throw error;
        }
      }
    }
  }, [setDraftTitles, mutateSubtasks, subtasks]);

  const handleDeleteSubtaskWithFocus = useCallback(async (id: string, idx: number) => {
    const result = await handleDeleteSubtask(id, idx);
    
    // 🔧 FIX: Clear draft title for deleted subtask
    setDraftTitles(draft => {
      const newDraft = { ...draft };
      delete newDraft[id];
      return newDraft;
    });
    
    // 🔧 FIX: Focus on the appropriate subtask after deletion
    if (result.newFocusId) {
      setFocusSubtaskId(result.newFocusId);
    } else {
      setFocusSubtaskId(null);
    }
  }, [handleDeleteSubtask, setDraftTitles, setFocusSubtaskId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = subtasks.findIndex(st => st.id === activeId);
    const newIndex = subtasks.findIndex(st => st.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Calculate new order
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
    
    // Save original state for revert
    const originalSubtasks = [...subtasks];
    
    try {
      // Optimistic update - update UI immediately
      await mutateSubtasks(newSubtasks as SubtaskData, { revalidate: false });
      
      // API call
      await updateTaskDisplayOrder(newSubtasks[newIndex].id, newOrder);
      
      // Revalidate to ensure data sync with server
      await mutateSubtasks();
    } catch (error) {
      // Revert optimistic update on error
      await mutateSubtasks(originalSubtasks as SubtaskData, { revalidate: false });
      toast.error('Gagal mengubah urutan subtask');
    }
  }, [subtasks, mutateSubtasks]);

  const handleSubtaskEnterWithFocus = useCallback(async (idx: number, title: string = '', subtasksOverride?: Subtask[]): Promise<number> => {
    const result = await handleSubtaskEnter(idx, title, subtasksOverride);
    return result?.newIndex ?? -1;
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
