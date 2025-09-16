import debounce from 'lodash/debounce';
import { useState, useMemo } from 'react';

import ComponentCard from '@/components/common/ComponentCard';

import { updateQuestMotivation } from '../quests/actions';

import Milestone from './Milestone';
import SubTask from './SubTask';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

export default function Quest({ quest }: { quest: { id: string; title: string; motivation?: string } }) {
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [activeSubTask, setActiveSubTask] = useState<Task | null>(null);

  const handleMotivationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMotivationValue(e.target.value);
    debouncedSaveMotivation(e.target.value);
  };

  // Debounced auto-save
  const debouncedSaveMotivation = useMemo(() => debounce(async (val: string) => {
    try {
      await updateQuestMotivation(quest.id, val);
    } catch {}
  }, 1500), [quest.id]);

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
          <Milestone 
            questId={quest.id}
            activeSubTask={activeSubTask}
            onOpenSubtask={setActiveSubTask}
          />
        </ComponentCard>
      </div>
      {activeSubTask ? <div className="flex-1 max-w-2xl">
          <SubTask
            task={activeSubTask}
            onBack={() => setActiveSubTask(null)}
            milestoneId=""
          />
        </div> : null}
    </div>
  );
} 