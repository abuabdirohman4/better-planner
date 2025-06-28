import { googleSheetsService, SHEET_NAMES } from "@/configs/googleSheets";

export interface Task {
  id: number;
  clientId: number;
  name: string;
  indent: number;
  order: number;
  completed: boolean;
  milestoneId?: number;
  highFocusGoalId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  clientId: number;
  name: string;
  indent?: number;
  order?: number;
  completed?: boolean;
  milestoneId?: number;
  highFocusGoalId?: number;
}

export interface UpdateTaskData {
  name?: string;
  indent?: number;
  order?: number;
  completed?: boolean;
  milestoneId?: number;
  highFocusGoalId?: number;
}

export interface FetchTasksParams {
  clientId?: number;
  highFocusGoalId?: number;
  completed?: boolean;
}

export const fetchTasks = async (
  params: FetchTasksParams = {}
): Promise<{ status: number; data: Task[] }> => {
  try {
    const tasks = await googleSheetsService.getAll(SHEET_NAMES.TASKS);

    // Filter based on parameters
    let filteredTasks = tasks;

    if (params.clientId) {
      filteredTasks = filteredTasks.filter(
        (task: Task) => task.clientId === params.clientId
      );
    }

    if (params.highFocusGoalId) {
      filteredTasks = filteredTasks.filter(
        (task: Task) => task.highFocusGoalId === params.highFocusGoalId
      );
    }

    if (params.completed !== undefined) {
      filteredTasks = filteredTasks.filter(
        (task: Task) => task.completed === params.completed
      );
    }

    // Sort by order
    filteredTasks.sort((a: Task, b: Task) => a.order - b.order);

    return { status: 200, data: filteredTasks };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return { status: 500, data: [] };
  }
};

export const fetchTask = async (
  id: number
): Promise<{ status: number; data: Task | null }> => {
  try {
    const task = await googleSheetsService.getById(SHEET_NAMES.TASKS, id);
    if (!task) {
      return { status: 404, data: null };
    }
    return { status: 200, data: task };
  } catch (error) {
    console.error("Error fetching task:", error);
    return { status: 500, data: null };
  }
};

export const createTask = async (
  data: CreateTaskData
): Promise<{ status: number; data: Task | null }> => {
  try {
    const taskData = {
      ...data,
      indent: data.indent || 0,
      order: data.order || 0,
      completed: data.completed || false,
    };

    const newTask = await googleSheetsService.create(
      SHEET_NAMES.TASKS,
      taskData
    );
    return { status: 201, data: newTask };
  } catch (error) {
    console.error("Error creating task:", error);
    return { status: 500, data: null };
  }
};

export const updateTask = async (
  id: number,
  data: UpdateTaskData
): Promise<{ status: number; data: Task | null }> => {
  try {
    const updatedTask = await googleSheetsService.update(
      SHEET_NAMES.TASKS,
      id,
      data
    );
    return { status: 200, data: updatedTask };
  } catch (error) {
    console.error("Error updating task:", error);
    return { status: 500, data: null };
  }
};

export const deleteTask = async (
  id: number
): Promise<{ status: number; message: string }> => {
  try {
    await googleSheetsService.delete(SHEET_NAMES.TASKS, id);
    return { status: 204, message: "Task deleted successfully" };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

export const toggleTaskCompletion = async (
  id: number
): Promise<{ status: number; data: Task | null }> => {
  try {
    const task = await googleSheetsService.getById(SHEET_NAMES.TASKS, id);
    if (!task) {
      return { status: 404, data: null };
    }

    const updatedTask = await googleSheetsService.update(
      SHEET_NAMES.TASKS,
      id,
      {
        completed: !task.completed,
      }
    );

    return { status: 200, data: updatedTask };
  } catch (error) {
    console.error("Error toggling task completion:", error);
    return { status: 500, data: null };
  }
};

export const reorderTasks = async (
  taskIds: number[]
): Promise<{ status: number; message: string }> => {
  try {
    for (let i = 0; i < taskIds.length; i++) {
      await googleSheetsService.update(SHEET_NAMES.TASKS, taskIds[i], {
        order: i + 1,
      });
    }

    return { status: 200, message: "Tasks reordered successfully" };
  } catch (error) {
    console.error("Error reordering tasks:", error);
    return { status: 500, message: "Internal Server Error" };
  }
};

export const getTasksByClient = async (
  clientId: number
): Promise<{ status: number; data: Task[] }> => {
  return fetchTasks({ clientId });
};

export const getTasksByHighFocusGoal = async (
  highFocusGoalId: number
): Promise<{ status: number; data: Task[] }> => {
  return fetchTasks({ highFocusGoalId });
};

export const getCompletedTasks = async (
  clientId?: number
): Promise<{ status: number; data: Task[] }> => {
  const params: FetchTasksParams = { completed: true };
  if (clientId) params.clientId = clientId;
  return fetchTasks(params);
};

export const getPendingTasks = async (
  clientId?: number
): Promise<{ status: number; data: Task[] }> => {
  const params: FetchTasksParams = { completed: false };
  if (clientId) params.clientId = clientId;
  return fetchTasks(params);
};
