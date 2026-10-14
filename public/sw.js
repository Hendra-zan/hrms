const CACHE_NAME = 'rs-meloy-hrms-v6';

// Activate event: Delete ALL outdated Service Worker caches immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[PWA SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Fetch event: Network-First for all requests to prevent stale JS chunks from crashing the app
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests and chrome-extension / supabase API calls
  if (event.request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname) return;

  // 1. HTML & Root Page: ALWAYS Network-First so latest index.html and JS chunk hashes are loaded
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then(r => r || fetch(event.request)))
    );
    return;
  }

  // 2. JS/CSS Assets: Network-First, delete stale chunk from cache if 404
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          } else if (response && response.status === 404) {
            // Stale chunk - delete from cache and return 404 (don't serve stale)
            caches.open(CACHE_NAME).then((cache) => cache.delete(event.request));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(r => {
            if (r) return r;
            // Return a proper Response so SW doesn't throw "Failed to convert value to Response"
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }

  // 3. All other same-origin assets: Network First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request).then(r => r || new Response('', { status: 503 })))
  );
});
