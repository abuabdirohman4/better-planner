import React, { useEffect, useState, useMemo } from 'react';
import debounce from 'lodash/debounce';
import ComponentCard from '@/components/common/ComponentCard';
import CustomToast from '@/components/ui/toast/CustomToast';
import { addTask } from './actions/taskActions';
import { useSubtaskManagement } from './SubTask/hooks/useSubtaskManagement';
import { useSubtaskState } from './SubTask/hooks/useSubtaskState';
import { useSubtaskCRUD } from './SubTask/hooks/useSubtaskCRUD';
import { useSubtaskOperations } from './SubTask/hooks/useSubtaskOperations';
import SubtaskList from './SubTask/components/SubtaskList';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

// Custom hook for new subtask management
function useNewSubtaskManagement(taskId: string, milestoneId: string, subtasks: Subtask[], fetchSubtasks: () => void) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskLoading, setNewSubtaskLoading] = useState(false);

  const debouncedInsertNewSubtask = useMemo(() => debounce(async (title: string) => {
    if (!title) return;
    setNewSubtaskLoading(true);
    let newOrder = 1.0;
    if (subtasks.length > 0) {
      const lastOrder = subtasks[subtasks.length - 1].display_order;
      newOrder = lastOrder + 1.0;
    }
    try {
      const formData = new FormData();
      formData.append('parent_task_id', taskId);
      formData.append('title', title);
      formData.append('milestone_id', milestoneId);
      formData.append('display_order', String(newOrder));
      const res = await addTask(formData);
      if (res && res.task) {
        setNewSubtaskTitle('');
        fetchSubtasks();
        CustomToast.success(res.message || 'Sub-tugas berhasil ditambahkan');
      } else {
        CustomToast.error('Gagal menambah sub-tugas');
      }
    } catch {
      CustomToast.error('Gagal menambah sub-tugas');
    } finally {
      setNewSubtaskLoading(false);
    }
  }, 500), [taskId, milestoneId, subtasks, fetchSubtasks]);

  useEffect(() => {
    if (newSubtaskTitle) debouncedInsertNewSubtask(newSubtaskTitle);
  }, [newSubtaskTitle, debouncedInsertNewSubtask]);

  const handleBulkPasteEmpty = async (e: React.ClipboardEvent, handleSubtaskEnter: (idx: number, title?: string, subtasksOverride?: Subtask[]) => Promise<number | null>) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return;
    
    e.preventDefault();
    
    setNewSubtaskTitle(lines[0]);
    
    const localSubtasks = subtasks.map(st => ({ ...st }));
    for (let i = 1; i < lines.length; i++) {
      const idx = localSubtasks.length - 1;
      const newOrder = await handleSubtaskEnter(idx, lines[i], localSubtasks);
      if (newOrder !== null) {
        localSubtasks.push({
          id: `dummy-${i}`,
          title: lines[i],
          status: 'TODO' as const,
          display_order: newOrder,
        });
      }
    }
  };

  return {
    newSubtaskTitle,
    setNewSubtaskTitle,
    newSubtaskLoading,
    handleBulkPasteEmpty
  };
}

export default function SubTask({ task, onBack, milestoneId }: { task: { id: string; title: string; status: 'TODO' | 'DONE' }; onBack: () => void; milestoneId: string; }) {
  const { subtasks, setSubtasks, loadingSubtasks, fetchSubtasks } = useSubtaskManagement(task.id);
  const { focusSubtaskId, setFocusSubtaskId, draftTitles, setDraftTitles } = useSubtaskState();
  const { handleSubtaskEnter, handleCheck, handleDeleteSubtask: handleDeleteSubtaskCRUD } = useSubtaskCRUD(task.id, milestoneId, subtasks, setSubtasks);
  const { handleDraftTitleChange, handleDeleteSubtask, handleDragEnd, handleSubtaskEnterWithFocus } = useSubtaskOperations(
    task.id, 
    milestoneId, 
    subtasks, 
    setSubtasks, 
    draftTitles, 
    setDraftTitles, 
    focusSubtaskId, 
    setFocusSubtaskId, 
    handleSubtaskEnter, 
    handleCheck, 
    handleDeleteSubtaskCRUD
  );
  const { newSubtaskTitle, setNewSubtaskTitle, newSubtaskLoading, handleBulkPasteEmpty } = useNewSubtaskManagement(task.id, milestoneId, subtasks, fetchSubtasks);

  useEffect(() => {
    if (focusSubtaskId) {
      const idx = subtasks.findIndex(st => st.id === focusSubtaskId);
      if (idx !== -1) {
        // Focus logic can be added here if needed
      }
    }
  }, [focusSubtaskId, subtasks]);

  const handleBulkPasteEmptyWrapper = (e: React.ClipboardEvent) => {
    handleBulkPasteEmpty(e, handleSubtaskEnter);
  };

  return (
    <div className="flex-1 mx-auto">
      <ComponentCard 
        title={task.title} 
        className='' 
        classNameTitle='text-center text-xl !font-extrabold' 
        classNameHeader="pb-0"
        onClose={onBack}
      >
        <SubtaskList
          subtasks={subtasks}
          loadingSubtasks={loadingSubtasks}
          newSubtaskTitle={newSubtaskTitle}
          setNewSubtaskTitle={setNewSubtaskTitle}
          newSubtaskLoading={newSubtaskLoading}
          handleBulkPasteEmpty={handleBulkPasteEmptyWrapper}
          handleSubtaskEnter={handleSubtaskEnter}
          handleSubtaskEnterWithOverride={handleSubtaskEnterWithFocus}
          handleCheck={handleCheck}
          focusSubtaskId={focusSubtaskId}
          setFocusSubtaskId={setFocusSubtaskId}
          draftTitles={draftTitles}
          handleDraftTitleChange={handleDraftTitleChange}
          handleDeleteSubtask={handleDeleteSubtask}
          handleDragEnd={handleDragEnd}
        />
      </ComponentCard>
    </div>
  );
}
