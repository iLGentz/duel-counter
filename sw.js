'use strict';
// Increment this version whenever a cached application file changes.
const CACHE_PREFIX = `duel-counter:${new URL(self.registration.scope).pathname}:`;
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_FILES = ['./', './index.html', './style.css', './app.js', './manifest.json', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  // No skipWaiting: updates activate after old tabs close, avoiding mixed versions.
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Only the actual entrypoints receive an offline HTML fallback.
    if (event.request.mode === 'navigate' && [scope.pathname, `${scope.pathname}index.html`].includes(url.pathname)) {
      const shell = await cache.match(new URL('./index.html', scope).href);
      if (shell) return shell;
    }
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch { return new Response('Risorsa non disponibile offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  })());
});
