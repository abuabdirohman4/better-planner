// Service Worker for live timer notifications
// Shows running timer in notification when app is minimized

const CACHE_NAME = 'timer-live-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Live Timer Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Live Timer Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'TIMER_STARTED':
      handleTimerStarted(data);
      break;
    case 'TIMER_UPDATED':
      handleTimerUpdated(data);
      break;
    case 'TIMER_COMPLETED':
      handleTimerCompleted(data);
      break;
    case 'TIMER_PAUSED':
      handleTimerPaused(data);
      break;
    case 'TIMER_STOPPED':
      handleTimerStopped();
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle timer started
function handleTimerStarted(data) {
  const { taskTitle, duration, soundId } = data;
  
  // Show persistent notification with timer
  self.registration.showNotification('Timer Running ⏱️', {
    body: `${taskTitle || 'Focus Session'} - ${formatTime(duration)} remaining`,
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'live-timer',
    requireInteraction: false,
    silent: true,
    actions: [
      {
        action: 'pause',
        title: '⏸️ Pause'
      },
      {
        action: 'stop',
        title: '⏹️ Stop'
      },
      {
        action: 'view',
        title: '👁️ View'
      }
    ],
    data: {
      taskTitle,
      duration,
      soundId,
      startTime: Date.now()
    }
  });
}

// Handle timer updated (every minute)
function handleTimerUpdated(data) {
  const { taskTitle, remainingSeconds, totalDuration } = data;
  
  // Update the existing notification
  self.registration.showNotification('Timer Running ⏱️', {
    body: `${taskTitle || 'Focus Session'} - ${formatTime(remainingSeconds)} remaining`,
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'live-timer',
    requireInteraction: false,
    silent: true,
    actions: [
      {
        action: 'pause',
        title: '⏸️ Pause'
      },
      {
        action: 'stop',
        title: '⏹️ Stop'
      },
      {
        action: 'view',
        title: '👁️ View'
      }
    ],
    data: {
      taskTitle,
      remainingSeconds,
      totalDuration,
      startTime: Date.now()
    }
  });
}

// Handle timer completed
function handleTimerCompleted(data) {
  const { taskTitle, soundId } = data;
  
  // Show completion notification
  self.registration.showNotification('Timer Completed! 🎉', {
    body: `${taskTitle || 'Focus Session'} is complete!`,
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'timer-completion',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Results'
      }
    ],
    data: {
      url: '/execution/daily-sync'
    }
  });
  
  // Play completion sound
  if (soundId && soundId !== 'none') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_COMPLETION_SOUND',
          data: { soundId }
        });
      });
    });
  }
}

// Handle timer paused
function handleTimerPaused(data) {
  const { taskTitle, remainingSeconds } = data;
  
  // Update notification to show paused state
  self.registration.showNotification('Timer Paused ⏸️', {
    body: `${taskTitle || 'Focus Session'} - ${formatTime(remainingSeconds)} remaining`,
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'live-timer',
    requireInteraction: false,
    silent: true,
    actions: [
      {
        action: 'resume',
        title: '▶️ Resume'
      },
      {
        action: 'stop',
        title: '⏹️ Stop'
      },
      {
        action: 'view',
        title: '👁️ View'
      }
    ],
    data: {
      taskTitle,
      remainingSeconds,
      paused: true
    }
  });
}

// Handle timer stopped
function handleTimerStopped() {
  // Clear the live timer notification
  self.registration.getNotifications({ tag: 'live-timer' }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  switch (action) {
    case 'pause':
      // Send pause command to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_ACTION',
            action: 'pause'
          });
        });
      });
      break;
      
    case 'resume':
      // Send resume command to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_ACTION',
            action: 'resume'
          });
        });
      });
      break;
      
    case 'stop':
      // Send stop command to main thread
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TIMER_ACTION',
            action: 'stop'
          });
        });
      });
      break;
      
    case 'view':
    default:
      // Focus the app window
      event.waitUntil(
        self.clients.matchAll().then(clients => {
          if (clients.length > 0) {
            return clients[0].focus();
          } else {
            return self.clients.openWindow(data?.url || '/execution/daily-sync');
          }
        })
      );
      break;
  }
});

// Format time helper
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Background sync for timer updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    console.log('🔄 Timer background sync triggered');
    // Handle any background timer sync logic here
  }
});

