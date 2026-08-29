# 01. 소셜 로그인 (간편로그인)

카카오 · 구글 간편로그인. **비밀번호를 우리가 다루지 않는다** — 계정 생성·비밀번호·
토큰 발급은 전부 Supabase Auth가 처리하고, 앱은 "이 브라우저가 누구인가"만 쿠키로 받는다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [LoginSheet.tsx](../../src/components/LoginSheet.tsx) | 로그인 시트 UI · `signInWithOAuth` 호출 |
| [lib/supabase/client.ts](../../src/lib/supabase/client.ts) | 브라우저용 Supabase 클라이언트 |
| [lib/supabase/server.ts](../../src/lib/supabase/server.ts) | 서버(RSC·액션·라우트)용 클라이언트, 쿠키 어댑터 |
| [auth/callback/route.ts](../../src/app/auth/callback/route.ts) | OAuth 콜백 — 코드 ↔ 세션 교환 |
| [auth/signout/route.ts](../../src/app/auth/signout/route.ts) | 로그아웃 |
| [middleware.ts](../../src/middleware.ts) | 만료 토큰 자동 갱신 |
| [lib/browser-env.ts](../../src/lib/browser-env.ts) | 인앱 브라우저 판별 |

---

## 1. 큰 그림 — Supabase가 대신 해주는 일

직접 OAuth를 붙이면 앱이 **OAuth 클라이언트**가 되어야 한다. 카카오/구글마다
authorize URL을 만들고, client secret을 보관하고, 콜백에서 토큰을 교환하고,
사용자 테이블을 만들고, 세션을 관리해야 한다.

Supabase를 쓰면 **Supabase 프로젝트가 OAuth 클라이언트**가 된다.

```
                    ┌───────────────────────────────┐
   우리 앱  ───────▶ │  Supabase Auth (GoTrue)       │ ───▶ 카카오 / 구글
   "로그인 시작"      │  · client secret 보관          │
                    │  · authorize URL 조립          │
   ◀─────────────── │  · 콜백 수신 · 토큰 교환        │ ◀───
   "이 code 줄게"     │  · auth.users / auth.identities│
                    │  · JWT 발급                    │
                    └───────────────────────────────┘
```

우리가 저장하는 것은 **client secret이 아니라 Supabase URL + publishable key**뿐이다.
그래서 이 두 값이 브라우저에 노출돼도 문제가 없다 (`NEXT_PUBLIC_` 접두사인 이유).
실제 권한은 전부 DB의 RLS가 JWT를 보고 판단한다 → [13. 보안 모델](13-security.md)

> `service_role` 키는 **이 프로젝트에서 쓰지 않는다.** 그 키는 RLS를 통째로 우회하므로,
> 한 번이라도 서버 코드에 들이면 "그 코드가 실수하지 않는다"에 보안을 걸게 된다.
> 대신 필요한 특권 작업만 `security definer` 함수로 좁게 뚫었다.

---

## 2. 전체 흐름 (PKCE)

```
① 사용자가 "카카오로 로그인" 클릭
   └─ LoginSheet: supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: "https://우리도메인/auth/callback?next=/my",
                   scopes: "profile_nickname profile_image" }
      })
      · code_verifier를 만들어 브라우저에 저장하고 code_challenge만 URL에 담는다 (PKCE)

② 브라우저가 Supabase로 이동
   https://<project>.supabase.co/auth/v1/authorize
        ?provider=kakao&redirect_to=<redirectTo>&code_challenge=...
   · Supabase가 redirect_to를 허용 목록(URL Configuration)과 대조 — 안 맞으면 여기서 끝

③ Supabase가 카카오 동의 화면으로 리다이렉트
   · client_id / scope / redirect_uri는 Supabase가 조립한다
   · redirect_uri = https://<project>.supabase.co/auth/v1/callback
     ← 카카오 콘솔에 등록해야 하는 주소는 우리 도메인이 아니라 이것

④ 사용자가 동의 → 카카오가 ③의 redirect_uri로 인가 코드 전달

⑤ Supabase가 카카오와 토큰 교환 → 프로필 조회
   · auth.users 에 유저 생성(또는 기존 유저 매칭)
   · auth.identities 에 (provider, provider_id) 기록
   · raw_user_meta_data 에 닉네임·프로필 사진 저장

⑥ Supabase가 우리 앱으로 리다이렉트
   https://우리도메인/auth/callback?next=/my&code=<인가코드>

⑦ /auth/callback (서버 라우트)
   · supabase.auth.exchangeCodeForSession(code)
     → code + code_verifier 를 Supabase에 보내 access/refresh 토큰 수령
     → @supabase/ssr 쿠키 어댑터가 HttpOnly 쿠키로 굽는다
   · get_my_summary() RPC 호출
       null 이면  → /bind   (아직 명단 연결 전)
       있으면     → next    (기본 /my)
```

