/* ================================================================
   SERVICE WORKER — CCRM CARABOBO
   Repositorio: alexchouriors/M-TRICAS-CARABOBO
   Ubicación física: /M-TRICAS-CARABOBO/CONFIG APP MOVIL/sw.js
   Scope registrado: '/M-TRICAS-CARABOBO/'  (controla toda la aplicación
   dentro de ese subpath, tal como la sirve GitHub Pages para un
   repositorio de proyecto, no de usuario/organización)
   Estrategia: Stale-While-Revalidate
================================================================ */

const CACHE_NAME = 'metricas-v39';

/* Archivos pre-cacheados en la instalación.
   Las rutas son absolutas desde la raíz del sitio, incluyendo el
   subpath del repo (GitHub Pages sirve el proyecto bajo /M-TRICAS-CARABOBO/). */
const PRECACHE_URLS = [
  '/M-TRICAS-CARABOBO/index.html',
  '/M-TRICAS-CARABOBO/style.css',
  '/M-TRICAS-CARABOBO/app.js',
  '/M-TRICAS-CARABOBO/CONFIG APP MOVIL/manifest.json',
  '/M-TRICAS-CARABOBO/CONFIG APP MOVIL/icon-192.png',
  '/M-TRICAS-CARABOBO/CONFIG APP MOVIL/icon-512.png'
];

/* ── INSTALL ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: elimina cachés de versiones anteriores ── */
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

/* ── FETCH: Stale-While-Revalidate ──
   Responde con caché si existe (rápido) y en paralelo actualiza el caché.
   APIs externas (GitHub, Fonts, CDNs) se sirven directo desde la red.
*/
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
