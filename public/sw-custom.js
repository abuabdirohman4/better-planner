// Custom Service Worker for Better Planner
// Extends PWA functionality with timer notifications

const CACHE_NAME = 'better-planner-v1';
const TIMER_CACHE_NAME = 'timer-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Better Planner Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Better Planner Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'TIMER_COMPLETED':
      handleTimerCompletion(data);
      break;
    case 'TIMER_STARTED':
      handleTimerStarted(data);
      break;
    case 'TIMER_UPDATED':
      handleTimerUpdated(data);
      break;
    case 'TIMER_PAUSED':
      handleTimerPaused(data);
      break;
    case 'TIMER_STOPPED':
      handleTimerStopped();
      break;
    case 'REQUEST_NOTIFICATION_PERMISSION':
      requestNotificationPermission();
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle timer completion
function handleTimerCompletion(data) {
  const { taskTitle, soundId } = data;
  
  // Show notification
  self.registration.showNotification('Timer Completed! 🎉', {
    body: `Your ${taskTitle || 'focus session'} is complete!`,
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    tag: 'timer-completion',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Results'
      }
    ]
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

// Handle timer started
function handleTimerStarted(data) {
  const { taskTitle, duration, soundId } = data;
  
  // Show persistent notification with timer
  self.registration.showNotification('Timer Running ⏱️', {
    body: `${taskTitle || 'Focus Session'} - 00:00 / ${formatTime(duration)}`,
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

  // Start live countdown in notification
  startLiveCountdown(data);
}

// Handle timer updated (every minute)
function handleTimerUpdated(data) {
  const { taskTitle, remainingSeconds, totalDuration } = data;
  
  // Calculate elapsed time for display
  const elapsedSeconds = totalDuration - remainingSeconds;
  
  // Update the existing notification
  self.registration.showNotification('Timer Running ⏱️', {
    body: `${taskTitle || 'Focus Session'} - ${formatTime(elapsedSeconds)} / ${formatTime(totalDuration)}`,
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
      elapsedSeconds,
      totalDuration,
      startTime: Date.now()
    }
  });

  // Restart live countdown with updated data
  startLiveCountdown(data);
}

// Handle timer paused
function handleTimerPaused(data) {
  const { taskTitle, remainingSeconds, totalDuration } = data;
  
  // Stop live countdown when paused
  stopLiveCountdown();
  
  // Calculate elapsed time for display
  const elapsedSeconds = totalDuration - remainingSeconds;
  
  // Update notification to show paused state
  self.registration.showNotification('Timer Paused ⏸️', {
    body: `${taskTitle || 'Focus Session'} - ${formatTime(elapsedSeconds)} / ${formatTime(totalDuration)}`,
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
      elapsedSeconds,
      totalDuration,
      paused: true
    }
  });
}

// Handle timer stopped
function handleTimerStopped() {
  // Stop live countdown
  stopLiveCountdown();
  
  // Clear the live timer notification
  self.registration.getNotifications({ tag: 'live-timer' }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
}

// Request notification permission
function requestNotificationPermission() {
  // Service Workers can't request permission directly
  // The main thread must handle this
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'REQUEST_NOTIFICATION_PERMISSION'
      });
    });
  });
}

// Live countdown variables
let countdownInterval = null;
let currentTimerData = null;

// Start live countdown in notification
function startLiveCountdown(data) {
  // Stop existing countdown
  stopLiveCountdown();
  
  currentTimerData = data;
  const { taskTitle, remainingSeconds, totalDuration } = data;
  
  if (!remainingSeconds || remainingSeconds <= 0) {
    return;
  }
  
  // Calculate elapsed time (count up)
  const elapsedSeconds = totalDuration - remainingSeconds;
  let currentElapsed = elapsedSeconds;
  
  // Update notification every second
  countdownInterval = setInterval(() => {
    // Check if timer should be completed
    if (currentElapsed >= totalDuration) {
      stopLiveCountdown();
      return;
    }
    
    // Update notification with live count up
    self.registration.showNotification('Timer Running ⏱️', {
      body: `${taskTitle || 'Focus Session'} - ${formatTime(currentElapsed)} / ${formatTime(totalDuration)}`,
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
        elapsedSeconds: currentElapsed,
        remainingSeconds: totalDuration - currentElapsed,
        totalDuration,
        startTime: Date.now()
      }
    });
    
    currentElapsed++;
  }, 1000);
}

// Stop live countdown
function stopLiveCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  currentTimerData = null;
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
      
      // Restart live countdown after resume
      if (currentTimerData) {
        startLiveCountdown(currentTimerData);
      }
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

// Cache management
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally
  // This is just a placeholder for future caching strategies
});
