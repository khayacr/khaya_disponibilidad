/* Khaya PWA — service worker mínimo para criterios de instalación (Chrome/Edge). */
const CACHE = 'khaya-shell-v1';

self.addEventListener('install', (event) => {
  const scope = self.registration.scope;
  const shell = new URL('index.html', scope).href;
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(shell))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  event.respondWith(
    fetch(request).catch(() => caches.match(request)),
  );
});
