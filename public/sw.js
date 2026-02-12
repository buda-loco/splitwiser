const CACHE_NAME = 'splitwiser-v1';
const URLS_TO_CACHE = [
  '/',
  '/offline',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service worker: Caching essential files');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service worker: Clearing old cache');
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to cache and return
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});

// Push event - display notification
self.addEventListener('push', (event) => {
  console.log('Push notification received');

  let notificationData = {
    title: 'Splitwiser',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: payload.badge || notificationData.badge,
        data: payload.data || {},
      };
    } catch (error) {
      console.error('Error parsing push notification payload:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      tag: notificationData.data.expenseId || notificationData.data.settlementId || 'general',
      requireInteraction: false,
    }
  );

  event.waitUntil(promiseChain);
});

// Notification click event - open app at relevant page
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();

  // Determine which page to open based on notification data
  let urlToOpen = '/';
  if (event.notification.data) {
    if (event.notification.data.expenseId) {
      urlToOpen = `/expenses/${event.notification.data.expenseId}`;
    } else if (event.notification.data.settlementId) {
      urlToOpen = '/settlements';
    } else if (event.notification.data.url) {
      urlToOpen = event.notification.data.url;
    }
  }

  // Focus existing window or open new one
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((windowClients) => {
    // Check if there's already a window open
    for (let i = 0; i < windowClients.length; i++) {
      const client = windowClients[i];
      if (client.url.includes(urlToOpen) && 'focus' in client) {
        return client.focus();
      }
    }

    // If no matching window, check if any window is open
    if (windowClients.length > 0) {
      const client = windowClients[0];
      if ('navigate' in client) {
        return client.navigate(urlToOpen).then(client => client.focus());
      }
      return client.focus();
    }

    // No window open, open a new one
    if (clients.openWindow) {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
