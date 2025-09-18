/**
 * Offline utilities for Better Planner PWA
 * Handles data persistence and sync when offline
 */

export interface OfflineAction {
  action: 'create_project' | 'update_project' | 'delete_project' | 'create_task' | 'update_task' | 'delete_task';
  data: any;
  timestamp: string;
  id: string;
}

export interface OfflineQueue {
  actions: OfflineAction[];
  lastSync: string;
}

/**
 * Store action in offline queue
 */
export const storeOfflineAction = (action: Omit<OfflineAction, 'timestamp' | 'id'>): void => {
  try {
    const queue: OfflineQueue = JSON.parse(localStorage.getItem('better-planner-offline-queue') || '{"actions": [], "lastSync": ""}');
    
    const offlineAction: OfflineAction = {
      ...action,
      timestamp: new Date().toISOString(),
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    queue.actions.push(offlineAction);
    localStorage.setItem('better-planner-offline-queue', JSON.stringify(queue));
    
    console.log('Action stored offline:', offlineAction);
  } catch (error) {
    console.error('Failed to store offline action:', error);
  }
};

/**
 * Get all offline actions
 */
export const getOfflineActions = (): OfflineAction[] => {
  try {
    const queue: OfflineQueue = JSON.parse(localStorage.getItem('better-planner-offline-queue') || '{"actions": [], "lastSync": ""}');
    return queue.actions;
  } catch (error) {
    console.error('Failed to get offline actions:', error);
    return [];
  }
};

/**
 * Clear offline actions after successful sync
 */
export const clearOfflineActions = (): void => {
  try {
    const queue: OfflineQueue = {
      actions: [],
      lastSync: new Date().toISOString()
    };
    localStorage.setItem('better-planner-offline-queue', JSON.stringify(queue));
    console.log('Offline actions cleared');
  } catch (error) {
    console.error('Failed to clear offline actions:', error);
  }
};

/**
 * Sync offline actions when online
 */
export const syncOfflineActions = async (): Promise<{ success: number; failed: number }> => {
  const actions = getOfflineActions();
  let success = 0;
  let failed = 0;

  for (const action of actions) {
    try {
      // Map offline actions to API calls
      let response: Response;
      
      switch (action.action) {
        case 'create_project':
          response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'update_project':
          response = await fetch(`/api/projects/${action.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'delete_project':
          response = await fetch(`/api/projects/${action.data.id}`, {
            method: 'DELETE'
          });
          break;
          
        case 'create_task':
          response = await fetch(`/api/projects/${action.data.projectId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'update_task':
          response = await fetch(`/api/tasks/${action.data.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
          break;
          
        case 'delete_task':
          response = await fetch(`/api/tasks/${action.data.id}`, {
            method: 'DELETE'
          });
          break;
          
        default:
          console.warn('Unknown offline action:', action.action);
          failed++;
          continue;
      }

      if (response.ok) {
        success++;
      } else {
        failed++;
        console.error('Sync failed for action:', action, response.statusText);
      }
    } catch (error) {
      failed++;
      console.error('Sync error for action:', action, error);
    }
  }

  // Clear successfully synced actions
  if (success > 0) {
    clearOfflineActions();
  }

  return { success, failed };
};

/**
 * Check if there are pending offline actions
 */
export const hasOfflineActions = (): boolean => {
  const actions = getOfflineActions();
  return actions.length > 0;
};

/**
 * Get offline actions count
 */
export const getOfflineActionsCount = (): number => {
  const actions = getOfflineActions();
  return actions.length;
};

/**
 * Cache project data for offline viewing
 */
export const cacheProjectData = (projects: any[]): void => {
  try {
    const cacheData = {
      projects,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('better-planner-cache', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to cache project data:', error);
  }
};

/**
 * Get cached project data
 */
export const getCachedProjectData = (): any[] | null => {
  try {
    const cacheData = JSON.parse(localStorage.getItem('better-planner-cache') || 'null');
    if (cacheData && cacheData.timestamp) {
      // Check if cache is not too old (24 hours)
      const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return cacheData.projects;
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get cached project data:', error);
    return null;
  }
};

/**
 * Clear all offline data
 */
export const clearAllOfflineData = (): void => {
  try {
    localStorage.removeItem('better-planner-offline-queue');
    localStorage.removeItem('better-planner-cache');
    console.log('All offline data cleared');
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
};
