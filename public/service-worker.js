// Service Worker for FIRECalculator.ai
const CACHE_NAME = 'firecalculator-v1';
const RUNTIME_CACHE = 'firecalculator-runtime';

// App shell files to cache on install
const APP_SHELL = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - Cache app shell files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a request is for an API or external resource
const isApiOrExternalRequest = (url) => {
  return url.includes('/api/') || 
         url.includes('analytics') || 
         !url.startsWith(self.location.origin);
};

// Helper function to determine if a request is for an asset
const isAssetRequest = (url) => {
  const assetsExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.json', '.woff', '.woff2', '.ttf', '.eot'];
  return assetsExtensions.some(ext => url.endsWith(ext));
};

// Helper function to determine if request is for HTML navigation
const isHtmlNavigation = (request) => {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && 
          request.headers.get('accept').includes('text/html'));
};

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Don't cache API calls or external resources
  if (isApiOrExternalRequest(url.href)) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigation requests (HTML), use network-first strategy
  if (isHtmlNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache a clone of the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, use cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // For asset requests, use stale-while-revalidate strategy
  if (isAssetRequest(url.href)) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // Return cached response immediately (stale)
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            // Update cache with fresh response
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return nothing - the cached response was already returned
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default cache-first strategy for other requests
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache for future
        return fetch(request).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        });
      })
  );
}); 