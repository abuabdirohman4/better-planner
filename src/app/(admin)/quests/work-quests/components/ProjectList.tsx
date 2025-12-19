"use client";
import React, { useState } from "react";
import { WorkQuestProjectListProps, WorkQuestProject, WorkQuestTask } from "../types";
import TaskForm from "./TaskForm";
import Checkbox from "@/components/form/input/Checkbox";
import { EyeIcon, EyeCloseIcon } from "@/lib/icons";
import ConfirmModal from "@/components/ui/modal/ConfirmModal";

const ProjectList: React.FC<WorkQuestProjectListProps> = ({
  projects,
  onEditProject,
  onInlineUpdateProject,
  onDeleteProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleProjectStatus,
  onToggleTaskStatus
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showTaskForm, setShowTaskForm] = useState<{ projectId: string; taskId?: string } | null>(null);
  const [editingTask, setEditingTask] = useState<WorkQuestTask | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingProject, setEditingProject] = useState<WorkQuestProject | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState<string>('');
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState<boolean>(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const handleToggleProjectStatus = async (projectId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      await onToggleProjectStatus(projectId, newStatus);
    } catch (error) {
      console.error("Failed to toggle project status:", error);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
      await onToggleTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Failed to toggle task status:", error);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleAddTask = (projectId: string) => {
    setEditingTask(null);
    setNewTaskTitle('');
    setShowTaskForm({ projectId });
  };

  const handleEditTask = (projectId: string, task: WorkQuestTask) => {
    setEditingTask(task);
    setNewTaskTitle('');
    setShowTaskForm({ projectId, taskId: task.id });
  };

  const handleTaskSubmit = async (formData: any) => {
    try {
      if (editingTask) {
        setIsUpdatingTask(true);
        await onEditTask(showTaskForm!.projectId, { ...editingTask, ...formData });
      } else {
        setIsCreatingTask(true);
        await onAddTask(showTaskForm!.projectId, formData);
      }
      setShowTaskForm(null);
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to submit task:", error);
    } finally {
      setIsCreatingTask(false);
      setIsUpdatingTask(false);
    }
  };

  const handleTaskCancel = () => {
    setShowTaskForm(null);
    setEditingTask(null);
    setNewTaskTitle('');
  };

  const handleDeleteTask = async (projectId: string, taskId: string) => {
    // Find task to get its title for confirmation
    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    
    if (!task) return;

    // Show confirmation alert
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus task "${task.title}"?\n\nTindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    try {
      await onDeleteTask(projectId, taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Filter projects based on search term and completed status
  const filteredProjects = projects
    .filter(project => {
      // Search filter - check project title, description, and all task titles
      const matchesSearch = 
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.tasks.some(task => 
          task.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      // Completed filter
      const matchesCompleted = showCompleted || project.status !== 'DONE';
      
      return matchesSearch && matchesCompleted;
    })
    .sort((a, b) => {
      // Sort by project title (A-Z)
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    });

  // Handle edit project
  const handleEditProject = (project: WorkQuestProject) => {
    setEditingProject(project);
    setEditingProjectTitle(project.title || '');
  };

  // Handle save project
  const handleSaveProject = async () => {
    if (!editingProject || !editingProjectTitle.trim()) return;

    try {
      await onInlineUpdateProject({ ...editingProject, title: editingProjectTitle.trim() });
      setEditingProject(null);
      setEditingProjectTitle('');
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  // Handle cancel edit project
  const handleCancelEditProject = () => {
    setEditingProject(null);
    setEditingProjectTitle('');
  };

  // Handle delete project
  const handleDeleteProject = (projectId: string) => {
    setDeleteProjectId(projectId);
    setShowDeleteProjectModal(true);
  };

  const confirmDeleteProject = async () => {
    if (!deleteProjectId) return;

    setIsDeletingProject(true);
    try {
      await onDeleteProject(deleteProjectId);
      setShowDeleteProjectModal(false);
      setDeleteProjectId(null);
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeletingProject(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Belum ada Project
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Mulai buat project pertama Anda untuk mengelola work quests
        </p>
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
            placeholder="Cari work quest..."
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
          title={showCompleted ? 'Sembunyikan project yang sudah selesai' : 'Tampilkan project yang sudah selesai'}
        >
          {showCompleted ? (
            <EyeIcon className="w-5 h-5" />
          ) : (
            <EyeCloseIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Project List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? 'Tidak ada project yang sesuai dengan pencarian' 
              : !showCompleted
                ? 'Semua project sudah selesai'
                : 'Belum ada project'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredProjects.map((project) => {
            const isEditingProject = editingProject?.id === project.id;

            return (
              <div key={project.id} className="bg-white dark:bg-gray-800">
                {/* Project Item */}
                {isEditingProject ? (
                  /* Edit Form */
                  <div className="flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {/* Chevron Icon (disabled for form) */}
                    <div className="mr-3 text-gray-300">
                      <svg 
                        className="w-4 h-4"
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>

                    {/* Checkbox (disabled for form) */}
                    <Checkbox
                      checked={false}
                      onChange={() => {}}
                      disabled
                    />

                    {/* Project Input */}
                    <div className="flex-1 ml-3">
                      <input
                        type="text"
                        value={editingProjectTitle}
                        onChange={(e) => setEditingProjectTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                        placeholder="Masukkan project..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveProject();
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelEditProject();
                          }
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 ml-2">
                      {/* Save Button */}
                      <button
                        onClick={handleSaveProject}
                        disabled={!editingProjectTitle.trim()}
                        className="p-1 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>

                      {/* Cancel Button */}
                      <button
                        onClick={handleCancelEditProject}
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
                  /* Normal Project Item */
                  <div className="flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 group">
                    {/* Chevron Icon */}
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="mr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${expandedProjects.has(project.id) ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Checkbox */}
                    <Checkbox
                      checked={project.status === 'DONE'}
                      onChange={() => handleToggleProjectStatus(project.id, project.status)}
                    />

                    {/* Project Title */}
                    <span className={`ml-3 text-sm font-medium flex-1 ${
                      project.status === 'DONE' 
                        ? 'text-gray-500 line-through dark:text-gray-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {project.title}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleEditProject(project)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Edit project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete project"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

          {/* Tasks */}
          {expandedProjects.has(project.id) && (() => {
            // Filter tasks based on showCompleted toggle
            const filteredTasks = showCompleted 
              ? project.tasks 
              : project.tasks.filter(task => task.status !== 'DONE');
            
            return (
              <div className="ml-[52px] border-l border-gray-200 dark:border-gray-600" key={`tasks-${project.id}`}>
                {filteredTasks.map((task, index) => (
                <div key={task.id}>
                  {/* Show edit form if this task is being edited */}
                  {showTaskForm?.projectId === project.id && showTaskForm?.taskId === task.id ? (
                    <div className="flex items-center py-2 pl-6 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700 group">
                      {/* Checkbox (disabled for form) */}
                      <Checkbox
                        checked={false}
                        onChange={() => {}}
                        disabled
                      />

                      {/* Task Input */}
                      <div className="flex-1 ml-3">
                        <input
                          type="text"
                          name="title"
                          value={editingTask ? (editingTask.title || '') : (newTaskTitle || '')}
                          onChange={(e) => {
                            if (editingTask) {
                              setEditingTask({ ...editingTask, title: e.target.value });
                            } else {
                              setNewTaskTitle(e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                          placeholder="Masukkan task..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const title = editingTask ? (editingTask.title || '') : (newTaskTitle || '');
                              handleTaskSubmit({ title });
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleTaskCancel();
                            }
                          }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1">
                        {/* Save Button */}
                        <button
                          onClick={() => {
                            const title = editingTask ? (editingTask.title || '') : (newTaskTitle || '');
                            handleTaskSubmit({ title });
                          }}
                          disabled={!((editingTask ? (editingTask.title || '') : (newTaskTitle || '')).trim())}
                          className="p-1 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Save task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>

                        {/* Cancel Button */}
                        <button
                          onClick={handleTaskCancel}
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
                    /* Show normal task item if not being edited */
                    <div className="flex items-center py-2 pl-6 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700 group">
                  {/* Checkbox */}
                  <Checkbox
                    checked={task.status === 'DONE'}
                    onChange={() => handleToggleTaskStatus(task.id, task.status)}
                  />

                  {/* Task Title */}
                  <span className={`ml-3 text-sm flex-1 ${
                    task.status === 'DONE' 
                      ? 'text-gray-500 line-through dark:text-gray-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {task.title}
                  </span>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditTask(project.id, task)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTask(project.id, task.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add Task Form (only show when adding new task, not editing existing) */}
              {showTaskForm?.projectId === project.id && !showTaskForm?.taskId && (
                <div className="flex items-center py-2 pl-6 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700 group">
                  {/* Checkbox (disabled for form) */}
                  <Checkbox
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />

                  {/* Task Input */}
                  <div className="flex-1 ml-3">
                    <input
                      type="text"
                      name="title"
                    value={newTaskTitle || ''}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:border-primary dark:bg-gray-700 dark:text-white"
                      placeholder="Masukkan task..."
                      autoFocus
                      onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTaskSubmit({ title: newTaskTitle || '' });
                      } else if (e.key === 'Escape') {
                          e.preventDefault();
                          handleTaskCancel();
                        }
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1">
                    {/* Save Button */}
                    <button
                    onClick={() => handleTaskSubmit({ title: newTaskTitle || '' })}
                    disabled={!(newTaskTitle || '').trim()}
                      className="p-1 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Save task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>

                    {/* Cancel Button */}
                    <button
                      onClick={handleTaskCancel}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Add Task Button */}
              {!showTaskForm || (showTaskForm.projectId !== project.id) ? (
                <div className="pl-6 pr-4 py-2">
                  <button
                    onClick={() => handleAddTask(project.id)}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    + Tambah Task
                  </button>
                </div>
              ) : null}
              </div>
            );
          })()}
          </div>
          );
        })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteProjectModal}
        onClose={() => {
          setShowDeleteProjectModal(false);
          setDeleteProjectId(null);
        }}
        onConfirm={confirmDeleteProject}
        title="Hapus Project"
        message={`Apakah Anda yakin ingin menghapus project ini? Semua task di dalam project ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        confirmVariant="danger"
        isLoading={isDeletingProject}
        size="sm"
      />
    </div>
  );
};

export default ProjectList;
