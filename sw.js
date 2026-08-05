/* ============================================================
   sw.js — 오프라인 지원 서비스워커
   앱 셸을 캐시하고, 네트워크 실패 시 캐시로 응답한다.
   ============================================================ */

const CACHE = 'sv-master-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/icons.js',
  './js/data.js',
  './js/store.js',
  './js/ui.js',
  './js/views.js',
  './js/views2.js',
  './js/app.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => { /* 일부 자원 실패해도 설치는 진행 */ })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 캐시 우선 → 네트워크 폴백 (오프라인 최우선 전략) */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          // 동일 출처 자원만 런타임 캐시
          if (res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
