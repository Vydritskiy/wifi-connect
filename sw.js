self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', event => {
  // very small fetch handler: try network first, fall back to cache if offline
  event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
});
