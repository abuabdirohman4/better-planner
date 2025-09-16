import { useState, useCallback, useEffect } from 'react';

import { updateMilestone, getMilestonesForQuest, addMilestone } from '../quests/actions';

import Task from './Task';

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

interface MilestoneProps {
  questId: string;
  activeSubTask: Task | null;
  onOpenSubtask: (task: Task) => void;
}

// MilestoneBar component
function MilestoneBar({
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
  handleMilestoneChange
}: {
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
                  className="border rounded px-2 py-2 text-sm flex-1 bg-white dark:bg-gray-900 font-semibold focus:outline-none transition-all"
                  value={milestone.title}
                   onChange={e => {
                     const newTitle = e.target.value;
                     handleMilestoneChange(milestone.id, newTitle);
                   }}
                  onKeyDown={e => {
                    // Prevent Enter key if button is disabled
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (milestoneChanges[milestone.id] && !milestoneLoading[milestone.id]) {
                        handleSaveMilestone(milestone.id, milestone.title);
                      }
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
                   disabled={!milestoneChanges[milestone.id] || milestoneLoading[milestone.id]}
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

export default function Milestone({ questId, activeSubTask, onOpenSubtask }: MilestoneProps) {
  // Milestone state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [originalMilestones, setOriginalMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [newMilestoneInputs, setNewMilestoneInputs] = useState(['', '', '']);
  const [newMilestoneLoading, setNewMilestoneLoading] = useState([false, false, false]);
  const [milestoneLoading, setMilestoneLoading] = useState<Record<string, boolean>>({});
  const [milestoneChanges, setMilestoneChanges] = useState<Record<string, boolean>>({});
  const [activeMilestoneIdx, setActiveMilestoneIdx] = useState(0);

  // Fetch milestones
  const fetchMilestones = useCallback(async () => {
    setLoadingMilestones(true);
    try {
      const data = await getMilestonesForQuest(questId);
      const sortedData = data?.sort((a, b) => a.display_order - b.display_order) || [];
      setMilestones(sortedData);
      setOriginalMilestones(sortedData);
    } finally {
      setLoadingMilestones(false);
    }
  }, [questId]);

  // Save new milestone
  const handleSaveNewMilestone = async (idx: number) => {
    const val = newMilestoneInputs[idx];
    if (!val.trim()) return;

    setNewMilestoneLoading(l => l.map((v, i) => i === idx ? true : v));
    try {
      const formData = new FormData();
      formData.append('quest_id', questId);
      formData.append('title', val.trim());
      formData.append('display_order', String(idx + 1));
      await addMilestone(formData);
      fetchMilestones();
      setNewMilestoneInputs(inputs => inputs.map((v, i) => i === idx ? '' : v));
    } catch (error) {
      console.error('Failed to save milestone:', error);
    } finally {
      setNewMilestoneLoading(l => l.map((v, i) => i === idx ? false : v));
    }
  };

  // Save existing milestone
  const handleSaveMilestone = async (id: string, val: string) => {
    setMilestoneLoading(prev => ({ ...prev, [id]: true }));
    try {
      await updateMilestone(id, val);
      setMilestoneChanges(prev => ({ ...prev, [id]: false }));
      fetchMilestones();
    } catch (error) {
      console.error('Failed to save milestone:', error);
    } finally {
      setMilestoneLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // Handle milestone title change
  const handleMilestoneChange = (id: string, newTitle: string) => {
    setMilestones(ms => ms.map(m => m.id === id ? { ...m, title: newTitle } : m));
    const originalMilestone = originalMilestones.find(m => m.id === id);
    setMilestoneChanges(prev => ({ 
      ...prev, 
      [id]: newTitle.trim() !== originalMilestone?.title && newTitle.trim() !== '' 
    }));
  };

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
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          (() => {
            // Find milestone with display_order matching activeMilestoneIdx + 1
            const activeMilestone = milestones.find(m => m.display_order === activeMilestoneIdx + 1);
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
