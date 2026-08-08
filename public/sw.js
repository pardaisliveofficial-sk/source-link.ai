// Service Worker for SourceLink.ai Progressive Web App
const CACHE_NAME = 'sourcelink-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle dynamic API requests directly
  if (event.request.url.includes('/api/') || event.request.url.includes('api.github.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
