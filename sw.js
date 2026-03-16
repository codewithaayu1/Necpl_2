// NECPL Service Worker v1.0
const CACHE = 'necpl-v1';
const OFFLINE_URL = '/necpl-offline.html';

// Files to cache for offline
const CACHE_URLS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Hind:wght@400;500;600&family=Oswald:wght@400;500;600;700&display=swap'
];

// Install — cache resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(CACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, then network
self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        // Cache new responses
        if(resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached || new Response('Offline', {status: 503}));
    })
  );
});

// Push notification received
self.addEventListener('push', (e) => {
  let data = { title: '🏏 NECPL Update', body: 'Kuch naya hua hai!' };
  try { data = e.data.json(); } catch(err) {}
  e.waitUntil(
    self.registration.showNotification('🏏 ' + data.title, {
      body: data.body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a6b2e"/><text y=".9em" font-size="80" x="10">🏏</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a6b2e"/><text y=".9em" font-size="80" x="10">🏏</text></svg>',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Website Kholo' },
        { action: 'close', title: 'Close' }
      ]
    })
  );
});

// Notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if(e.action === 'close') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for(const client of list) {
        if(client.url === url && 'focus' in client) return client.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
