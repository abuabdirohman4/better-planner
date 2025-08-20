import { useState } from 'react';

import ComponentCard from '@/components/common/ComponentCard';

import MilestoneItem from './MilestoneItem';
import TaskDetailCard from './TaskDetailCard';

interface Milestone {
  id: string;
  title: string;
  display_order: number;
  tasks: Task[]; // Tasks sekarang menjadi bagian dari milestone
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  subtasks: Subtask[]; // Subtasks sekarang menjadi bagian dari task
}

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

// MilestoneBar component
function MilestoneBar({
  milestones,
  activeMilestoneIdx,
  setActiveMilestoneIdx,
}: {
  milestones: Milestone[];
  activeMilestoneIdx: number;
  setActiveMilestoneIdx: (idx: number) => void;
  // Hapus props yang tidak lagi digunakan
}) {
  return (
    <div className="flex flex-col gap-4 justify-center mb-6">
      {Array.from({ length: 3 }).map((_, idx) => {
        const milestone = milestones[idx];
        return (
          <div
            key={milestone ? milestone.id : idx}
            className={`w-full rounded-lg border px-4 py-3 transition-all duration-150 shadow-sm mb-0 bg-white dark:bg-gray-900 flex items-center gap-2 ${activeMilestoneIdx === idx ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700'}`}
            onClick={() => setActiveMilestoneIdx(idx)}
          >
            <span className="font-bold text-lg w-6 text-center select-none">{idx + 1}.</span>
            {milestone ? (
              <input
                readOnly
                className="border-none bg-transparent text-sm w-full font-semibold focus:outline-none focus:ring-0 cursor-pointer"
                value={milestone.title}
              />
            ) : (
              <p className="text-sm text-gray-400 w-full">Milestone belum dibuat</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QuestWorkspace({ quest }: { quest: { id: string; title: string; motivation?: string; milestones: Milestone[] } }) {
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const milestones = quest.milestones || [];

  const handleMotivationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMotivationValue(e.target.value);
    // Logika debounced save bisa tetap ada jika diperlukan
  };

  const activeMilestone = milestones[activeMilestoneIdx];

  return (
    <div className="flex gap-8">
      <div className="flex-1 max-w-2xl mx-auto">
        <ComponentCard title={quest.title} className='' classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pb-0">
          <label className='block mb-2 font-semibold'>Motivasi terbesar saya untuk mencapai Goal ini :</label>
          <textarea
            className="border rounded mb-4 px-2 py-1 text-sm w-full"
            value={motivationValue}
            onChange={handleMotivationChange}
            rows={3}
          />
          <label className='block mb-2 font-semibold'>3 Milestone (Goal Kecil) untuk mewujudkan High Focus Goal :</label>
          <MilestoneBar
            milestones={milestones}
            activeMilestoneIdx={activeMilestoneIdx}
            setActiveMilestoneIdx={setActiveMilestoneIdx}
          />
          <div className="space-y-4 mb-4">
            {activeMilestone ? (
              <MilestoneItem
                milestone={activeMilestone}
                onTaskSelect={setActiveTask}
                activeTask={activeTask}
              />
            ) : (
              <p className="text-gray-400">Pilih atau buat milestone untuk melihat detail tugas.</p>
            )}
          </div>
        </ComponentCard>
      </div>
      <div className="w-96">
        {!!activeTask && (
           <TaskDetailCard 
             task={activeTask}
             onBack={() => setActiveTask(null)}
           />
        )}
      </div>
    </div>
  );
} 