"use client";

import React, { useState, useEffect, useRef } from "react";
import { SideQuest } from "../types";
import { EyeIcon, EyeCloseIcon } from "@/lib/icons";
import Checkbox from "@/components/form/input/Checkbox";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

interface SideQuestListProps {
  quests: SideQuest[];
  isLoading: boolean;
  error?: string;
  onToggleStatus: (taskId: string, currentStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => Promise<void>;
  onUpdate: (taskId: string, updates: { title?: string; description?: string }) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const SideQuestList: React.FC<SideQuestListProps> = ({
  quests: sideQuests,
  isLoading,
  error,
  onToggleStatus: toggleStatus,
  onUpdate: updateQuest,
  onDelete: deleteQuest
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingQuest, setEditingQuest] = useState<SideQuest | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteQuestId, setDeleteQuestId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Initialize state with data from localStorage
  const getInitialExpandedItems = (): Set<string> => {
    if (typeof window === 'undefined') return new Set<string>();
    
    try {
      const expandedKey = 'sidequest-expanded';
      const saved = localStorage.getItem(expandedKey);
      if (saved) {
        const expandedArray: string[] = JSON.parse(saved);
        return new Set(expandedArray);
      }
    } catch (error) {
      console.warn('Failed to load initial expanded state:', error);
    }
    return new Set<string>();
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(getInitialExpandedItems);
  const isInitialLoad = useRef(true);
  
  // Cookie key untuk menyimpan expanded state
  const expandedKey = 'sidequest-expanded';

  // Save expanded state to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return; // Skip saving during initial load
    }
    
    try {
      const expandedArray = Array.from(expandedItems);
      localStorage.setItem(expandedKey, JSON.stringify(expandedArray));
    } catch (error) {
      console.warn('Failed to save expanded state to localStorage:', error);
    }
  }, [expandedItems, expandedKey]);

  // Filter side quests based on search term and completed status
  const filteredSideQuests = sideQuests.filter(quest => {
    const matchesSearch = quest.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quest.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompleted = showCompleted || quest.status !== 'DONE';
    return matchesSearch && matchesCompleted;
  });

  // Toggle expanded state
  const toggleExpanded = (questId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questId)) {
        newSet.delete(questId);
      } else {
        newSet.add(questId);
      }
      return newSet;
    });
  };

  // Handle edit quest
  const handleEditQuest = (quest: SideQuest) => {
    setEditingQuest(quest);
    setEditingTitle(quest.title || '');
  };

  // Handle save quest
  const handleSaveQuest = async () => {
    if (!editingQuest || !editingTitle.trim()) return;

    try {
      await updateQuest(editingQuest.id, { title: editingTitle.trim() });
      setEditingQuest(null);
      setEditingTitle('');
    } catch (error) {
      console.error("Failed to update quest:", error);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingQuest(null);
    setEditingTitle('');
  };

  // Handle delete quest
  const handleDeleteQuest = (questId: string) => {
    setDeleteQuestId(questId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteQuestId) return;

    setIsDeleting(true);
    try {
      await deleteQuest(deleteQuestId);
      setShowDeleteModal(false);
      setDeleteQuestId(null);
    } catch (error) {
      console.error("Failed to delete quest:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari side quest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className={`p-2 rounded-md transition-colors ${
            showCompleted
              ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          title={showCompleted ? 'Sembunyikan task yang sudah selesai' : 'Tampilkan task yang sudah selesai'}
        >
          {showCompleted ? (
            <EyeIcon className="w-5 h-5" />
          ) : (
            <EyeCloseIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Side Quest List */}
      {filteredSideQuests.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || !showCompleted
              ? 'Tidak ada side quest yang sesuai dengan filter' 
              : 'Belum ada side quest'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSideQuests.map((quest) => {
            const isExpanded = expandedItems.has(quest.id);
            const isEditing = editingQuest?.id === quest.id;
            
            return (
              <div key={quest.id} className="space-y-1">
                {/* Edit Form */}
                {isEditing ? (
                  <div className="flex items-center py-2 ml-2 space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                    {/* Checkbox (disabled for form) */}
                    <Checkbox
                      checked={false}
                      onChange={() => {}}
                      disabled
                    />

                    {/* Quest Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        placeholder="Masukkan side quest..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveQuest();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelEdit();
                          }
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {/* Save Button */}
                      <button
                        onClick={handleSaveQuest}
                        disabled={!editingTitle.trim()}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save quest"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>

                      {/* Cancel Button */}
                      <button
                        onClick={handleCancelEdit}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Quest Item */
                  <div className={`group relative flex items-center space-x-3 py-2 ml-2 text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded`}>
                    {/* Status Toggle Checkbox */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={quest.status === 'DONE'}
                        onChange={() => toggleStatus(quest.id, quest.status || 'TODO')}
                      />
                    </div>
                    
                    {/* Quest Title */}
                    <span className={`flex-1 text-sm font-medium ${
                      quest.status === 'DONE' 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {quest.title || 'Untitled Task'}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditQuest(quest)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit quest"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteQuest(quest.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete quest"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Expanded Content with Smooth Animation */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded 
                      ? 'max-h-96 opacity-100 transform translate-y-0' 
                      : 'max-h-0 opacity-0 transform -translate-y-2'
                  }`}
                >
                  <div className="ml-6 space-y-2 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
                    {quest.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {quest.description}
                      </p>
                    )}
                    {quest.due_date && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Due: {new Date(quest.due_date).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>Created: {quest.created_at ? new Date(quest.created_at).toLocaleDateString() : 'Unknown'}</span>
                      <span>Updated: {quest.updated_at ? new Date(quest.updated_at).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteQuestId(null);
        }}
        onConfirm={confirmDelete}
        title="Hapus Side Quest"
        message={`Apakah Anda yakin ingin menghapus side quest ini? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="sm"
      />
    </div>
  );
};

export default SideQuestList;
