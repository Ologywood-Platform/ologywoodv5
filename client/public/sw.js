const CACHE_VERSION = 'ologywood-v7';
const STATIC_CACHE = 'ologywood-static-v7';
const DYNAMIC_CACHE = 'ologywood-dynamic-v7';
const API_CACHE = 'ologywood-api-v7';

// Core app shell files to pre-cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
];

// Max items in dynamic cache to prevent unbounded growth
const DYNAMIC_CACHE_LIMIT = 50;
const API_CACHE_LIMIT = 30;

// Trim cache to limit
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => trimCache(cacheName, maxItems));
      }
    });
  });
}

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler with multiple strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip websocket and auth endpoints
  if (url.pathname.startsWith('/ws') || url.pathname.startsWith('/auth/')) {
    return;
  }

  // Strategy 1: API/tRPC calls — Network-first with cache fallback
  // Cache GET API responses so previously loaded data shows offline
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/trpc/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
              trimCache(API_CACHE, API_CACHE_LIMIT);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Return a proper JSON error response so the app can handle it gracefully
            return new Response(
              JSON.stringify({
                error: {
                  json: {
                    message: 'You are currently offline. Please check your connection.',
                    code: -32603,
                    data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 503 },
                  },
                },
              }),
              {
                status: 503,
                headers: { 'content-type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Strategy 2: Navigation requests — Network-first with cached fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Strategy 3: Static assets (JS, CSS, fonts, images) — Stale-while-revalidate
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Strategy 4: Everything else — Network-first with dynamic cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
            trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
