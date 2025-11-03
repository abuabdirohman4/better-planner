import React, { useEffect, useRef, useState } from 'react';
import Checkbox from '@/components/form/input/Checkbox';

interface Subtask {
  id: string;
  title: string;
  status: 'TODO' | 'DONE';
  display_order: number;
}

interface SubtaskInputProps {
  subtask: Subtask;
  idx: number;
  setEditSubtaskId: (id: string) => void;
  setFocusSubtaskId: (id: string | null) => void;
  handleSubtaskEnter: (idx: number, title?: string) => void;
  handleSubtaskEnterWithOverride?: (idx: number, title: string, subtasksOverride: Subtask[]) => Promise<number>;
  handleCheck: (subtask: Subtask) => void;
  shouldFocus: boolean;
  clearFocusSubtaskId: () => void;
  draftTitle: string;
  onDraftTitleChange: (val: string, immediate?: boolean) => void;
  subtaskIds: string[];
  handleDeleteSubtask: (id: string, idx: number) => void;
}

export default function SubtaskInput({ 
  subtask, 
  idx, 
  setEditSubtaskId, 
  setFocusSubtaskId, 
  handleSubtaskEnter, 
  handleSubtaskEnterWithOverride, 
  handleCheck, 
  shouldFocus, 
  clearFocusSubtaskId, 
  draftTitle, 
  onDraftTitleChange, 
  subtaskIds, 
  handleDeleteSubtask 
}: SubtaskInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Add new states for edit button system
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalTitle, setOriginalTitle] = useState<string>(draftTitle);
  
  // Check if subtask has content
  const hasContent = subtask.title.trim().length > 0;
  
  // Sync originalTitle with draftTitle when subtask changes (but not when editing)
  useEffect(() => {
    if (!isEditing) {
      setOriginalTitle(draftTitle);
    }
  }, [draftTitle, isEditing]);
  
  // Handle edit change - track changes against originalTitle
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onDraftTitleChange(newValue, false); // Don't save immediately
    setHasChanges(newValue.trim() !== originalTitle.trim());
    setIsEditing(true);
  };

  // Handle save button click
  const handleSave = async () => {
    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    
    setIsSaving(true);
    setIsEditing(false);
    
    try {
      await onDraftTitleChange(draftTitle, true); // This will do optimistic update
      setOriginalTitle(draftTitle); // Update originalTitle to new saved value
      setHasChanges(false);
    } catch (error) {
      // Error already handled in handleDraftTitleChange
      setIsEditing(true);
      setHasChanges(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle text click to enter edit mode
  const handleTextClick = () => {
    if (hasContent) {
      setOriginalTitle(draftTitle); // Set originalTitle when entering edit mode
      setIsEditing(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };
  
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      // 🔧 FIX: Add small delay to prevent focus glitch during rapid changes
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [shouldFocus]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return;
    
    e.preventDefault();
    
    const firstLine = lines[0];
    const remainingLines = lines.slice(1);
    
    const newTitle = draftTitle + firstLine;
    onDraftTitleChange(newTitle, true);
    
    const localSubtasks = subtaskIds.map((id) => ({
      id,
      title: '',
      status: 'TODO' as const,
      display_order: 0,
    }));
    if (handleSubtaskEnterWithOverride) {
      for (let i = 0; i < remainingLines.length; i++) {
        const idx = localSubtasks.length - 1;
        const newOrder = await handleSubtaskEnterWithOverride(idx, remainingLines[i], localSubtasks);
        localSubtasks.push({
          id: `dummy-paste-${i}`,
          title: remainingLines[i],
          status: 'TODO' as const,
          display_order: newOrder,
        });
      }
    } else {
      for (let i = 0; i < remainingLines.length; i++) {
        handleSubtaskEnter(idx, remainingLines[i]);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {hasContent && !isEditing ? (
        // Display mode - show text span with draftTitle
        <div className="flex items-center justify-between w-full gap-2">
          <span 
            className={`border rounded px-2 py-1 text-sm flex-1 cursor-text focus:outline-none transition-all ${
              subtask.status === 'DONE' ? 'line-through text-gray-400' : ''
            }`}
            onClick={handleTextClick}
          >
            {draftTitle}  {/* CHANGED: Use draftTitle instead of subtask.title */}
          </span>
          <Checkbox checked={subtask.status === 'DONE'} onChange={() => handleCheck(subtask)} />
        </div>
      ) : (
        // Edit mode - show input + Edit button
        <div className="flex items-center w-full gap-2">
          <input
            className={`border rounded px-2 py-1 text-sm flex-1 w-full focus:outline-none focus:ring-0 ${
              subtask.status === 'DONE' ? 'line-through text-gray-400' : ''
            }`}
            value={draftTitle}
            onChange={handleEditChange}
            onPaste={(e) => handlePaste(e)}
            onFocus={() => {
              setEditSubtaskId(subtask.id);
              setFocusSubtaskId(subtask.id);
              setOriginalTitle(draftTitle); // Set originalTitle when entering edit mode via focus
            }}
            onBlur={e => {
              const next = e.relatedTarget as HTMLElement | null;
              if (!next || next.tagName !== 'INPUT') {
                clearFocusSubtaskId();
              }
              if (hasChanges) {
                handleSave();
              } else {
                setIsEditing(false);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleCheck(subtask);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSave(); // Save on Enter
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (idx > 0) {
                  setFocusSubtaskId(subtaskIds[idx - 1]);
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (idx < subtaskIds.length - 1) {
                  setFocusSubtaskId(subtaskIds[idx + 1]);
                }
              } else if ((e.key === 'Backspace' || e.key === 'Delete') && draftTitle === '') {
                e.preventDefault();
                handleDeleteSubtask(subtask.id, idx);
              }
            }}
            ref={inputRef}
          />
          {isEditing && (
            <div className="flex items-center gap-2">
              {/* Edit/Save Button */}
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
              
              {/* Delete Button */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur when clicking delete
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSubtask(subtask.id, idx);
                }}
                className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-1 w-16 justify-center"
                title="Hapus subtask"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
