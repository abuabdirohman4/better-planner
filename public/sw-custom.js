// Custom Service Worker for Better Planner
// PWA lifecycle + Web Push (server-sent notifications for timer/habit/schedule/daily sync/recap)

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Main-thread messages: only sound relay is still used
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'PLAY_COMPLETION_SOUND') {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => client.postMessage(event.data));
    });
  }
});

// ─── Web Push ───
// Payload: { title, body, url, tag, kind } — built server-side in src/lib/notifications/services/pushDue.ts
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Better Planner', body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const visible = clients.filter((c) => c.visibilityState === 'visible');
      // App is on screen → let the page handle it (sound/toast), no OS notification needed
      if (visible.length > 0) {
        visible.forEach((c) => c.postMessage({ type: 'PUSH_RECEIVED', data }));
        return;
      }
      const show = self.registration.showNotification(data.title || 'Better Planner', {
        body: data.body || '',
        icon: '/images/logo/icon-192.png',
        badge: '/images/logo/icon-192.png',
        tag: data.tag || data.kind || 'better-planner',
        renotify: true,
        requireInteraction: data.kind === 'timer',
        data: { url: data.url || '/', kind: data.kind },
      });
      if (self.navigator && self.navigator.setAppBadge) {
        self.navigator.setAppBadge().catch(() => {});
      }
      return show;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (self.navigator && self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(() => {});
      const existing = clients.find((c) => 'focus' in c);
      if (existing) {
        if ('navigate' in existing) existing.navigate(url);
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

// Chrome may rotate subscriptions; ask the page to re-subscribe
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' }));
    })
  );
});
