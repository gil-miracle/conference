# 11. 렌더링 · 성능

메뉴를 누르면 **즉시** 바뀌어야 한다. 그러려면 페이지가 정적이어야 하고,
정적이려면 **레이아웃이 세션을 읽으면 안 된다.** 이 문서는 그 이야기다.

---

## 1. 라우트별 렌더링 방식

| 라우트 | 방식 | 근거 |
|---|---|---|
| `/` `/songs` | ISR 60초 | 방명록 3개 · 송리스트만 DB |
| `/guestbook` | ISR 30초 | 글이 자주 올라옴 |
| `/about` `/speakers` `/timetable` | ISR 1시간 | 콘텐츠가 코드에서만 온다 |
| `/speakers/[id]` | SSG | `generateStaticParams` |
| `/my` `/gallery` `/bind` | 동적 | 개인화 |
| `/admin/*` `/api/*` | 동적 | 권한 |

확인 방법:

```bash
curl -sI https://miracle-conference.vercel.app/timetable |
  grep -iE "x-nextjs-prerender|x-vercel-cache|cache-control"
# X-Nextjs-Prerender: 1              ← 사전 렌더됨
# X-Vercel-Cache: HIT (또는 STALE)    ← 엣지 CDN에서 나감
# Cache-Control: public, max-age=0, must-revalidate

curl -sI https://miracle-conference.vercel.app/my | grep -i cache-control
# Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
```

브라우저에 내려가는 `Cache-Control`은 `max-age=0`이다. Vercel이 Next의 `s-maxage`를
자기 CDN 계층으로 흡수하기 때문 — 실제 캐시 여부는 `X-Vercel-Cache`로 본다.
`STALE`은 만료된 캐시를 즉시 주고 뒤에서 새로 굽는 중이라는 뜻이라 정상이다.

---

## 2. 핵심 ① — 공개 데이터는 쿠키를 읽지 않는다

`export const revalidate = 60`을 써 놓아도, 그 페이지가 부르는 함수 어딘가에서
`cookies()`가 호출되면 **Next는 라우트를 동적으로 확정하고 revalidate를 무시한다.**

한동안 이걸 놓쳐서 `/`·`/songs`·`/guestbook`이 전부 동적으로 빌드되고 있었다.
`revalidate`가 선언돼 있었는데도 그랬다 — 데이터 함수가 `getSupabaseServer()`를 썼고,
그게 세션을 붙이려 `cookies()`를 부르기 때문이다.

```
빌드 출력으로 확인한다:
  ƒ /songs                     ← 동적. revalidate가 죽어 있다
  ○ /songs   ... 1m            ← 정적 + ISR 60초. 이게 맞는 상태
```

해결은 **읽기 경로를 갈라놓는 것**이다.

| | 클라이언트 | 쓰는 곳 |
|---|---|---|
| 공개 데이터 | [`getSupabaseAnon()`](../../src/lib/supabase/anon.ts) — 쿠키 없음 | 방명록 목록 · 송리스트 · 사이트 설정 |
| 개인화 데이터 | `getSupabaseServer()` — 쿠키 있음 | `/my` · `/gallery` · 관리자 · 서버 액션 |

공개 쪽은 RLS가 이미 익명 접근을 허용해 둔 데이터라 세션이 없어도 정확히
필요한 만큼만 내려온다.

- `guestbook_select` → `not hidden` 인 글만
- `song_sets` / `songs` / `site_settings` → `using (true)`

**보안이 느슨해진 게 아니다.** 오히려 익명 클라이언트는 admin도 아니고 본인도
아니므로 볼 수 있는 범위가 더 좁다. 개인화가 필요한 곳에서 실수로 쓰면
데이터가 안 나와서 즉시 드러난다.

---

## 3. 핵심 ② — 레이아웃에서 세션을 빼다

처음엔 `(site)/layout.tsx`가 서버에서 세션을 읽었다. 자연스러워 보이지만
**하위 페이지가 전부 동적이 된다.** 레이아웃이 `cookies()`를 만지는 순간
그 아래 모든 라우트가 요청마다 서버를 타기 때문이다.

결과: `<Link>` prefetch가 무력해지고, 메뉴를 누를 때마다 **서버 왕복 0.3초**가 생겼다.
SPA인데 SPA 같지 않은 상태.

해결: 세션을 클라이언트로 내렸다.

```tsx
// (site)/layout.tsx — 서버 조회 없음
export default function SiteLayout({ children }) {
  return (
    <SessionProvider>      {/* SWR 로 /api/session 조회 */}
      <Banner />
      <Nav />
      <main className="site-main">{children}</main>
      <SiteFooter />
      <BottomTabs />
      <LoginSheet />
    </SessionProvider>
  );
}
```

```
[ 정적 셸 ]  포스터·본문·메뉴 구조 — CDN 엣지에서 즉시
     +
[ 세션 조각 ] 로그인/로그아웃 버튼, Admin 링크, 배너, 메뉴 노출 — 곧 채워짐
```

`/api/session`은 **개인정보를 담지 않는다.** 불리언 몇 개와 배너 텍스트뿐이다.

```ts
{ authed, bound, isAdmin, banner, menus, demoMode }
```

