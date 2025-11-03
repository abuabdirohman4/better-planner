import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import MilestoneItem from './MilestoneItem';

interface Milestone {
  id: string;
  title: string;
  display_order: number;
  status?: 'TODO' | 'DONE';
}

interface MilestoneBarProps {
  milestones: Milestone[];
  newMilestoneInputs: string[];
  setNewMilestoneInputs: React.Dispatch<React.SetStateAction<string[]>>;
  newMilestoneLoading: boolean[];
  milestoneLoading: Record<string, boolean>;
  milestoneChanges: Record<string, boolean>;
  activeMilestoneIdx: number;
  setActiveMilestoneIdx: (idx: number) => void;
  handleSaveNewMilestone: (idx: number) => void;
  handleSaveMilestone: (id: string, val: string) => void;
  handleMilestoneChange: (id: string, newTitle: string) => void;
  onStatusToggle?: (id: string, currentStatus: 'TODO' | 'DONE') => void;
  onClearActiveMilestoneIdx?: () => void;
  handleDragEnd?: (event: DragEndEvent) => void;
}

export default function MilestoneBar({
  milestones,
  newMilestoneInputs,
  setNewMilestoneInputs,
  newMilestoneLoading,
  milestoneLoading,
  milestoneChanges,
  activeMilestoneIdx,
  setActiveMilestoneIdx,
  handleSaveNewMilestone,
  handleSaveMilestone,
  handleMilestoneChange,
  onStatusToggle,
  onClearActiveMilestoneIdx,
  handleDragEnd,
}: MilestoneBarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor)
  );

  // Sort milestones by display_order to ensure correct order
  const sortedMilestones = [...milestones].sort((a, b) => a.display_order - b.display_order);
  
  // Fill empty slots up to 3 - use sorted position instead of display_order value
  const allSlots = Array.from({ length: 3 }).map((_, idx) => {
    // Use sorted position: milestone at index idx should be displayed at slot idx
    const milestone = sortedMilestones[idx] || null;
    return { milestone, idx };
  });

  if (!handleDragEnd) {
    // Fallback: render without drag-and-drop if handler not provided
    return (
      <div className="flex flex-col gap-4 justify-center mb-6">
        {allSlots.map(({ milestone, idx }) => (
          <MilestoneItem
            key={milestone ? milestone.id : `empty-${idx}`}
            milestone={milestone || null}
            idx={idx}
            activeMilestoneIdx={activeMilestoneIdx}
            newMilestoneInputs={newMilestoneInputs}
            setNewMilestoneInputs={setNewMilestoneInputs}
            newMilestoneLoading={newMilestoneLoading}
            milestoneLoading={milestoneLoading}
            milestoneChanges={milestoneChanges}
            setActiveMilestoneIdx={setActiveMilestoneIdx}
            handleSaveNewMilestone={handleSaveNewMilestone}
            handleSaveMilestone={handleSaveMilestone}
            handleMilestoneChange={handleMilestoneChange}
            onStatusToggle={onStatusToggle}
            onClearActiveMilestoneIdx={onClearActiveMilestoneIdx}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sortedMilestones.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-4 justify-center mb-6">
          {allSlots.map(({ milestone, idx }) => (
            <MilestoneItem
              key={milestone ? milestone.id : `empty-${idx}`}
              milestone={milestone || null}
              idx={idx}
              activeMilestoneIdx={activeMilestoneIdx}
              newMilestoneInputs={newMilestoneInputs}
              setNewMilestoneInputs={setNewMilestoneInputs}
              newMilestoneLoading={newMilestoneLoading}
              milestoneLoading={milestoneLoading}
              milestoneChanges={milestoneChanges}
              setActiveMilestoneIdx={setActiveMilestoneIdx}
              handleSaveNewMilestone={handleSaveNewMilestone}
              handleSaveMilestone={handleSaveMilestone}
              handleMilestoneChange={handleMilestoneChange}
              onStatusToggle={onStatusToggle}
              onClearActiveMilestoneIdx={onClearActiveMilestoneIdx}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
