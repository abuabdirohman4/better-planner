import debounce from 'lodash/debounce';
import { useEffect, useState, useMemo, useCallback } from 'react';

import ComponentCard from '@/components/common/ComponentCard';

import { updateQuestMotivation, updateMilestone, getMilestonesForQuest, addMilestone } from '../quests/actions';

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

// Custom hook for milestone state and logic
function useMilestoneState(questId: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [newMilestoneInputs, setNewMilestoneInputs] = useState(['', '', '']);
  const [newMilestoneLoading, setNewMilestoneLoading] = useState([false, false, false]);
  const [milestoneLoading, setMilestoneLoading] = useState<Record<string, boolean>>({});

  const fetchMilestones = useCallback(async () => {
    setLoadingMilestones(true);
    try {
      const data = await getMilestonesForQuest(questId);
      // Sort by display_order to ensure correct positioning
      const sortedData = data?.sort((a, b) => a.display_order - b.display_order) || [];
      setMilestones(sortedData);
    } finally {
      setLoadingMilestones(false);
    }
  }, [questId]);

  // Function to save new milestone
  const handleSaveNewMilestone = async (idx: number) => {
    const val = newMilestoneInputs[idx];
    if (!val.trim()) return;

    setNewMilestoneLoading(l => l.map((v, i) => i === idx ? true : v));
    try {
      const formData = new FormData();
      formData.append('quest_id', questId);
      formData.append('title', val.trim());
      formData.append('display_order', String(idx + 1)); // Kirim posisi yang sesuai (1-based)
      await addMilestone(formData);
      fetchMilestones();
      setNewMilestoneInputs(inputs => inputs.map((v, i) => i === idx ? '' : v));
    } catch (error) {
      console.error('Failed to save milestone:', error);
    } finally {
      setNewMilestoneLoading(l => l.map((v, i) => i === idx ? false : v));
    }
  };

  // Function to save existing milestone
  const handleSaveMilestone = async (id: string, val: string) => {
    setMilestoneLoading(prev => ({ ...prev, [id]: true }));
    try {
      await updateMilestone(id, val);
      // Refresh data setelah update untuk memastikan sync
      fetchMilestones();
    } catch (error) {
      console.error('Failed to save milestone:', error);
    } finally {
      setMilestoneLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [questId, fetchMilestones]);

  return {
    milestones,
    setMilestones,
    loadingMilestones,
    newMilestoneInputs,
    setNewMilestoneInputs,
    newMilestoneLoading,
    setNewMilestoneLoading,
    milestoneLoading,
    handleSaveNewMilestone,
    handleSaveMilestone,
    fetchMilestones
  };
}

// MilestoneBar component
function MilestoneBar({
  milestones,
  setMilestones,
  newMilestoneInputs,
  setNewMilestoneInputs,
  newMilestoneLoading,
  milestoneLoading,
  activeMilestoneIdx,
  setActiveMilestoneIdx,
  handleSaveNewMilestone,
  handleSaveMilestone
}: {
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  newMilestoneInputs: string[];
  setNewMilestoneInputs: React.Dispatch<React.SetStateAction<string[]>>;
  newMilestoneLoading: boolean[];
  milestoneLoading: Record<string, boolean>;
  activeMilestoneIdx: number;
  setActiveMilestoneIdx: (idx: number) => void;
  handleSaveNewMilestone: (idx: number) => void;
  handleSaveMilestone: (id: string, val: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 justify-center mb-6">
      {Array.from({ length: 3 }).map((_, idx) => {
        // Find milestone with display_order matching this position (1-based)
        const milestone = milestones.find(m => m.display_order === idx + 1);
        return (
          <div
            key={milestone ? milestone.id : `empty-${idx}`}
            className={`w-full rounded-lg border px-4 py-3 transition-all duration-150 shadow-sm mb-0 bg-white dark:bg-gray-900 flex items-center gap-2 group hover:shadow-md ${activeMilestoneIdx === idx ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveMilestoneIdx(idx)}
          >
            <span className="font-bold text-lg w-6 text-center select-none">{idx + 1}.</span>
            {milestone ? (
              <div className="flex gap-2 w-full">
                <input
                  className="border rounded px-2 py-2 text-sm flex-1 bg-white dark:bg-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                  value={milestone.title}
                  onChange={e => {
                    const newTitle = e.target.value;
                    setMilestones(ms => ms.map(m => m.id === milestone.id ? { ...m, title: newTitle } : m));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveMilestone(milestone.id, milestone.title);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (idx > 0) {
                        setActiveMilestoneIdx(idx - 1);
                        // Focus the input in the previous milestone
                        setTimeout(() => {
                          const prevInput = document.querySelector(`input[data-milestone-idx="${idx - 1}"]`) as HTMLInputElement;
                          prevInput?.focus();
                        }, 0);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (idx < 2) {
                        setActiveMilestoneIdx(idx + 1);
                        // Focus the input in the next milestone
                        setTimeout(() => {
                          const nextInput = document.querySelector(`input[data-milestone-idx="${idx + 1}"]`) as HTMLInputElement;
                          nextInput?.focus();
                        }, 0);
                      }
                    }
                  }}
                  onClick={e => e.stopPropagation()}
                  onFocus={() => setActiveMilestoneIdx(idx)}
                  data-milestone-idx={idx}
                  placeholder=""
                />
                <button
                  onClick={() => handleSaveMilestone(milestone.id, milestone.title)}
                  disabled={milestoneLoading[milestone.id]}
                  className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
                  title="Klik untuk menyimpan atau tekan Enter"
                >
                  {milestoneLoading[milestone.id] ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Editing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <input
                  className="border rounded px-2 py-2 text-sm flex-1 bg-white dark:bg-gray-900 focus:outline-none focus:ring-0"
                  placeholder={`Tambah milestone ${idx + 1}...`}
                  value={newMilestoneInputs[idx]}
                  onChange={e => {
                    const val = e.target.value;
                    setNewMilestoneInputs(inputs => inputs.map((v, i) => i === idx ? val : v));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSaveNewMilestone(idx);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (idx > 0) {
                        setActiveMilestoneIdx(idx - 1);
                        // Focus the input in the previous milestone
                        setTimeout(() => {
                          const prevInput = document.querySelector(`input[data-milestone-idx="${idx - 1}"]`) as HTMLInputElement;
                          prevInput?.focus();
                        }, 0);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (idx < 2) {
                        setActiveMilestoneIdx(idx + 1);
                        // Focus the input in the next milestone
                        setTimeout(() => {
                          const nextInput = document.querySelector(`input[data-milestone-idx="${idx + 1}"]`) as HTMLInputElement;
                          nextInput?.focus();
                        }, 0);
                      }
                    }
                  }}
                  disabled={newMilestoneLoading[idx]}
                  onClick={e => e.stopPropagation()}
                  onFocus={() => setActiveMilestoneIdx(idx)}
                  data-milestone-idx={idx}
                />
                <button
                  onClick={() => handleSaveNewMilestone(idx)}
                  disabled={!newMilestoneInputs[idx].trim() || newMilestoneLoading[idx]}
                  className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
                >
                  {newMilestoneLoading[idx] ? (
                    <>
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function QuestWorkspace({ quest }: { quest: { id: string; title: string; motivation?: string } }) {
  const [motivationValue, setMotivationValue] = useState(quest.motivation || '');
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);
  const [activeSubTask, setActiveSubTask] = useState<Task | null>(null);

  const {
    milestones,
    setMilestones,
    loadingMilestones,
    newMilestoneInputs,
    setNewMilestoneInputs,
    newMilestoneLoading,
    milestoneLoading,
    handleSaveNewMilestone,
    handleSaveMilestone
  } = useMilestoneState(quest.id);

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
          <label className='block mb-2 font-semibold'>3 Milestone (Goal Kecil) untuk mewujudkan High Focus Goal :</label>
          <MilestoneBar
            milestones={milestones}
            setMilestones={setMilestones}
            newMilestoneInputs={newMilestoneInputs}
            setNewMilestoneInputs={setNewMilestoneInputs}
            newMilestoneLoading={newMilestoneLoading}
            milestoneLoading={milestoneLoading}
            activeMilestoneIdx={activeMilestoneIdx}
            setActiveMilestoneIdx={setActiveMilestoneIdx}
            handleSaveNewMilestone={handleSaveNewMilestone}
            handleSaveMilestone={handleSaveMilestone}
          />
          <div className="space-y-4 mb-4">
            {loadingMilestones ? (
              <p className="text-gray-400">Memuat milestone...</p>
            ) : (
              (() => {
                // Find milestone with display_order matching activeMilestoneIdx + 1
                const activeMilestone = milestones.find(m => m.display_order === activeMilestoneIdx + 1);
                return activeMilestone ? (
                  <MilestoneItem
                    key={activeMilestone.id}
                    milestone={activeMilestone}
                    milestoneNumber={activeMilestoneIdx + 1}
                    onOpenSubtask={setActiveSubTask}
                    activeSubTask={activeSubTask}
                  />
                ) : (
                  <p className="text-gray-400">Belum ada milestone untuk quest ini.</p>
                );
              })()
            )}
          </div>
        </ComponentCard>
      </div>
      {activeSubTask ? <div className="flex-1 max-w-2xl">
          <TaskDetailCard
            task={activeSubTask}
            onBack={() => setActiveSubTask(null)}
            milestoneId={milestones.find(m => m.display_order === activeMilestoneIdx + 1)?.id || ''}
          />
        </div> : null}
    </div>
  );
} 