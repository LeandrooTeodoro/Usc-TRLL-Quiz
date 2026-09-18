/**
 * Service Worker — cache-first do app shell para permitir uso 100% offline
 * (requisito da TRLL: canteiros e subestações sem cobertura de dados).
 */

const CACHE_NAME = "trll-quiz-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/vendor/jspdf.umd.min.js",
  "./js/quiz-questions.js",
  "./js/db.js",
  "./js/supabase-client.js",
  "./js/app.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Nunca cachear chamadas ao Supabase — essas seguem a estratégia network-only
  // e são tratadas pela fila de sincronização em js/supabase-client.js.
  if (url.pathname.startsWith("/rest/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok && event.request.method === "GET") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
