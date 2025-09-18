/**
 * Development Service Worker for PWA Testing
 * This file is used for testing PWA features in development mode
 */

const CACHE_NAME = 'better-planner-dev-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/planning',
  '/execution',
  '/manifest.json',
  '/images/logo/logo-icon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Development Service Worker: Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 Development Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('🔧 Development Service Worker: Cache failed', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🔧 Development Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🔧 Development Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  console.log('🔧 Development Service Worker: Fetch event', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('🔧 Development Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        console.log('🔧 Development Service Worker: Fetching from network', event.request.url);
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('🔧 Development Service Worker: Fetch failed', error);
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('🔧 Development Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
  console.log('🔧 Development Service Worker: Background sync', event.tag);
});

// Push event (if supported)
self.addEventListener('push', (event) => {
  console.log('🔧 Development Service Worker: Push event', event.data);
  
  const options = {
    body: event.data ? event.data.text() : 'Better Planner notification',
    icon: '/images/logo/logo-icon.svg',
    badge: '/images/logo/logo-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Better Planner', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔧 Development Service Worker: Notification click', event.notification);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
