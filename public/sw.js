const CACHE_NAME = 'pulse-dna-v2';
const DOMAIN = 'https://pulse.angelfs.co.uk';
const urlsToCache = [
  `${DOMAIN}/`,
  `${DOMAIN}/manifest.json`,
  `${DOMAIN}/images/logo3.webp`
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Cache installation failed:', error);
      })
  );
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
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Only handle requests to our domain
  if (!event.request.url.startsWith(DOMAIN)) {
    return;
  }

  // Network first strategy for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-cache',
        credentials: 'same-origin'
      })
      .then(function(response) {
        // Clone the response before caching
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function(error) {
        console.log('Network request failed, trying cache:', error);
        return caches.match(event.request)
          .then(function(response) {
            return response || caches.match(`${DOMAIN}/`);
          });
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
      .catch(function(error) {
        console.log('Fetch failed:', error);
        throw error;
      })
  );
});