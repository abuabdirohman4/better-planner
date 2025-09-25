// Re-export all functions from the modular structure
export {
  saveTimerSession,
  getActiveTimerSession,
  pauseTimerSession,
  resumeTimerSession,
  completeTimerSession,
  getActivityLogId,
  updateActivityLogJournal,
  calculateActualElapsedTime,
  updateSessionWithActualTime,
  cleanupAbandonedSessions,
  getDeviceId,
  logTimerEvent
} from './timerSession';

