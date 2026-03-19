// Backward compatibility re-exports — DO NOT add business logic here

// Projects
export {
  getWorkQuestProjects,
  getWorkQuests,
  getWorkQuestProjectById,
  getWorkQuestById,
  createWorkQuestProject,
  createWorkQuest,
  updateWorkQuestProject,
  updateWorkQuest,
  toggleWorkQuestProjectStatus,
  deleteWorkQuestProject,
  deleteWorkQuest,
} from './projects/actions';

// Tasks
export {
  createWorkQuestTask,
  updateWorkQuestTask,
  toggleWorkQuestTaskStatus,
  deleteWorkQuestTask,
} from './tasks/actions';
