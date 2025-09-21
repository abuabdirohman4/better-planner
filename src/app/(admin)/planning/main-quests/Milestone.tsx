import React, { useEffect } from 'react';
import Spinner from '@/components/ui/spinner/Spinner';
import { useMilestoneState } from './Milestone/hooks/useMilestoneState';
import MilestoneBar from './Milestone/components/MilestoneBar';
import Task from './Task';
import { TaskItemSkeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

interface Milestone {
  id: string;
  title: string;
  display_order: number;
}

interface MilestoneProps {
  questId: string;
  activeSubTask: Task | null;
  onOpenSubtask: (task: Task) => void;
}

export default function Milestone({ questId, activeSubTask, onOpenSubtask }: MilestoneProps) {
  const {
    // State
    milestones,
    loadingMilestones,
    newMilestoneInputs,
    setNewMilestoneInputs,
    newMilestoneLoading,
    milestoneLoading,
    milestoneChanges,
    activeMilestoneIdx,
    setActiveMilestoneIdx,
    
    // Actions
    fetchMilestones,
    handleSaveNewMilestone,
    handleSaveMilestone,
    handleMilestoneChange,
  } = useMilestoneState(questId);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  return (
    <>
      <label className='block mb-2 font-semibold'>3 Milestone (Goal Kecil) untuk mewujudkan High Focus Goal :</label>
      
      <MilestoneBar
        milestones={milestones}
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
      />
      
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
        ) : (
          (() => {
            // Find milestone with display_order matching activeMilestoneIdx + 1
            const activeMilestone = milestones.find((m: Milestone) => m.display_order === activeMilestoneIdx + 1);
            return activeMilestone && (
              <Task
                key={activeMilestone.id}
                milestone={activeMilestone}
                milestoneNumber={activeMilestoneIdx + 1}
                onOpenSubtask={onOpenSubtask}
                activeSubTask={activeSubTask}
              />
            )
          })()
        )}
      </div>
    </>
  );
}
