/**
 * MIRACLE 2026 서비스 워커
 * - 정적 자산: 캐시 우선 (포스터·아이콘·빌드 자산)
 * - 페이지: 네트워크 우선 → 실패 시 캐시 → 오프라인 안내
 * - 개인정보/관리자 경로는 캐시하지 않는다
 */
const VERSION = "v1";
const STATIC_CACHE = `miracle-static-${VERSION}`;
const PAGE_CACHE = `miracle-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/poster.jpg",
  "/wordcard-bg.jpg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/** 캐시하면 안 되는 경로 — 개인정보·인증·관리자·API */
const NO_CACHE = [/^\/my/, /^\/gallery/, /^\/admin/, /^\/api\//, /^\/auth\//, /^\/bind/];

const isNoCache = (pathname) => NO_CACHE.some((re) => re.test(pathname));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("miracle-") && !k.endsWith(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNoCache(url.pathname)) return;

  // 빌드 자산·이미지 — 캐시 우선
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // 페이지 — 네트워크 우선, 끊기면 캐시 → 오프라인 안내
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(OFFLINE_URL))
            .then((hit) => hit || Response.error())
        )
    );
  }
});

/*
 * 웹 푸시 — 관리자에게 가입 요청을 알린다.
 *
 * 알림은 앱이 닫혀 있어도 온다. 그래서 여기(서비스 워커)가 받는다.
 * 눌렀을 때 이미 열려 있는 창이 있으면 그 창을 쓰고, 없을 때만 새로 연다 —
 * 알림을 누를 때마다 탭이 하나씩 늘면 곤란하다.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "MIRACLE";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // 같은 tag면 덮어쓴다 — 여러 건이 쌓여 알림창을 채우지 않게
      tag: data.tag || "miracle",
      renotify: true,
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(new URL(target, self.location.origin).pathname)) {
          return client.focus();
        }
      }
      const open = list.find((c) => "navigate" in c);
      if (open) return open.navigate(target).then((c) => c && c.focus());
      return self.clients.openWindow(target);
    })
  );
});
