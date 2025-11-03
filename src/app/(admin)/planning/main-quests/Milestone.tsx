import React, { useEffect, useMemo } from 'react';
import Spinner from '@/components/ui/spinner/Spinner';
import { useMilestones } from './hooks/useMainQuestsSWR';
import MilestoneBar from './Milestone/components/MilestoneBar';
import Task from './Task';
import { TaskItemSkeleton, MilestoneItemSkeleton } from '@/components/ui/skeleton';
import { addMilestone, updateMilestone, updateMilestoneStatus } from './actions/milestoneActions';
import { toast } from 'sonner';
import { useMilestoneOperations } from './Milestone/hooks/useMilestoneOperations';
import { useQuestProgressInvalidation } from './Quest/hooks/useQuestProgress';
import type { KeyedMutator } from 'swr';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

interface Milestone {
  id: string;
  title: string;
  display_order: number;
  status?: 'TODO' | 'DONE';
}

interface MilestoneProps {
  questId: string;
  activeSubTask: Task | null;
  onOpenSubtask: (task: Task) => void;
  showCompletedTasks: boolean;
  showAllTasks: boolean;
}

export default function Milestone({ questId, activeSubTask, onOpenSubtask, showCompletedTasks, showAllTasks }: MilestoneProps) {
  
  const {
    milestones,
    isLoading: loadingMilestones,
    mutate: refetchMilestones,
  } = useMilestones(questId);

  // Sort milestones by display_order for consistent ordering
  const sortedMilestones = useMemo(() => {
    return [...(milestones || [])].sort((a, b) => a.display_order - b.display_order);
  }, [milestones]);

  // Drag and drop operations for milestones
  const { handleDragEnd: handleMilestoneDragEnd } = useMilestoneOperations(
    sortedMilestones,
    refetchMilestones as unknown as KeyedMutator<any[]>
  );
  
  // ✅ OPTIMIZED: Get progress invalidation functions
  const { invalidateMilestonesProgress } = useQuestProgressInvalidation();

  // For now, keep the old state management for milestone editing
  // TODO: Migrate milestone editing to use SWR and RPC
  const [newMilestoneInputs, setNewMilestoneInputs] = React.useState(['', '', '']);
  const [newMilestoneLoading, setNewMilestoneLoading] = React.useState([false, false, false]);
  const [milestoneLoading, setMilestoneLoading] = React.useState<Record<string, boolean>>({});
  const [milestoneChanges, setMilestoneChanges] = React.useState<Record<string, boolean>>({});
  const [activeMilestoneIdx, setActiveMilestoneIdx] = React.useState(0);

  // ✅ CRITICAL: Calculate milestone to render for Task component to maintain hook consistency
  // This ensures Task component is always rendered with the same structure
  // Must be after all hooks to avoid "used before declaration" error
  const milestoneToRender = useMemo(() => {
    if (!milestones || milestones.length === 0) return null;
    
    if (showAllTasks) {
      // When showAllTasks is true, we'll render all milestones in the map
      // Return null here, individual tasks will be rendered in map
      return null;
    } else {
      // Find active milestone or fallback to first milestone
      const activeMilestone = milestones.find((m: Milestone) => m.display_order === activeMilestoneIdx + 1);
      return activeMilestone || milestones[0] || null;
    }
  }, [milestones, showAllTasks, activeMilestoneIdx]);

  // Clear active milestone callback
  // const handleClearActiveMilestone = React.useCallback(() => {
  //   // Clear any active editing states
  //   setActiveMilestoneIdx(-1);
  // }, []);

  // Import milestone actions for editing
  const { handleSaveNewMilestone, handleSaveMilestone, handleMilestoneChange, handleMilestoneStatusToggle } = React.useMemo(() => {
    return {
      handleSaveNewMilestone: async (idx: number) => {
        const val = newMilestoneInputs[idx];
        if (!val.trim()) return;

        setNewMilestoneLoading(l => l.map((v, i) => i === idx ? true : v));
        try {
          const formData = new FormData();
          formData.append('quest_id', questId);
          formData.append('title', val.trim());
          formData.append('display_order', String(idx + 1));
          
          // Use the imported addMilestone function
          await addMilestone(formData);
          
          // Refetch milestones using SWR mutate
          refetchMilestones();
          setNewMilestoneInputs(inputs => inputs.map((v, i) => i === idx ? '' : v));
        } catch (error) {
          console.error('Failed to save milestone:', error);
          // You can add toast notification here if needed
        } finally {
          setNewMilestoneLoading(l => l.map((v, i) => i === idx ? false : v));
        }
      },
      handleSaveMilestone: async (id: string, val: string) => {
        setMilestoneLoading(prev => ({ ...prev, [id]: true }));
        try {
          // Use the imported updateMilestone function
          await updateMilestone(id, val);
          
          // Refetch milestones using SWR mutate
          refetchMilestones();
          setMilestoneChanges(prev => ({ ...prev, [id]: false }));
        } catch (error) {
          console.error('Failed to update milestone:', error);
          // You can add toast notification here if needed
        } finally {
          setMilestoneLoading(prev => ({ ...prev, [id]: false }));
        }
      },
      handleMilestoneChange: (id: string, newTitle: string) => {
        setMilestoneChanges(prev => ({ ...prev, [id]: true }));
      },
      handleMilestoneStatusToggle: async (id: string, currentStatus: 'TODO' | 'DONE') => {
        const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
        try {
          // ✅ OPTIMIZED: Update optimistic progress immediately
          invalidateMilestonesProgress(id, newStatus);
          
          // ✅ OPTIMISTIC UPDATE: Update cache immediately without triggering isLoading
          await refetchMilestones(
            (currentData: any) => {
              if (!currentData) return currentData;
              return currentData.map((milestone: any) =>
                milestone.id === id ? { ...milestone, status: newStatus } : milestone
              );
            },
            { revalidate: false } // Don't trigger loading state
          );
          
          // API call
          await updateMilestoneStatus(id, newStatus);
          
          // ✅ OPTIMIZED: No need to call refetchMilestones() - SWR will automatically revalidate
          // The optimistic update (line 123-131) already updated the cache
          // SWR's automatic revalidation will sync with server in background without triggering isLoading
          
          toast.success(`Milestone ${newStatus === 'DONE' ? 'selesai' : 'dibuka kembali'}`);
        } catch (error) {
          // Revert optimistic update on error
          await refetchMilestones(); // Revalidate to get correct data
          console.error('Failed to toggle milestone status:', error);
          toast.error('Gagal update status milestone');
        }
      },
    };
  }, [questId, newMilestoneInputs, refetchMilestones, invalidateMilestonesProgress]);

  return (
    <>
      <label className='block mb-2 font-semibold'>3 Milestone (Goal Kecil) untuk mewujudkan High Focus Goal :</label>
      
      {loadingMilestones ? (
        <MilestoneItemSkeleton count={3} />
      ) : (
        <MilestoneBar
          milestones={sortedMilestones}
          newMilestoneInputs={newMilestoneInputs}
          setNewMilestoneInputs={setNewMilestoneInputs}
          newMilestoneLoading={newMilestoneLoading}
          milestoneLoading={milestoneLoading}
          milestoneChanges={milestoneChanges}
          activeMilestoneIdx={activeMilestoneIdx}
          setActiveMilestoneIdx={setActiveMilestoneIdx}
          handleSaveNewMilestone={handleSaveNewMilestone}
          handleSaveMilestone={handleSaveMilestone}
          handleMilestoneChange={handleMilestoneChange}
          onStatusToggle={handleMilestoneStatusToggle}
          onClearActiveMilestoneIdx={() => setActiveMilestoneIdx(-1)}
          handleDragEnd={handleMilestoneDragEnd}
        />
      )}
      
      <div className="space-y-4 mb-4">
        {loadingMilestones ? (
          <div className="rounded-lg mb-2">
            <label className="block mb-2 font-semibold">Langkah selanjutnya untuk mecapai Milestone 1 :</label>
            <div className="space-y-2 mb-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <TaskItemSkeleton
                  key={`loading-milestone-${idx}`}
                  orderNumber={idx + 1}
                  showButton={true}
                />
              ))}
            </div>
          </div>
        ) : showAllTasks ? (
          // Show all tasks for all milestones
          milestones?.map((milestone: Milestone) => (
            <div key={`milestone-tasks-${milestone.id}`} className="space-y-4">
              <Task
                key={`task-${milestone.id}`}
                milestone={milestone}
                milestoneNumber={milestone.display_order}
                onOpenSubtask={onOpenSubtask}
                activeSubTask={activeSubTask}
                showCompletedTasks={showCompletedTasks}
              />
            </div>
          ))
        ) : milestoneToRender ? (
          // ✅ CRITICAL FIX: Always render Task component when milestoneToRender exists
          // This ensures hooks are called consistently - Task component always rendered with same structure
          <Task
            key={`task-${questId}-${milestoneToRender.id}-${activeMilestoneIdx}`}
            milestone={milestoneToRender}
            milestoneNumber={activeMilestoneIdx >= 0 && milestones?.some((m: Milestone) => m.display_order === activeMilestoneIdx + 1) 
              ? activeMilestoneIdx + 1 
              : milestoneToRender.display_order}
            onOpenSubtask={onOpenSubtask}
            activeSubTask={activeSubTask}
            showCompletedTasks={showCompletedTasks}
          />
        ) : null}
      </div>
    </>
  );
}