### 왜 우리 앱에 콜백 라우트가 따로 필요한가

⑥에서 Supabase가 주는 것은 **세션이 아니라 인가 코드**다. 이 코드를
`exchangeCodeForSession`으로 바꿔야 토큰이 나오고, 그 토큰을 **서버가 쿠키로 구워야**
서버 컴포넌트·서버 액션에서도 로그인 상태를 알 수 있다.

브라우저 localStorage에만 세션을 두면 SSR 단계에서는 항상 비로그인으로 보인다.
`@supabase/ssr`의 `createServerClient`에 쿠키 어댑터를 넘기는 이유가 이것이다.

### 오픈 리다이렉트 방어

`next`는 URL로 들어오므로 그대로 믿으면 외부 사이트로 튕길 수 있다.
콜백에서 **경로형(`/`로 시작)만 허용**한다.

```ts
let next = searchParams.get("next") ?? "/";
if (!next.startsWith("/")) next = "/";
```

---

## 3. 세션이 유지되는 방식

| 계층 | 하는 일 |
|---|---|
| [middleware.ts](../../src/middleware.ts) | 매 요청 `supabase.auth.getUser()` 호출 → 만료 임박한 access token을 refresh token으로 갱신하고 **응답 쿠키를 갈아끼운다** |
| [lib/supabase/server.ts](../../src/lib/supabase/server.ts) | 서버 컴포넌트/액션/라우트에서 쿠키를 읽어 클라이언트 생성. 서버 컴포넌트는 쿠키 **쓰기**가 막혀 있어 `setAll`의 예외를 삼킨다 (갱신은 미들웨어 담당) |
| [lib/supabase/client.ts](../../src/lib/supabase/client.ts) | 브라우저 클라이언트. 로그인 시작(`signInWithOAuth`)에만 쓴다 |

미들웨어가 없으면 access token 만료 시점에 갱신을 못 잡아 사용자가 갑자기
로그아웃된 것처럼 보인다. 정적 자산은 미들웨어를 타지 않도록 matcher에서 제외했다
(`_next/static`, 이미지 확장자 등).

키 이름은 두 가지를 모두 인식한다 — 신규 프로젝트는 `PUBLISHABLE_KEY`,
기존 프로젝트는 `ANON_KEY`. `NEXT_PUBLIC_*`은 빌드 시 정적 치환되므로
각각을 리터럴로 읽어야 한다(변수로 조립하면 치환이 안 된다).

---

## 4. 카카오 스코프 — KOE205 함정

카카오는 **콘솔에 설정하지 않은 동의항목을 요청하면 `KOE205`로 거부**한다.

`signInWithOAuth`에 `scopes`를 넘겨도 **Supabase는 기본 스코프를 대체하지 않고 병합한다.**
실제로 나가는 authorize URL을 뜯어보면 이렇게 된다:

```
scope = account_email profile_image profile_nickname profile_nickname profile_image
        ^^^^^^^^^^^^^ Supabase 기본값이 그대로 남는다
```

