// Enhanced service worker for PWA with offline functionality
const CACHE_NAME = 'raama-v2';
const OFFLINE_CACHE = 'raama-offline-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache shayari data for offline access
          if (url.pathname.includes('/shayaris') && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(OFFLINE_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached data if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return cached page or offline page
          return caches.match('/') || caches.match('/offline');
        })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        return response || fetch(request);
      })
      .catch(() => {
        // Return a fallback for failed requests
        if (request.destination === 'image') {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued offline actions when connection is restored
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const requests = await cache.keys();
    
    // Process any queued actions (likes, shares, etc.)
    for (const request of requests) {
      if (request.url.includes('offline-action')) {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.log('Failed to sync action:', error);
        }
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from रामा!',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('रामा - The Poetic ERP', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});