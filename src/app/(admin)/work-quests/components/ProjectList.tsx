"use client";
import React, { useState } from "react";
import { WorkQuestProjectListProps, WorkQuestProject, WorkQuestTask } from "../types";
import TaskForm from "./TaskForm";

const ProjectList: React.FC<WorkQuestProjectListProps> = ({
  projects,
  onEditProject,
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
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

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
    setShowTaskForm({ projectId });
  };

  const handleEditTask = (projectId: string, task: WorkQuestTask) => {
    setEditingTask(task);
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
    <div className="space-y-1">
      {projects.map((project) => (
        <div key={project.id} className="bg-white dark:bg-gray-800">
          {/* Project Item */}
          <div className="flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700">
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
            <input
              type="checkbox"
              checked={project.status === 'DONE'}
              onChange={() => handleToggleProjectStatus(project.id, project.status)}
              className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />

            {/* Project Title */}
            <span className={`ml-3 text-sm font-medium ${
              project.status === 'DONE' 
                ? 'text-gray-500 line-through dark:text-gray-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {project.title}
            </span>
          </div>

          {/* Tasks */}
          {expandedProjects.has(project.id) && (
            <div className="ml-[52px] border-l border-gray-200 dark:border-gray-600">
              {project.tasks.map((task, index) => (
                <div key={task.id} className="flex items-center py-2 pl-6 pr-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === 'DONE'}
                    onChange={() => handleToggleTaskStatus(task.id, task.status)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />

                  {/* Task Title */}
                  <span className={`ml-3 text-sm ${
                    task.status === 'DONE' 
                      ? 'text-gray-500 line-through dark:text-gray-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {task.title}
                  </span>
                </div>
              ))}

              {/* Add Task Form */}
              {showTaskForm?.projectId === project.id && (
                <div className="pl-6 pr-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <TaskForm
                    projectId={project.id}
                    initialData={editingTask}
                    onSubmit={handleTaskSubmit}
                    onCancel={handleTaskCancel}
                    isLoading={editingTask ? isUpdatingTask : isCreatingTask}
                  />
                </div>
              )}

              {/* Add Task Button */}
              {!showTaskForm || showTaskForm.projectId !== project.id ? (
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
          )}
        </div>
      ))}
    </div>
  );
};

export default ProjectList;