`account_email`은 카카오에서 **비즈니스 인증을 받아야 쓸 수 있는 항목**이라,
개인 개발자 앱이면 여기서 막힌다.

**해결**: 카카오 콘솔에서 비즈니스 채널을 연결해 "개인 개발자 비즈 앱"으로 전환하면
`account_email`이 열려 통과한다. 선택 동의로 두면 사용자가 거부해도 로그인은 진행된다.

코드 쪽은 필요한 항목만 명시해 중복을 최소화한다:

```ts
...(provider === "kakao" ? { scopes: "profile_nickname profile_image" } : {})
```

> 디버깅 팁 — 증상만으로는 원인을 못 찾는다. `signInWithOAuth`가 리다이렉트하는
> Supabase authorize URL을 `redirect: "manual"`로 받아 `Location` 헤더의 `scope=`를
> 직접 눈으로 확인하는 게 가장 빠르다.

---

## 5. 카카오톡 인앱 브라우저 — 구글이 막히는 문제

참가자 대부분이 **카톡으로 링크를 받는다.** 그런데 구글은 인앱 웹뷰의 OAuth를
정책적으로 차단한다(`disallowed_useragent`). 사용자는 이유 없이 흰 화면을 본다.

[browser-env.ts](../../src/lib/browser-env.ts)가 User-Agent로 인앱을 판별하고,
LoginSheet가 버튼을 바꿔 끼운다:

| 환경 | 카카오 버튼 | 구글 버튼 |
|---|---|---|
| 일반 브라우저 | 정상 로그인 | 정상 로그인 |
| 카톡·네이버·라인·인스타·페북 인앱 | **정상 로그인**(영향 없음) | "외부 브라우저로 열기"로 교체 + 안내 문구 |

외부 브라우저 탈출은 OS별로 다르다:

```
Android : intent://<주소>#Intent;scheme=https;package=com.android.chrome;end
iOS     : kakaotalk://web/openExternal?url=<인코딩된 주소>
```

**그래서 카카오 provider는 반드시 켜둬야 한다.** 인앱에서 확실히 동작하는 유일한 수단이다.

---

## 6. 우리가 받는 사용자 정보

Supabase가 `auth.users.raw_user_meta_data`에 프로필을 넣어준다. 앱은 두 곳에서 쓴다:

- **`/bind` 첫 화면 이름 미리 채우기** — `user_metadata.name` / `full_name`
- **관리자 승인 화면의 사칭 판별** — 닉네임·프로필 사진·이메일·로그인 수단

`auth.users`는 PostgREST로 직접 못 읽으므로, `admin_join_requests` RPC가
`security definer`로 조인해 내려준다 → [02. 가입 승인](02-join-approval.md)

참가자 행에는 어떤 소셜로 붙었는지만 기록한다:

```sql
bound_provider = auth.jwt() -> 'app_metadata' ->> 'provider'
```

---

## 7. 로그아웃

```
POST /auth/signout → supabase.auth.signOut() → 303 리다이렉트 "/"
```

`<form method="post">`로 보낸다. GET 링크로 두면 프리페치나 크롤러가 로그아웃시킬 수 있다.
미리보기 쿠키도 함께 지운다 → [14. 데모 모드](14-demo-mode.md)

---

## 8. 콘솔 설정 체크리스트

### Supabase

1. **Authentication → Providers**에서 Kakao, Google 활성화 → 각 provider의 client id/secret 입력
2. **Authentication → URL Configuration**
   - Site URL: 배포 도메인
   - Redirect URLs: `https://<도메인>/auth/callback`, `http://localhost:3000/auth/callback`
   - ⚠️ 여기 없는 주소로는 `redirect_to`가 거부된다. 로컬 포트를 바꿔 띄웠다면 그 포트도 등록해야 한다

### 카카오 (developers.kakao.com)

