import debounce from 'lodash/debounce';
import { useEffect, useState, useMemo } from 'react';

import ComponentCard from '@/components/common/ComponentCard';

import { updateQuestMotivation, updateMilestone, getMilestonesForQuest } from '../quests/actions';

import MilestoneItem from './MilestoneItem';
import TaskDetailCard from './TaskDetailCard';

interface Milestone {
  id: string;
  title: string;
  display_order: number;
}

interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
}

export default function QuestWorkspace({ quest }: { quest: { id: string; title: string; motivation?: string } }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [newMilestoneInputs, setNewMilestoneInputs] = useState(['', '', '']);
  const [newMilestoneLoading, setNewMilestoneLoading] = useState([false, false, false]);
  const [lastSubmittedMilestone, setLastSubmittedMilestone] = useState(['', '', '']);
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [activeSubTask, setActiveSubTask] = useState<Task | null>(null);

  // Debounced auto-save
  const debouncedSaveMotivation = useMemo(() => debounce(async (val: string) => {
    try {
      await updateQuestMotivation(quest.id, val);
    } catch {}
  }, 1500), [quest.id]);

  // Debounced auto-save milestone title
  const debouncedSaveMilestone = useMemo(() => 
    debounce(async (id: string, val: string) => {
      try {
        await updateMilestone(id, val);
      } catch {}
    }, 1500)
  , []);

  const fetchMilestones = async () => {
    setLoadingMilestones(true);
    try {
      const data = await getMilestonesForQuest(quest.id);
      setMilestones(data || []);
    } finally {
      setLoadingMilestones(false);
    }
  };

  // Debounce submit milestone berbasis useEffect per slot (3 useEffect terpisah)
  useEffect(() => {
    const val = newMilestoneInputs[0];
    if (!val || val === lastSubmittedMilestone[0]) return;
    const handler = setTimeout(async () => {
      setNewMilestoneLoading(l => l.map((v, i) => i === 0 ? true : v));
      try {
        const formData = new FormData();
        formData.append('quest_id', quest.id);
        formData.append('title', val);
        fetchMilestones();
        setNewMilestoneInputs(inputs => inputs.map((v, i) => i === 0 ? '' : v));
        setLastSubmittedMilestone(vals => vals.map((v, i) => i === 0 ? val : v));
      } finally {
        setNewMilestoneLoading(l => l.map((v, i) => i === 0 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMilestoneInputs[0], quest.id]);

  useEffect(() => {
    const val = newMilestoneInputs[1];
    if (!val || val === lastSubmittedMilestone[1]) return;
    const handler = setTimeout(async () => {
      setNewMilestoneLoading(l => l.map((v, i) => i === 1 ? true : v));
      try {
        const formData = new FormData();
        formData.append('quest_id', quest.id);
        formData.append('title', val);
        fetchMilestones();
        setNewMilestoneInputs(inputs => inputs.map((v, i) => i === 1 ? '' : v));
        setLastSubmittedMilestone(vals => vals.map((v, i) => i === 1 ? val : v));
      } finally {
        setNewMilestoneLoading(l => l.map((v, i) => i === 1 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMilestoneInputs[1], quest.id]);

  useEffect(() => {
    const val = newMilestoneInputs[2];
    if (!val || val === lastSubmittedMilestone[2]) return;
    const handler = setTimeout(async () => {
      setNewMilestoneLoading(l => l.map((v, i) => i === 2 ? true : v));
      try {
        const formData = new FormData();
        formData.append('quest_id', quest.id);
        formData.append('title', val);
        fetchMilestones();
        setNewMilestoneInputs(inputs => inputs.map((v, i) => i === 2 ? '' : v));
        setLastSubmittedMilestone(vals => vals.map((v, i) => i === 2 ? val : v));
      } finally {
        setNewMilestoneLoading(l => l.map((v, i) => i === 2 ? false : v));
      }
    }, 1500);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMilestoneInputs[2], quest.id]);

  const handleMotivationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMotivationValue(e.target.value);
    debouncedSaveMotivation(e.target.value);
  };

  useEffect(() => {
    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.id]);

  // MilestoneBar: 3 milestone vertical
  const renderMilestoneBar = () => (
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
                className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-900 font-semibold focus:outline-none focus:ring-0"
                value={milestone.title}
                onChange={e => {
                  const newTitle = e.target.value;
                  setMilestones(ms => ms.map((m, i) => i === idx ? { ...m, title: newTitle } : m));
                  debouncedSaveMilestone(milestone.id, newTitle);
                }}
                onClick={e => e.stopPropagation()}
                onFocus={() => setActiveMilestoneIdx(idx)}
              />
            ) : (
              <input
                className="border rounded px-2 py-2 text-sm w-full bg-white dark:bg-gray-900 focus:outline-none focus:ring-0"
                placeholder={`Tambah milestone ${idx + 1}...`}
                value={newMilestoneInputs[idx]}
                onChange={e => {
                  const val = e.target.value;
                  setNewMilestoneInputs(inputs => inputs.map((v, i) => i === idx ? val : v));
                }}
                disabled={newMilestoneLoading[idx]}
                onClick={e => e.stopPropagation()}
                onFocus={() => setActiveMilestoneIdx(idx)}
              />
            )}
          </div>
        );
      })}
    </div>
  );

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
          {renderMilestoneBar()}
          <div className="space-y-4 mb-4">
            {loadingMilestones ? (
              <p className="text-gray-400">Memuat milestone...</p>
            ) : (
              milestones[activeMilestoneIdx] ? (
                <MilestoneItem
                  key={milestones[activeMilestoneIdx].id}
                  milestone={milestones[activeMilestoneIdx]}
                  milestoneNumber={activeMilestoneIdx + 1}
                  onOpenSubtask={setActiveSubTask}
                  activeSubTask={activeSubTask}
                />
              ) : (
                <p className="text-gray-400">Belum ada milestone untuk quest ini.</p>
              )
            )}
          </div>
        </ComponentCard>
      </div>
      {activeSubTask ? <div className="flex-1 max-w-2xl">
          <TaskDetailCard
            task={activeSubTask}
            onBack={() => setActiveSubTask(null)}
            milestoneId={milestones[activeMilestoneIdx]?.id || ''}
          />
        </div> : null}
    </div>
  );
} 