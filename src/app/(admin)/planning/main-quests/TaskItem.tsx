"use client";
import { useState, useRef } from 'react';

// import Checkbox from '@/components/form/input/Checkbox';
import { updateTask } from '../quests/actions';

interface TaskItemProps {
  task: { id: string; title: string; status: 'TODO' | 'DONE' };
  onOpenSubtask?: () => void;
  orderNumber?: number;
  active?: boolean;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  canNavigateUp?: boolean;
  canNavigateDown?: boolean;
  onSelect?: () => void;
}

export default function TaskItem({ 
  task, 
  onOpenSubtask, 
  orderNumber, 
  active, 
  onNavigateUp, 
  onNavigateDown, 
  canNavigateUp = true, 
  canNavigateDown = true,
  onSelect
}: TaskItemProps) {
  const [editValue, setEditValue] = useState(task.title);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const editInputRef = useRef<HTMLInputElement | null>(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasChanges(newValue.trim() !== task.title);
  };

  const handleSave = async () => {
    if (editValue.trim() === task.title) {
      setHasChanges(false);
      return; // No changes
    }
    
    setIsSaving(true);
    try {
      await updateTask(task.id, editValue.trim());
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div 
      className={`flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg mb-3 pl-2 pr-4 py-2 shadow-sm border transition group hover:shadow-md cursor-pointer ${active ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
      onClick={() => onSelect?.()}
    >
      <div className='flex gap-2 w-full items-center'>
        {orderNumber ? <span className="font-medium text-lg w-6 text-center select-none">{orderNumber}.</span> : null}
        <input
          className="border rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
          value={editValue}
          onChange={handleEditChange}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleSave();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (canNavigateUp && onNavigateUp) {
                onNavigateUp();
              }
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (canNavigateDown && onNavigateDown) {
                onNavigateDown();
              }
            }
          }}
          onBlur={() => {
            if (hasChanges) {
              handleSave();
            }
          }}
          onClick={e => {
            e.stopPropagation();
            onOpenSubtask?.();
          }}
          onFocus={() => {
            onSelect?.();
            onOpenSubtask?.();
          }}
          ref={editInputRef}
          data-task-idx={orderNumber ? orderNumber - 1 : 0}
          placeholder=""
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSave();
          }}
          disabled={!hasChanges || isSaving}
          className="px-3 py-1.5 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1 w-16 justify-center"
          title="Klik untuk menyimpan atau tekan Enter"
        >
          {isSaving ? (
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
    </div>
  );
} 