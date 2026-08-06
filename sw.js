/* ================================================================
   SERVICE WORKER — REPORTES C.C.R.M
   Ubicación física: /sw.js (En la raíz del proyecto)
   Scope registrado: '/'
   Estrategia: Stale-While-Revalidate
================================================================ */

const CACHE_NAME = 'metricas-v42';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/CONFIG APP MOVIL/manifest.json',
  '/CONFIG APP MOVIL/icon-192.png',
  '/CONFIG APP MOVIL/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  const isExternal =
    url.hostname.includes('api.github.com')       ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')    ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('sheets.googleapis.com');

  if (isExternal || event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(event.request);

      const networkFetch = fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            cache.put(event.request, res.clone());
          }
          return res;
        })
        .catch(() => undefined);

      return cached || networkFetch;
    })
  );
});
