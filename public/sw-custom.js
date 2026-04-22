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
    // OS notifications temporarily disabled — re-enable when needed for mobile PWA
    // case 'TIMER_COMPLETED':
    //   handleTimerCompletion(data);
    //   break;
    // case 'TIMER_STARTED':
    //   handleTimerStarted(data);
    //   break;
    // case 'TIMER_UPDATED':
    //   handleTimerUpdated(data);
    //   break;
    // case 'TIMER_PAUSED':
    //   handleTimerPaused(data);
    //   break;
    // case 'TIMER_STOPPED':
    //   handleTimerStopped();
    //   break;
    // case 'REQUEST_NOTIFICATION_PERMISSION':
    //   requestNotificationPermission();
    //   break;
    case 'TIMER_COMPLETED':
    case 'TIMER_STARTED':
    case 'TIMER_UPDATED':
    case 'TIMER_PAUSED':
    case 'TIMER_STOPPED':
    case 'REQUEST_NOTIFICATION_PERMISSION':
      // OS notifications disabled — no-op for now
      break;
    default:
      // Play sound messages are still forwarded to clients
      if (type === 'PLAY_COMPLETION_SOUND') {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => client.postMessage(event.data));
        });
      }
  }
});

// ─── OS Notification handlers (disabled — uncomment to re-enable for mobile PWA) ───

// // Handle timer completion
// function handleTimerCompletion(data) {
//   const { taskTitle, soundId } = data;
//
//   // Show notification
//   self.registration.showNotification('Timer Completed! 🎉', {
//     body: `Your ${taskTitle || 'focus session'} is complete!`,
//     icon: '/images/logo/logo-icon.svg',
//     badge: '/images/logo/logo-icon.svg',
//     tag: 'timer-completion',
//     requireInteraction: true,
//     actions: [{ action: 'view', title: 'View Results' }]
//   });
//
//   // Play completion sound
//   if (soundId && soundId !== 'none') {
//     self.clients.matchAll().then(clients => {
//       clients.forEach(client => {
//         client.postMessage({ type: 'PLAY_COMPLETION_SOUND', data: { soundId } });
//       });
//     });
//   }
// }

// // Handle timer started
// function handleTimerStarted(data) {
//   const { taskTitle, duration, soundId } = data;
//   self.registration.showNotification('Timer Running ⏱️', {
//     body: `${taskTitle || 'Focus Session'} - 00:00 / ${formatTime(duration)}`,
//     icon: '/images/logo/logo-icon.svg',
//     badge: '/images/logo/logo-icon.svg',
//     tag: 'live-timer',
//     requireInteraction: false,
//     silent: true,
//     actions: [
//       { action: 'pause', title: '⏸️ Pause' },
//       { action: 'stop', title: '⏹️ Stop' },
//       { action: 'view', title: '👁️ View' }
//     ],
//     data: { taskTitle, duration, soundId, startTime: Date.now() }
//   });
// }

// // Handle timer updated (every minute)
// function handleTimerUpdated(data) {
//   const { taskTitle, remainingSeconds, totalDuration } = data;
//   const elapsedSeconds = totalDuration - remainingSeconds;
//   self.registration.showNotification('Timer Running ⏱️', {
//     body: `${taskTitle || 'Focus Session'} - ${formatTime(elapsedSeconds)} / ${formatTime(totalDuration)}`,
//     icon: '/images/logo/logo-icon.svg',
//     badge: '/images/logo/logo-icon.svg',
//     tag: 'live-timer',
//     requireInteraction: false,
//     silent: true,
//     actions: [
//       { action: 'pause', title: '⏸️ Pause' },
//       { action: 'stop', title: '⏹️ Stop' },
//       { action: 'view', title: '👁️ View' }
//     ],
//     data: { taskTitle, remainingSeconds, elapsedSeconds, totalDuration, startTime: Date.now() }
//   });
// }

// // Handle timer paused
// function handleTimerPaused(data) {
//   const { taskTitle, remainingSeconds, totalDuration } = data;
//   const elapsedSeconds = totalDuration - remainingSeconds;
//   self.registration.showNotification('Timer Paused ⏸️', {
//     body: `${taskTitle || 'Focus Session'} - ${formatTime(elapsedSeconds)} / ${formatTime(totalDuration)}`,
//     icon: '/images/logo/logo-icon.svg',
//     badge: '/images/logo/logo-icon.svg',
//     tag: 'live-timer',
//     requireInteraction: false,
//     silent: true,
//     actions: [
//       { action: 'resume', title: '▶️ Resume' },
//       { action: 'stop', title: '⏹️ Stop' },
//       { action: 'view', title: '👁️ View' }
//     ],
//     data: { taskTitle, remainingSeconds, elapsedSeconds, totalDuration, paused: true }
//   });
// }

// // Handle timer stopped
// function handleTimerStopped() {
//   self.registration.getNotifications({ tag: 'live-timer' }).then(notifications => {
//     notifications.forEach(notification => notification.close());
//   });
// }

// // Request notification permission
// function requestNotificationPermission() {
//   self.clients.matchAll().then(clients => {
//     clients.forEach(client => {
//       client.postMessage({ type: 'REQUEST_NOTIFICATION_PERMISSION' });
//     });
//   });
// }

// ─── Notification click handler (disabled — uncomment with handlers above) ───

// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   const { action, data } = event;
//   switch (action) {
//     case 'pause':
//       self.clients.matchAll().then(clients => {
//         clients.forEach(client => client.postMessage({ type: 'TIMER_ACTION', action: 'pause' }));
//       });
//       break;
//     case 'resume':
//       self.clients.matchAll().then(clients => {
//         clients.forEach(client => client.postMessage({ type: 'TIMER_ACTION', action: 'resume' }));
//       });
//       break;
//     case 'stop':
//       self.clients.matchAll().then(clients => {
//         clients.forEach(client => client.postMessage({ type: 'TIMER_ACTION', action: 'stop' }));
//       });
//       break;
//     case 'view':
//     default:
//       event.waitUntil(
//         self.clients.matchAll().then(clients => {
//           if (clients.length > 0) return clients[0].focus();
//           return self.clients.openWindow(data?.url || '/execution/daily-sync');
//         })
//       );
//       break;
//   }
// });

// Format time helper (keep for when notifications are re-enabled)
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Background sync for timer updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    console.log('🔄 Timer background sync triggered');
  }
});

// Cache management
self.addEventListener('fetch', (event) => {
  // Let the browser handle the request normally
  // This is just a placeholder for future caching strategies
});
