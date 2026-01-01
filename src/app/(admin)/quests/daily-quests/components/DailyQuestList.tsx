"use client";

import React, { useState, useMemo, useEffect } from "react";
import { DailyQuest } from "../types";
import { EyeIcon, EyeCloseIcon } from "@/lib/icons";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";
import { addDailyQuest } from "@/app/(admin)/execution/daily-sync/DailyQuest/actions/dailyQuestActions";
import { toast } from "sonner";
import Button from "@/components/ui/button/Button";

interface DailyQuestListProps {
  quests: DailyQuest[];
  isLoading: boolean;
  error?: string;
  showAddForm?: boolean;
  onAddFormClose?: () => void;
  onUpdate: (taskId: string, updates: Partial<DailyQuest>) => Promise<void>;
  onArchive: (taskId: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  refetch?: () => void;
}

const DailyQuestList: React.FC<DailyQuestListProps> = ({
  quests: dailyQuests,
  isLoading,
  error,
  showAddForm = false,
  onAddFormClose,
  onUpdate: updateQuest,
  onArchive: archiveQuest,
  onDelete: deleteQuest,
  refetch = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'session' | 'no-session'>('session');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false); // false = hide archived, true = show all
  const [editingQuest, setEditingQuest] = useState<DailyQuest | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveQuestId, setArchiveQuestId] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteQuestId, setDeleteQuestId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter based on tab, archived status, and search term
  const filteredQuests = useMemo(() => {
    const sorted = [...dailyQuests].sort((a, b) => {
      // Archived items always at bottom
      if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
      return 0;
    });

    return sorted.filter(quest => {
      // Tab filter
      const isSession = (quest.focus_duration || 0) > 0;
      const tabMatch = activeTab === 'session' ? isSession : !isSession;

      // Archived filter: 
      // showAll === true -> match everything
      // showAll === false -> match only !is_archived
      const archiveMatch = showAll ? true : !quest.is_archived;

      // Search filter
      const searchMatch = quest.title?.toLowerCase().includes(searchTerm.toLowerCase());

      return tabMatch && archiveMatch && searchMatch;
    });
  }, [dailyQuests, activeTab, showAll, searchTerm]);

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAdding(true);
    const formData = new FormData();
    formData.append('title', newTitle.trim());
    formData.append('focus_duration', activeTab === 'session' ? '25' : '0');

    try {
      await addDailyQuest(formData);
      setNewTitle("");
      await refetch(); // Force SWR to update
      toast.success("Daily quest berhasil ditambahkan");
      if (onAddFormClose) onAddFormClose();
    } catch (err) {
      toast.error("Gagal menambahkan daily quest");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditQuest = (quest: DailyQuest) => {
    setEditingQuest(quest);
    setEditingTitle(quest.title || "");
  };

  const handleSaveEdit = async () => {
    if (!editingQuest || !editingTitle.trim()) return;
    try {
      await updateQuest(editingQuest.id, { title: editingTitle.trim() });
      setEditingQuest(null);
      setEditingTitle("");
      toast.success("Daily quest berhasil diupdate");
    } catch (err) {
      toast.error("Gagal update quest");
    }
  };

  if (isLoading) return <div className="py-10 text-center text-gray-400">Loading...</div>;
  if (error) return <div className="py-10 text-center text-red-400">Error loading quests</div>;

  return (
    <div className="space-y-6">
      {/* Add Form (Controlled by prop) */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tambah {activeTab === 'session' ? 'Daily Session' : 'Quest/Habit'} Baru</h3>
            <button onClick={onAddFormClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleAddQuest} className="flex gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Contoh: ${activeTab === 'session' ? 'Mentoring' : 'Olahraga'}...`}
              className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              autoFocus
            />
            <Button
              type="submit"
              disabled={isAdding || !newTitle.trim()}
              loading={isAdding}
              size="sm"
            >
              Tambah
            </Button>
          </form>
        </div>
      )}

      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cari daily quest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className={`p-2 rounded-md transition-colors ${showAll
            ? 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          title={showAll ? 'Sembunyikan archived quests' : 'Tampilkan semua termasuk archived'}
        >
          {showAll ? (
            <EyeIcon className="w-5 h-5" />
          ) : (
            <EyeCloseIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('session')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'session'
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Quests
        </button>
        <button
          onClick={() => setActiveTab('no-session')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'no-session'
            ? 'border-brand-500 text-brand-600 dark:text-brand-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Habit
        </button>
      </div>

      {/* List */}
      <div className="space-y-1">
        {filteredQuests.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-sm italic">
            Belum ada quest di tab ini.
          </div>
        ) : (
          filteredQuests.map((quest) => {
            const isEditing = editingQuest?.id === quest.id;

            return (
              <div key={quest.id} className="group flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditingQuest(null);
                      }}
                    />
                    <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:text-green-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button onClick={() => setEditingQuest(null)} className="p-1 text-red-600 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${quest.is_archived ? 'text-gray-400 italic line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                        {quest.title}
                        {quest.is_archived && <span className="ml-2 text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded not-italic">Archived</span>}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!quest.is_archived && (
                        <>
                          <button
                            onClick={() => handleEditQuest(quest)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setArchiveQuestId(quest.id);
                              setShowArchiveModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                            title="Archive"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setDeleteQuestId(quest.id);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete Permanently"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={async () => {
          if (!archiveQuestId) return;
          setIsArchiving(true);
          try {
            await archiveQuest(archiveQuestId);
            setShowArchiveModal(false);
            toast.success("Daily quest berhasil diarsipkan");
          } catch (err) {
            toast.error("Gagal mengarsipkan quest");
          } finally {
            setIsArchiving(false);
          }
        }}
        title="Archive Daily Quest"
        message="Quest ini akan diarsipkan secara permanen dan tidak akan muncul lagi di plan harian. Lanjutkan?"
        confirmText="Archive"
        cancelText="Batal"
        confirmVariant="danger"
        isLoading={isArchiving}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteQuestId(null);
        }}
        onConfirm={async () => {
          if (!deleteQuestId) return;
          setIsDeleting(true);
          try {
            await deleteQuest(deleteQuestId);
            setShowDeleteModal(false);
            toast.success("Daily quest berhasil dihapus permanen");
          } catch (err) {
            toast.error("Gagal menghapus quest");
          } finally {
            setIsDeleting(false);
          }
        }}
        title="Hapus Daily Quest"
        message="Quest ini akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
        confirmText="Hapus"
        cancelText="Batal"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DailyQuestList;
