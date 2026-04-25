/* Development stub Service Worker */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', () => {
  /* no-op: bypass caching in development */
});