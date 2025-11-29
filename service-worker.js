const CACHE_NAME = 'dandelo-pwa-v4';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/admin.html',
  '/style.css',
  '/app.js',
  '/admin.js',
  '/manifest.json',
  '/logo-lion.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  // Tomar control inmediato sin esperar al SW anterior
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Reclamar inmediatamente los clientes abiertos
  self.clients.claim();
});

// Estrategia:
// - Navegación (SPA / HTML): network-first
// - Assets (CSS, JS, imágenes): cache-first con actualización en segundo plano
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  // Navegación (index, admin, refrescos de página)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('/index.html'))
        )
    );
    return;
  }

  // Resto: CSS, JS, imágenes, etc.
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // si falla la red, devolvemos caché si existe
      return cached || fetchPromise;
    })
  );
});