SWR 설정도 조용하게 뒀다 — 포커스마다 재조회하면 탭 전환할 때마다 요청이 나간다.

```ts
{ revalidateOnFocus: false, dedupingInterval: 30_000 }
```

### 레이아웃 시프트 막기

세션이 오기 전과 후에 내비 폭이 달라지면 메뉴가 밀린다.
`NavAuth`는 로드 전에 **자리만 잡아둔다**.

```tsx
<span className="auth-slot">
  {!loaded ? null : session.authed ? <로그아웃/> : <로그인/>}
</span>
```

---

## 4. loading.tsx를 두지 않는다

한때 `loading.tsx`를 넣었는데, **메뉴를 옮길 때마다 푸터가 올라왔다 내려갔다** 했다.

원인: Suspense fallback이 **페이지를 통째로 대체**한다. 본문이 사라지니
문서 높이가 줄고 푸터가 위로 튀었다가, 새 페이지가 오면 다시 내려간다.

App Router의 기본 동작은 **새 페이지가 준비될 때까지 이전 페이지를 유지**하는 것이다.
그게 훨씬 안정적이라 `loading.tsx`를 지웠다. `min-height`로 최소 높이도 잡아 뒀다.

---

## 5. 등장 애니메이션은 CSS로

원래 IntersectionObserver로 `.reveal`에 클래스를 붙였다.
라우트 이동 시 **본문이 `opacity: 0`으로 남는 버그**가 반복됐다 —
새 DOM이 옵저버에 등록되기 전에 이미 뷰포트 안에 있으면 콜백이 안 온다.

CSS 애니메이션으로 바꾸고 옵저버를 삭제했다.

```css
@keyframes reveal-in {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.reveal { animation: reveal-in 0.45s cubic-bezier(0.2, 0.6, 0.2, 1) both; }
```

`nth-child`로 살짝 시차를 줘 섹션이 한꺼번에 뜨지 않게 했다.

JS가 개입하지 않으니 라우트가 바뀌어도 항상 실행되고, 번들도 줄었다.

> 참고 — 브라우저 pane이 숨겨져 있으면 `visibilityState: "hidden"`이라
> CSS 애니메이션·타이머가 멈춘다. "요소가 안 보인다"는 측정 결과가
> 실제 버그가 아니라 이 아티팩트인 경우가 있다.
> `getAnimations().finish()`로 강제 완료시켜 구분할 수 있다.

---

## 6. 서울 리전

Vercel 기본 함수 리전은 **워싱턴 DC(iad1)** 다. 한국에서 동적 라우트나
`/api/session`을 호출하면 태평양을 왕복한다.

```json
// vercel.json
{ "regions": ["icn1"], "framework": "nextjs" }
```

정적 페이지는 어차피 엣지 CDN에서 나가지만, `/my`·`/admin`·`/api/*`가 체감이 크게 달라진다.
Supabase도 서울 리전이라 함수↔DB 왕복도 같은 지역 안에서 끝난다.

---

## 7. 요청당 DB 왕복 줄이기

`loadContext`를 React `cache()`로 감쌌다. 한 요청 안에서 여러 곳이 호출해도 **1회**만 실행된다.

```ts
const loadContext = cache(async (): Promise<SiteContext> => { ... });
```

세션과 사이트 설정은 서로 독립이라 병렬로 받는다.

```ts
const [userRes, settingsRes] = await Promise.all([
  supabase.auth.getUser(),
  supabase.from("site_settings").select("key,value"),
]);
```

`?demo=1` 오버라이드는 **캐시된 결과 위에 메모리에서 덧씌운다** — 추가 왕복이 없다.

---

## 8. 번들

- **CSS 3분할** — `base.css`(토큰·리셋) / `site.css`(참가자) / `admin.css`(관리자).
  관리자 스타일은 `admin/layout.tsx`에서만 import하므로 참가자 번들에 안 실린다.
- **QR 생성은 서버에서** — `qrcode` 라이브러리가 클라이언트로 안 간다 ([03](03-my-page.md))
- **스캐너는 동적 import** — `html5-qrcode`는 QR 스캔 버튼을 눌렀을 때만 로드 ([04](04-checkin.md))
- **`next/image` 미사용** — Cloudinary가 이미 CDN + 변환을 한다 ([07](07-gallery.md))

---

## 9. 레이아웃 폭

가로 여백을 `--gutter` 변수 하나로 통일했다.

| 화면 | `--gutter` | 결과 |
|---|---|---|
| 데스크톱 (768px~) | **0** | 컨테이너(640px) 경계가 포스터 좌우 끝과 정확히 일치. 상단 내비 로고까지 같은 선 |
| 모바일 | **16px** | 본문은 여백 유지 |

모바일에서는 카드·그리드·미디어 블록(강사 그리드·장소 카드·플레이어·갤러리·My 카드)이
음수 마진으로 화면 끝까지 늘어나 **포스터처럼 꽉 찬다.** 본문 텍스트만 여백을 지켜 가독성을 유지한다.

내비게이션도 폭에 따라 갈린다 — **데스크톱은 상단 가로 메뉴, 모바일은 하단 탭바**
(홈·일정·강사·찬양·My). 행사 당일 체크인 QR까지의 거리를 최단으로 만든 배치다.
