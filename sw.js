/* ============================================================
   sw.js — 오프라인 지원 서비스워커

   전략: 네트워크 우선 → 실패 시 캐시 (network-first, cache fallback)
   일정이 자주 바뀌는 앱이라, 온라인이면 항상 최신 파일을 받아야 한다.
   캐시 우선으로 두면 일정을 고쳐도 이미 설치한 기기에 반영되지 않는다.
   비행기·해외처럼 네트워크가 없을 때만 캐시로 동작한다.

   ※ 앱 파일을 수정하면 아래 VERSION을 반드시 올릴 것.
     이 파일 내용이 바뀌어야 브라우저가 업데이트를 감지한다.
   ============================================================ */

const VERSION = '2026-08-12j';
const CACHE = `sv-master-${VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './version.json',
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
      .catch(() => self.skipWaiting())   // 일부 자원 실패해도 설치는 진행
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === location.origin; } catch { /* 무시 */ }
  if (!sameOrigin) return;   // 폰트 등 외부 자원은 브라우저에 맡긴다

  // cache: 'no-cache' — 브라우저 HTTP 캐시를 건너뛰지 않되 항상 서버에 재검증한다.
  // 이게 없으면 파일을 고쳐도 기기에 남은 옛 사본이 그대로 쓰인다.
  // (바뀐 게 없으면 서버가 304를 주므로 비용은 거의 없다)
  const fresh = new Request(req.url, {
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: req.headers,
    mode: req.mode === 'navigate' ? 'same-origin' : req.mode,
    redirect: 'follow',
  });

  e.respondWith(
    fetch(fresh)
      .then(async (res) => {
        // 리다이렉트를 거친 응답은 그대로 돌려줄 수 없다.
        // 브라우저가 "Response served by service worker has redirections" 오류를 내고
        // 페이지 진입 자체가 실패한다 (호스팅이 /index.html → / 로 보내는 경우 등).
        // 최종 내용만 담은 새 응답으로 바꿔서 전달한다.
        let out = res;
        if (res.redirected) {
          const body = await res.clone().arrayBuffer();
          out = new Response(body, {
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
          });
        }
        // 최신 응답을 캐시에 갱신해 다음 오프라인 실행에 대비
        if (out.ok) {
          const copy = out.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return out;
      })
      .catch(() =>
        // 오프라인: 캐시 → 없으면 앱 셸
        caches.match(req).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
