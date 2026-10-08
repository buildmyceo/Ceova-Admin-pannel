// CEOVA Orbit Service Worker for PWA & Push Notifications
const CACHE_NAME = 'ceova-orbit-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Native Push Notification Handler
self.addEventListener('push', (event) => {
  let payload = {
    title: 'CEOVA Orbit Notification',
    message: 'You have a new workspace update.',
    url: '/'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (_) {
    if (event.data) {
      payload.message = event.data.text();
    }
  }

  const title = payload.title || 'CEOVA Orbit';
  const options = {
    body: payload.message || payload.body || 'New alert in your workspace.',
    icon: '/ceovaimage.png',
    badge: '/ceovaimage.png',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open Workspace' }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('portal.ceovaai.com') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
