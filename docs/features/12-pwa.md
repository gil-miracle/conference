# 12. PWA · 오프라인

홈 화면에 추가하면 앱처럼 뜬다. 행사장(ACTS29 비전 빌리지)은 신호가 약한 곳이 있어
**연결이 끊겨도 화면이 죽지 않는 것**이 목표다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [app/manifest.ts](../../src/app/manifest.ts) | 매니페스트 (`/manifest.webmanifest`) |
| [public/sw.js](../../public/sw.js) | 서비스 워커 |
| [ServiceWorker.tsx](../../src/components/ServiceWorker.tsx) | 등록 |
| [app/offline/page.tsx](../../src/app/offline/page.tsx) | 오프라인 폴백 |
| [app/layout.tsx](../../src/app/layout.tsx) | PWA 메타 · viewport |

---

## 1. 매니페스트

`manifest.ts`로 생성한다(정적 JSON이 아니라 코드라 타입 체크가 된다).

```ts
display: "standalone",      // 주소창 없이 앱처럼
orientation: "portrait",
background_color: "#FAF6EE",
theme_color: "#FAF6EE",     // 크림색 — 상태바까지 이어진다
```

아이콘 3종: 192 / 512 / **maskable 512**.
maskable은 안드로이드가 원형·스퀴클로 잘라내도 로고가 안 잘리게 여백을 둔 버전이다.

### 바로가기

길게 눌렀을 때 나오는 메뉴. 행사 당일 동선 기준으로 3개를 넣었다.

```
체크인 QR   → /my
타임테이블   → /timetable
송리스트     → /songs
```

### 노치 대응

```ts
export const viewport: Viewport = { viewportFit: "cover", ... };
```

홈 화면에서 실행했을 때 상하단 노치 영역까지 배경이 이어진다.

---

## 2. 서비스 워커 전략

리소스 종류별로 다르게 처리한다.

```
정적 자산  (/_next/static/, /icons/, 이미지·폰트)
   → 캐시 우선. 있으면 바로 주고, 없으면 받아서 캐시
   → 빌드 해시가 파일명에 있으므로 오래된 걸 줄 위험이 없다

페이지 (navigate 요청)
   → 네트워크 우선. 성공하면 캐시 갱신
   → 실패하면 캐시 → 그것도 없으면 /offline

캐시 금지 (/my, /gallery, /admin, /api, /auth, /bind)
   → 서비스 워커가 손대지 않고 그대로 통과
```

### 왜 개인정보 경로를 캐시하지 않나

**공용 기기 문제** 때문이다. 체크인 데스크 태블릿에 남은 캐시로 앞사람의
체크인 QR이나 숙소 배정이 보이면 안 된다. 로그아웃해도 캐시는 안 지워진다.

```js
const NO_CACHE = [/^\/my/, /^\/gallery/, /^\/admin/, /^\/api\//, /^\/auth\//, /^\/bind/];
```

`/auth`를 넣은 이유는 따로 있다 — OAuth 콜백은 **일회용 인가 코드**를 담고 있어서
캐시된 응답을 재생하면 교환이 실패한다.

POST 요청과 외부 도메인(YouTube·Cloudinary·카카오)도 건드리지 않는다.

---

## 3. 캐시 버전 관리

```js
const VERSION = "v1";
const STATIC_CACHE = `miracle-static-${VERSION}`;
const PAGE_CACHE = `miracle-pages-${VERSION}`;
```

`activate` 시점에 **버전이 다른 `miracle-*` 캐시를 전부 지운다.**

```js
keys.filter((k) => k.startsWith("miracle-") && !k.endsWith(VERSION))
    .map((k) => caches.delete(k))
```

`skipWaiting()` + `clients.claim()`으로 새 워커가 즉시 인계받는다.
행사 중 급히 고칠 일이 생겼을 때 사용자가 앱을 완전히 껐다 켤 때까지
기다리지 않아도 되도록.

> **배포 전 `VERSION`을 올릴 것.** 안 올리면 오래된 자산이 계속 나갈 수 있다.

---

## 4. 등록 시점

```tsx
if (process.env.NODE_ENV !== "production") return;   // 개발 중엔 등록 안 함
window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
```

- **개발 모드 제외** — 서비스 워커가 HMR을 가로채면 코드를 고쳐도 화면이 안 바뀐다
- **`load` 이후 등록** — 첫 화면 렌더와 대역폭 경쟁을 하지 않게
- **실패해도 무시** — 사파리 프라이빗 모드 등에서 등록이 막혀도 사이트는 정상 동작해야 한다

---

## 5. 오프라인 페이지

`/offline`은 프리캐시 대상이라 오프라인에서도 뜬다.

```
OFFLINE
지금은 연결이 끊겼어요

인터넷이 다시 연결되면 자동으로 볼 수 있어요.
비전 빌리지 안에서는 신호가 약한 곳이 있을 수 있습니다.

[ 다시 시도 ]
```

행사장 신호 상태를 미리 언급해 "앱이 고장났나"라는 오해를 줄인다.

프리캐시 목록에 포스터와 말씀카드 배경도 넣었다 — 오프라인에서도
홈과 My의 주요 이미지가 보인다.

```js
const PRECACHE = ["/offline", "/poster.jpg", "/wordcard-bg.jpg",
                  "/icons/icon-192.png", "/icons/icon-512.png"];
```

---

## 6. 테스트

서비스 워커는 프로덕션 빌드에서만 등록되므로 `npm run dev`로는 확인이 안 된다.

```bash
npm run build && npm start
```

DevTools → Application → Service Workers에서 등록 확인,
Network 탭 **Offline** 체크 후 새로고침해 `/offline`이 뜨는지 본다.

> `.next` 캐시가 꼬여 `Cannot find module './xxx.js'`가 나면
> dev 서버를 끄고 `.next`를 지운 뒤 다시 빌드한다.
> dev 서버가 떠 있는 채로 `npm run build`를 돌리면 자주 발생한다.
