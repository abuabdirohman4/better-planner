import React, { useEffect } from 'react';
import Spinner from '@/components/ui/spinner/Spinner';
import { useMilestones } from './hooks/useMainQuestsSWR';
import MilestoneBar from './Milestone/components/MilestoneBar';
import Task from './Task';
import { TaskItemSkeleton, MilestoneItemSkeleton } from '@/components/ui/skeleton';

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
  showCompletedTasks: boolean;
}

export default function Milestone({ questId, activeSubTask, onOpenSubtask, showCompletedTasks }: MilestoneProps) {
  
  const {
    milestones,
    isLoading: loadingMilestones,
    mutate: refetchMilestones,
  } = useMilestones(questId);
  

  // For now, keep the old state management for milestone editing
  // TODO: Migrate milestone editing to use SWR and RPC
  const [newMilestoneInputs, setNewMilestoneInputs] = React.useState(['', '', '']);
  const [newMilestoneLoading, setNewMilestoneLoading] = React.useState([false, false, false]);
  const [milestoneLoading, setMilestoneLoading] = React.useState<Record<string, boolean>>({});
  const [milestoneChanges, setMilestoneChanges] = React.useState<Record<string, boolean>>({});
  const [activeMilestoneIdx, setActiveMilestoneIdx] = React.useState(0);

  // Import milestone actions for editing
  const { handleSaveNewMilestone, handleSaveMilestone, handleMilestoneChange } = React.useMemo(() => {
    // This is a temporary solution - we'll migrate these to RPC later
    return {
      handleSaveNewMilestone: async (idx: number) => {
        // Placeholder - will be implemented with RPC
      },
      handleSaveMilestone: async (id: string, val: string) => {
        // Placeholder - will be implemented with RPC
      },
      handleMilestoneChange: (id: string, newTitle: string) => {
        // Placeholder - will be implemented with RPC
      },
    };
  }, []);

  return (
    <>
      <label className='block mb-2 font-semibold'>3 Milestone (Goal Kecil) untuk mewujudkan High Focus Goal :</label>
      
      {loadingMilestones ? (
        <MilestoneItemSkeleton count={3} />
      ) : (
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
        ) : (
          (() => {
            // Find milestone with display_order matching activeMilestoneIdx + 1
            const activeMilestone = milestones.find((m: Milestone) => m.display_order === activeMilestoneIdx + 1);
            return activeMilestone && (
              <Task
                key={`task-${questId}`}
                milestone={activeMilestone}
                milestoneNumber={activeMilestoneIdx + 1}
                onOpenSubtask={onOpenSubtask}
                activeSubTask={activeSubTask}
                showCompletedTasks={showCompletedTasks}
              />
            )
          })()
        )}
      </div>
    </>
  );
}
