/*
 * Service Worker for RVU Tracker
 *
 * This service worker caches essential files for offline access and serves
 * cached content when the network is unavailable. It uses a simple cache
 * strategy: on installation it adds the core assets to the cache, and on
 * fetch it returns cached responses if available or fetches from the
 * network otherwise.
 */

const CACHE_NAME = 'rvu-app-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  // Perform install steps: pre-cache core assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches if they exist
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit – return the response if found
      if (response) {
        return response;
      }
      // Clone the request; the request is a stream and can only be consumed once
      const fetchRequest = event.request.clone();
      return fetch(fetchRequest)
        .then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          // Clone the response; it's a stream so we need to clone before caching
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Optionally, return offline fallback page or resource here
          return caches.match('/');
        });
    })
  );
});