import { useCallback } from 'react';
import { addTask, updateTaskStatus, deleteTask } from '../../actions/taskActions';
import { toast } from 'sonner';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

export function useSubtaskCRUD(
  taskId: string, 
  milestoneId: string, 
  subtasks: Subtask[], 
  setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>
) {
  const handleSubtaskEnter = useCallback(async (
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
        toast.error('Gagal membuat tugas baru. Coba lagi.');
        return null;
      }
    } catch {
      setSubtasks((prev: Subtask[]) => prev.filter((st: Subtask) => st.id !== tempId));
      toast.error('Gagal membuat tugas baru. Coba lagi.');
      return null;
    }
  }, [taskId, milestoneId, subtasks, setSubtasks]);

  const handleCheck = useCallback(async (subtask: Subtask) => {
    const newStatus = subtask.status === 'DONE' ? 'TODO' : 'DONE';
    setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: newStatus } : st));
    try {
      const res = await updateTaskStatus(subtask.id, newStatus);
      if (!res) {
        setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: subtask.status } : st));
        toast.error('Gagal update status');
      }
    } catch {
      setSubtasks((prev: Subtask[]) => prev.map((st: Subtask) => st.id === subtask.id ? { ...st, status: subtask.status } : st));
      toast.error('Gagal update status');
    }
  }, [setSubtasks]);

  const handleDeleteSubtask = useCallback(async (id: string, idx: number): Promise<number> => {
    // Optimistic update - hapus dari UI dulu
    setSubtasks((prev: Subtask[]) => prev.filter((st: Subtask) => st.id !== id));
    
    // Validasi UUID format untuk Supabase
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return idx > 0 ? idx - 1 : -1;
    }
    
    try {
      // Hapus dari database
      await deleteTask(id);
      toast.success('Subtask berhasil dihapus');
    } catch (error) {
      // Jika gagal, kembalikan ke state semula
      console.error('Failed to delete subtask:', error);
      toast.error('Gagal menghapus subtask');
      // Note: State sudah dihapus di atas, jadi tidak perlu rollback
    }
    
    if (idx > 0) {
      return idx - 1;
    }
    return -1;
  }, [setSubtasks]);

  return {
    handleSubtaskEnter,
    handleCheck,
    handleDeleteSubtask
  };
}
