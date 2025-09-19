import { useState } from 'react';

import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';

import { updateQuestMotivation } from './actions/questActions';

import Milestone from './Milestone';
import SubTask from './SubTask';

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

interface QuestProps {
  id: string;
  title: string;
  motivation?: string;
}

export default function Quest({ quest }: { quest: QuestProps }) {
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [activeSubTask, setActiveSubTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveMotivation = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await updateQuestMotivation(quest.id, motivationValue);
    } catch (error) {
      console.error('Failed to save motivation:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Cmd + Enter (Mac) or Ctrl + Enter (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveMotivation();
    }
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 max-w-2xl mx-auto">
        <ComponentCard title={quest.title} className='' classNameTitle='text-center text-xl !font-extrabold' classNameHeader="pb-0">
          <label className='block mb-2 font-semibold'>Motivasi terbesar saya untuk mencapai Goal ini :</label>
          <textarea
            className="border rounded mb-0 px-2 py-1 text-sm w-full"
            value={motivationValue}
            onChange={(e) => setMotivationValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="flex justify-end mb-3">
            <Button
              onClick={handleSaveMotivation}
              disabled={isSaving}
              size="xs"
              variant="primary"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
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