| 설정 | 위치 |
|---|---|
| REST API 키 · Client Secret | 앱 설정 → 앱 키 / 보안 |
| Redirect URI `https://<project>.supabase.co/auth/v1/callback` | 카카오 로그인 → Redirect URI |
| 동의항목(닉네임·프로필사진·이메일) | 카카오 로그인 → 동의항목 |
| 비즈 앱 전환 | 비즈니스 → 개인 개발자 비즈 앱 (`account_email` 해제용) |

### 구글 (GCP)

- OAuth 클라이언트(웹) 생성 → 승인된 리디렉션 URI에 `https://<project>.supabase.co/auth/v1/callback`
- **OAuth 동의 화면을 "게시(In production)" 상태로** — 테스트 모드는 사전 등록 100명 제한

---

## 9. 계정 연결 — 안 하기로 한 것

카카오로 가입한 사람이 나중에 구글로 로그인하면 **다른 유저**가 된다
(`auth.users` 행이 따로 생김). 이메일이 같아도 자동 병합되지 않는다.
그 상태로 `/bind`에 오면 명단이 이미 점유돼 있어 `taken`으로 막힌다.

검토한 세 가지 길:

| | 방법 | 왜 안 했나 |
|---|---|---|
| A | 안내 문구 | **이걸 했다** |
| B | Supabase `linkIdentity` | 이미 로그인한 상태에서만 붙는다 — 구글로 *먼저* 로그인해 버린 사람은 못 구한다 |
| C | `participant_logins` 옆 테이블 | 양방향 다 되지만 RLS를 다시 쓴다 |

C가 설계상 가장 옳다. `participants`는 사람·배정·체크인을 갖고, 로그인 수단은
옆 테이블에 쌓는 모양이다 — provider가 늘어도 스키마가 그대로고, 승인이
로그인 단위로 붙는다. **승인을 로그인마다 따로 받는 게 핵심**이다.
그게 없으면 남의 이름·생년월일·전화번호를 아는 사람이 두 번째 provider로
그 명단을 가져갈 수 있다.

그런데 `auth_user_id`가 **SQL 30군데, 앱 코드 11군데**에 있고 대부분이
RLS의 `auth_user_id = auth.uid()`다. 행사 2주 전에 그걸 다시 쓰는 건
빈도 낮은 편의에 비해 위험이 크다 — 조건 하나 틀리면 남의 QR이 보인다.

그래서 A만 했다. `taken` 문구를 이렇게 바꿨다:

> 이미 연결된 명단이에요. 혹시 카카오나 구글 중 다른 방법으로 먼저 로그인하신 적
> 있나요? 처음 쓰신 방법으로 로그인하시면 바로 들어가실 수 있어요.
> 그래도 안 되면 운영진에 문의해주세요.

예전 문구는 「다른 사람이 잘못 연결했을 수 있어요」가 먼저 나와서, 본인이
자기 계정을 보고 도용을 의심하게 만들었다. **흔한 경우를 앞에, 드문 경우를 뒤에** 둔다.

정말 막힌 사람(예: 카카오 계정 분실)은 관리자가 체크인 탭에서 연결을 해제해
다시 붙이면 된다 → [04. 체크인](04-checkin.md)

다음 해에 재사용한다면 그때 C로 만든다.

---

## 10. 증상 → 원인

| 증상 | 원인 |
|---|---|
| 로그인 후 `localhost`로 튕김 | Supabase URL Configuration의 **Site URL**이 아직 localhost |
| `KOE205` | 카카오 콘솔 동의항목 ≠ 요청 스코프 (§4) |
| 구글에서 `disallowed_useragent` | 인앱 브라우저 (§5) |
| 콜백은 되는데 계속 비로그인 | 미들웨어가 안 도는 경로이거나 쿠키가 안 구워짐 |
| `redirect_to` 거부 | Redirect URLs 허용 목록에 없는 주소·포트 |
| 로그인 버튼이 비활성 | `NEXT_PUBLIC_SUPABASE_URL` / key 미설정 → 데모 로그인만 노출 |
