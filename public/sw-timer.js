// Service Worker for timer notifications
// This enables reliable notifications even when the React app is suspended

const CACHE_NAME = 'timer-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Timer Service Worker installed');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚀 Timer Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'TIMER_COMPLETED':
      handleTimerCompletion(data);
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
  
  // Play sound if specified
  if (soundId && soundId !== 'none') {
    // Note: Service Workers can't play audio directly
    // The main thread will handle audio playback
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    // Focus the app window
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        if (clients.length > 0) {
          return clients[0].focus();
        } else {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'timer-sync') {
    console.log('🔄 Background sync triggered');
    // Handle any background sync logic here
  }
});
