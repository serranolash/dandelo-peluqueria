// service-worker.js

// ⚡ Subí este número cuando hagas cambios importantes en el frontend
const CACHE_NAME = 'dandelo-pwa-v6';

const URLS_TO_CACHE = [
  '/',              // raíz
  '/index.html',
  '/admin.html',
  '/style.css',
  '/manifest.json',
  '/logo-lion.svg',
  '/assets/lion-bg.png', // si existe este archivo en producción
];

// 👉 INSTALACIÓN: precache del “shell” básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting(); // toma control sin esperar
});

// 👉 ACTIVACIÓN: eliminar caches viejos
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
  self.clients.claim();
});

// 👉 ESTRATEGIA DE FETCH:
// - NO tocamos llamadas a API (tu backend en Railway).
// - Navegación (HTML) → network-first con fallback a cache.
// - Archivos estáticos (CSS, imágenes, JS) → stale-while-revalidate.
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sólo manejamos GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) NO interceptar requests a tu backend (dominio externo)
  //    Esto en realidad ya lo maneja el navegador solo, porque
  //    el SW tiene scope sólo sobre su propio origen (Netlify),
  //    pero lo dejamos documentado:
  if (!url.origin.includes(self.location.origin)) {
    return; // dejamos pasar tal cual
  }

  // 2) Navegación → network-first
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

  // 3) Recursos estáticos (CSS, imágenes, JS, etc.) → cache primero,
  //    pero actualizamos en segundo plano (stale-while-revalidate).
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
        .catch(() => {
          // si falla red, devolvemos lo que haya en caché (si existe)
          return cached;
        });

      // si ya hay en caché, lo devolvemos rápido y actualizamos en 2º plano
      // si NO hay en caché, esperamos al fetch
      return cached || fetchPromise;
    })
  );
});
