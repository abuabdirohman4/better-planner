"use client";
import React, { useState, useEffect } from "react";
import { useWorkQuests } from "@/app/(admin)/quests/work-quests/hooks/useWorkQuests";
import { WorkQuest } from "@/app/(admin)/quests/work-quests/types";

interface WorkQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: string[];
  onTaskToggle: (taskId: string) => void;
  onSave: () => void;
  isLoading: boolean;
  savingLoading: boolean;
}

const WorkQuestModal: React.FC<WorkQuestModalProps> = ({
  isOpen,
  onClose,
  selectedTasks,
  onTaskToggle,
  onSave,
  isLoading,
  savingLoading
}) => {
  const { workQuests, isLoading: workQuestsLoading } = useWorkQuests();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter work quests based on search term
  const filteredWorkQuests = workQuests.filter(quest =>
    quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quest.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Pilih Work Quest
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari work quest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Work Quest List */}
            <div className="max-h-96 overflow-y-auto">
              {workQuestsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredWorkQuests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Tidak ada work quest yang sesuai dengan pencarian' : 'Belum ada work quest'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWorkQuests.map((quest) => (
                    <div
                      key={quest.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(quest.id)}
                          onChange={() => onTaskToggle(quest.id)}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {quest.title}
                          </h4>
                          {quest.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {quest.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {quest.tasks && quest.tasks.length > 0 && (
                              <span>{quest.tasks.length} task</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                Batal
              </button>
              <button
                onClick={onSave}
                disabled={savingLoading || selectedTasks.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingLoading ? "Menyimpan..." : `Pilih ${selectedTasks.length} Quest`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkQuestModal;
