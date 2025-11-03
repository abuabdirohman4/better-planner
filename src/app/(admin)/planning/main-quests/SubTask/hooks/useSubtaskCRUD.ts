import { useCallback } from 'react';
import { addTask, updateTaskStatus, deleteTask } from '../../actions/taskActions';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

type SubtaskData = Array<{
  id: any;
  title: any;
  status: any;
  display_order: any;
  parent_task_id?: any;
  milestone_id?: any;
  created_at?: any;
}>;

export function useSubtaskCRUD(
  taskId: string, 
  milestoneId: string, 
  subtasks: Subtask[], 
  refetchSubtasks: (() => void) | KeyedMutator<SubtaskData>
) {
  const handleSubtaskEnter = useCallback(async (
    idx: number,
    title: string = '',
    subtasksOverride?: Subtask[]
  ): Promise<{ newIndex: number | null; newSubtaskId?: string } | null> => {
    const subtasksArr = subtasksOverride ?? subtasks;
    let newOrder = 1.0;
    
    if (subtasksArr.length === 0) {
      // Jika tidak ada subtask, mulai dengan order 1
      newOrder = 1.0;
    } else if (idx >= subtasksArr.length) {
      // Jika insert di akhir (idx >= length), ambil order terakhir + 1
      const lastSubtask = subtasksArr[subtasksArr.length - 1];
      newOrder = lastSubtask.display_order + 1.0;
    } else if (idx === 0) {
      // Jika insert di awal (idx = 0), insert sebelum subtask pertama
      const firstSubtask = subtasksArr[0];
      newOrder = firstSubtask.display_order - 1.0;
    } else {
      // Jika insert di tengah (0 < idx < length), hitung order di antara prev dan next
      const prevSubtask = subtasksArr[idx - 1]; // Subtask sebelum posisi insert
      const nextSubtask = subtasksArr[idx];     // Subtask di posisi insert
      
      if (prevSubtask && nextSubtask) {
        // Insert di antara prev dan next
        newOrder = (prevSubtask.display_order + nextSubtask.display_order) / 2;
      } else if (prevSubtask) {
        // Hanya ada prev, insert setelahnya
        newOrder = prevSubtask.display_order + 1.0;
      } else if (nextSubtask) {
        // Hanya ada next, insert sebelumnya
        newOrder = nextSubtask.display_order - 1.0;
      } else {
        // Fallback
        newOrder = 1.0;
      }
    }
    
    try {
      const formData = new FormData();
      formData.append('parent_task_id', taskId);
      formData.append('title', title);
      formData.append('milestone_id', milestoneId);
      formData.append('display_order', String(newOrder));
      const res = await addTask(formData);
      if (res && res.task) {
      // ✅ Refetch data to ensure consistency
      if (typeof refetchSubtasks === 'function' && refetchSubtasks.length === 0) {
        // SWR mutate function
        await (refetchSubtasks as KeyedMutator<SubtaskData>)();
      } else {
        // Regular function
        (refetchSubtasks as () => void)();
      }
      toast.success('Subtask berhasil ditambahkan');
      return { 
        newIndex: idx + 1, // Return next index
        newSubtaskId: res.task.id // Return new subtask ID for focus
      };
      } else {
        toast.error('Gagal membuat tugas baru. Coba lagi.');
        return null;
      }
    } catch {
      toast.error('Gagal membuat tugas baru. Coba lagi.');
      return null;
    }
  }, [taskId, milestoneId, refetchSubtasks]); // 🔧 FIX: Remove subtasks dependency

  const handleCheck = useCallback(async (subtask: Subtask) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    
    // Store original subtasks for potential revert
    const originalSubtasks = [...subtasks];
    
    // Optimistic update - update status in-place to preserve order
    // Check if refetchSubtasks is a SWR mutate function (KeyedMutator)
    const isKeyedMutator = typeof refetchSubtasks === 'function' && 
      refetchSubtasks.length === 0 || refetchSubtasks.length === 2;
    
    if (isKeyedMutator) {
      const mutateSubtasks = refetchSubtasks as unknown as KeyedMutator<SubtaskData>;
      try {
        // Optimistic update - update UI immediately while preserving order
        const updatedSubtasks = subtasks.map(s => 
          s.id === subtask.id ? { ...s, status: newStatus } : s
        );
        await mutateSubtasks(updatedSubtasks as SubtaskData, { revalidate: false });
        
        // API call
        const res = await updateTaskStatus(subtask.id, newStatus);
        if (res) {
          // ✅ OPTIMIZED: No need to call mutateSubtasks() - SWR will automatically revalidate
          // The optimistic update (line 117) already updated the cache
          // SWR's automatic revalidation will sync with server in background without triggering isLoading
          toast.success(`Subtask ${newStatus === 'DONE' ? 'selesai' : 'dibuka kembali'}`);
        } else {
          // Revert on error
          await mutateSubtasks(originalSubtasks as SubtaskData, { revalidate: false });
          toast.error('Gagal update status');
        }
      } catch (error) {
        // Revert optimistic update on error
        await mutateSubtasks(originalSubtasks as SubtaskData, { revalidate: false });
        toast.error('Gagal update status');
      }
    } else {
      // Fallback to refetch if mutate is not available
      try {
        const res = await updateTaskStatus(subtask.id, newStatus);
        if (res) {
          (refetchSubtasks as () => void)();
          toast.success(`Subtask ${newStatus === 'DONE' ? 'selesai' : 'dibuka kembali'}`);
        } else {
          toast.error('Gagal update status');
        }
      } catch {
        toast.error('Gagal update status');
        (refetchSubtasks as () => void)();
      }
    }
  }, [subtasks, refetchSubtasks]);

  const handleDeleteSubtask = useCallback(async (id: string, idx: number): Promise<{ newIndex: number; newFocusId?: string }> => {
    // Validasi UUID format untuk Supabase
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return { newIndex: idx > 0 ? idx - 1 : -1 };
    }
    
    // 🔧 FIX: Find the subtask to focus after deletion
    // Find the current subtask in the array to get its position
    const currentSubtaskIndex = subtasks.findIndex(st => st.id === id);
    let newFocusId: string | undefined;
    
    if (currentSubtaskIndex > 0) {
      // Focus on the subtask above
      const subtaskAbove = subtasks[currentSubtaskIndex - 1];
      newFocusId = subtaskAbove?.id;
    } else if (currentSubtaskIndex < subtasks.length - 1) {
      // If deleting the first subtask, focus on the next one
      const subtaskBelow = subtasks[currentSubtaskIndex + 1];
      newFocusId = subtaskBelow?.id;
    }
    // If deleting the only subtask, newFocusId will be undefined (no focus)
    
    try {
      // Hapus dari database
      await deleteTask(id);
      toast.success('Subtask berhasil dihapus');
      
      // ✅ Refetch immediately for delete operations (critical for UI consistency)
      if (typeof refetchSubtasks === 'function' && refetchSubtasks.length === 0) {
        // SWR mutate function
        await (refetchSubtasks as KeyedMutator<SubtaskData>)();
      } else {
        // Regular function
        (refetchSubtasks as () => void)();
      }
    } catch (error) {
      toast.error('Gagal menghapus subtask');
      // Refetch on error to ensure data consistency
      if (typeof refetchSubtasks === 'function' && refetchSubtasks.length === 0) {
        // SWR mutate function
        await (refetchSubtasks as KeyedMutator<SubtaskData>)();
      } else {
        // Regular function
        (refetchSubtasks as () => void)();
      }
    }
    
    return { 
      newIndex: idx > 0 ? idx - 1 : -1,
      newFocusId
    };
  }, [refetchSubtasks]); // 🔧 FIX: Remove subtasks dependency

  return {
    handleSubtaskEnter,
    handleCheck,
    handleDeleteSubtask
  };
}
