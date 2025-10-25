import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import InputField from '@/components/form/input/InputField';
import SubtaskItem from './SubtaskItem';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  loadingSubtasks: boolean;
  newSubtaskTitle: string;
  setNewSubtaskTitle: (title: string) => void;
  newSubtaskLoading: boolean;
  handleAddNewSubtask: () => Promise<void>; // NEW: Manual add subtask function
  handleBulkPasteEmpty: (e: React.ClipboardEvent) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleSubtaskEnterWithOverride: (idx: number, title: string, subtasksOverride: Subtask[]) => Promise<number>;
  handleCheck: (subtask: Subtask) => void;
  focusSubtaskId: string | null;
  setFocusSubtaskId: (id: string | null) => void;
  draftTitles: Record<string, string>;
  handleDraftTitleChange: (id: string, val: string, immediate?: boolean) => void;
  handleDeleteSubtask: (id: string, idx: number) => Promise<void>;
  handleDragEnd: (event: DragEndEvent) => void;
}

export default function SubtaskList({
  subtasks,
  loadingSubtasks,
  newSubtaskTitle,
  setNewSubtaskTitle,
  newSubtaskLoading,
  handleAddNewSubtask,
  handleBulkPasteEmpty,
  handleSubtaskEnter,
  handleSubtaskEnterWithOverride,
  handleCheck,
  focusSubtaskId,
  setFocusSubtaskId,
  draftTitles,
  handleDraftTitleChange,
  handleDeleteSubtask,
  handleDragEnd
}: SubtaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  return (
    <div className="mb-4">
      <div className="font-semibold mb-2">List quest untuk langkah ini:</div>
      {loadingSubtasks ? (
        <p className="text-gray-400 text-sm">Memuat sub-tugas...</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subtasks.map(st => st.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2 mt-2">
              {subtasks.map((subtask, idx) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  idx={idx}
                  setEditSubtaskId={() => {}}
                  setFocusSubtaskId={setFocusSubtaskId}
                  handleSubtaskEnter={handleSubtaskEnter}
                  handleSubtaskEnterWithOverride={handleSubtaskEnterWithOverride}
                  handleCheck={handleCheck}
                  shouldFocus={focusSubtaskId === subtask.id}
                  clearFocusSubtaskId={() => setFocusSubtaskId(null)}
                  draftTitle={draftTitles[subtask.id] ?? subtask.title ?? ''}
                  onDraftTitleChange={(val: string, immediate?: boolean) => handleDraftTitleChange(subtask.id, val, immediate)}
                  subtaskIds={subtasks.map(st => st.id)}
                  handleDeleteSubtask={handleDeleteSubtask}
                />
              ))}
              {/* Add new subtask input - always visible like Task.tsx */}
              <div className="flex items-center gap-2 mt-2 bg-white dark:bg-gray-900 rounded-lg pl-2 pr-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
                <input
                  className="border rounded px-2 py-1 text-sm flex-1 w-full bg-white dark:bg-gray-900 font-medium focus:outline-none transition-all"
                  value={newSubtaskTitle}
                  onChange={e => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewSubtask();
                    }
                  }}
                  onPaste={handleBulkPasteEmpty}
                  placeholder="Tambah sub-tugas baru..."
                  disabled={newSubtaskLoading}
                />
                <button
                  onClick={handleAddNewSubtask}
                  disabled={!newSubtaskTitle.trim() || newSubtaskLoading}
                  className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
                  title="Klik untuk menyimpan atau tekan Enter"
                >
                  {newSubtaskLoading ? (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
