const CACHE_NAME = 'pulse-dna-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/logo3.webp'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Network first strategy for main navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(function() {
          return caches.match('/');
        })
    );
    return;
  }

  // Cache first for other resources
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});