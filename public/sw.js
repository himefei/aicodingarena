// Service Worker: Cache Pyodide runtime and packages for fast subsequent loads
const CACHE_NAME = 'pyodide-cache-v1';
const PYODIDE_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

// Files to cache on first encounter
const PYODIDE_PATTERNS = [
  /cdn\.jsdelivr\.net\/pyodide\//,
];

// Install: no precaching, we cache on-demand
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('pyodide-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: intercept Pyodide CDN requests and serve from cache
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Only cache Pyodide CDN resources
  if (!PYODIDE_PATTERNS.some((p) => p.test(url))) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
  );
});
