// Enhanced Service Worker for रामा App
const CACHE_NAME = 'raama-app-v2';
const STATIC_CACHE = 'raama-static-v2';
const DYNAMIC_CACHE = 'raama-dynamic-v2';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/static/css/main.css',
  '/static/js/main.js',
  'https://fonts.googleapis.com/css2?family=Tillana:wght@400;500;600;700;800&family=Macondo&family=Style+Script&display=swap'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/shayaris',
  '/api/notifications',
  '/api/stats'
];

// Install event - Cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        return Promise.allSettled(
          STATIC_FILES.map(url => 
            cache.add(url).catch(err => {
              console.log(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      }),
      // Cache shell
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(['/']);
      })
    ])
  );
  // Force activation
  self.skipWaiting();
});

// Activate event - Clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Network first for API, Cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static files - Cache first
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        });
      })
    );
    return;
  }

  // Handle navigation requests - Network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cached shell
          return caches.match('/') || caches.match(request);
        })
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'रामा - New Notification',
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'raama-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open रामा',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: `रामा - ${pushData.title || 'New Notification'}`,
        body: pushData.message || pushData.body || 'You have a new notification',
        tag: pushData.type || 'raama-notification',
        data: {
          ...notificationData.data,
          ...pushData,
          url: pushData.url || '/'
        }
      };

      // Customize based on notification type
      switch (pushData.type) {
        case 'like':
          notificationData.icon = '❤️';
          notificationData.vibrate = [100, 50, 100];
          notificationData.body = `${pushData.senderName} liked your shayari`;
          break;
        case 'follow':
          notificationData.icon = '👥';
          notificationData.vibrate = [200, 100, 200];
          notificationData.body = `${pushData.senderName} started following you`;
          break;
        case 'feature':
          notificationData.icon = '⭐';
          notificationData.vibrate = [300, 100, 300];
          notificationData.body = 'Your shayari has been featured!';
          break;
        case 'comment':
          notificationData.icon = '💬';
          notificationData.vibrate = [150, 75, 150];
          notificationData.body = `${pushData.senderName} commented on your shayari`;
          break;
        case 'spotlight':
          notificationData.icon = '🏆';
          notificationData.vibrate = [400, 200, 400];
          notificationData.body = 'You\'ve been featured in Writer Spotlight!';
          break;
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      }).then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If app is not open, open it
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    // Get offline stored data
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Retry failed requests
    for (let request of requests) {
      if (request.method === 'POST' || request.method === 'PUT') {
        try {
          await fetch(request);
          await cache.delete(request);
        } catch (error) {
          console.log('Sync failed for:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle app shortcuts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    // Sync latest shayaris and notifications
    const response = await fetch('/api/shayaris?limit=10');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/shayaris?limit=10', response);
    }
  } catch (error) {
    console.error('Content sync failed:', error);
  }
}