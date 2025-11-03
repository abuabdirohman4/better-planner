import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { updateMilestonesDisplayOrder } from '../../actions/milestoneActions';
import type { KeyedMutator } from 'swr';

interface Milestone {
  id: string;
  title: string;
  display_order: number;
  status?: 'TODO' | 'DONE';
}

type MilestoneData = Array<{
  id: any;
  title: any;
  display_order: any;
  status?: any;
}>;

export function useMilestoneOperations(
  milestones: Milestone[],
  mutateMilestones: KeyedMutator<MilestoneData>
) {
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const oldIndex = milestones.findIndex(m => m.id === activeId);
    const newIndex = milestones.findIndex(m => m.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reorder milestones array
    const newMilestones = arrayMove(milestones, oldIndex, newIndex);
    
    // Assign sequential display_order values (1, 2, 3, ...) based on new positions
    const milestonesWithNewOrder = newMilestones.map((milestone, idx) => ({
      id: milestone.id,
      display_order: idx + 1
    }));
    
    // Save original state for revert
    const originalMilestones = [...milestones];
    
    // Update optimistic UI with new order values
    const updatedMilestonesForUI = newMilestones.map((milestone, idx) => ({
      ...milestone,
      display_order: idx + 1
    }));
    
    try {
      // Optimistic update - update UI immediately with new display_order values
      await mutateMilestones(updatedMilestonesForUI as MilestoneData, { revalidate: false });
      
      // API call - batch update all milestones with sequential display_order
      await updateMilestonesDisplayOrder(milestonesWithNewOrder);
      
      // Show success toast
      toast.success('Urutan milestone berhasil diubah');
      
      // Small delay to ensure API processed before refetch
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Revalidate to ensure data sync with server
      await mutateMilestones();
    } catch (error) {
      // Revert optimistic update on error
      await mutateMilestones(originalMilestones as MilestoneData, { revalidate: false });
      toast.error('Gagal mengubah urutan milestone');
    }
  }, [milestones, mutateMilestones]);

  return {
    handleDragEnd,
  };
}

