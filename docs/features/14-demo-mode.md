# 14. 미리보기(데모) 모드

**`.env` 없이 `npm run dev`만 해도 모든 화면이 뜬다.** 로그인 후 화면도, 관리자 화면도.

목업 HTML과 실제 코드가 따로 놀지 않게 하려고 만든 장치다.
디자인을 확인하는 사람이 Supabase 계정을 만들 필요가 없다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [lib/demo.ts](../../src/lib/demo.ts) | 데모 데이터 전부 |
| [lib/data/site.ts](../../src/lib/data/site.ts) | 데모 컨텍스트 주입 |
| [lib/admin.ts](../../src/lib/admin.ts) | `requireAdmin` 데모 분기 |

---

## 1. 켜지는 조건

```
참가자 화면
  Supabase 미설정  +  (미리보기 쿠키  또는  ?demo=1)

관리자 화면
  Supabase 미설정            → 자동으로 데모
  또는 ADMIN_DEV_PREVIEW=1  → 단, NODE_ENV !== production 일 때만
```

**Supabase env가 설정되면 데모 경로는 전부 죽는다.**

```ts
async function hasDemoCookie() {
  if (isSupabaseConfigured()) return false;   // ← 여기서 차단
  ...
}
```

배포본에서는 조건이 성립할 수 없다. 프로덕션 빌드는 `isAdminPreview()`도 항상 false다.

---

## 2. 참가자 미리보기

로그인 시트에 "미리보기로 로그인 (데모)" 버튼이 나타난다
(Supabase 미설정일 때만). 쿠키를 굽고 새로고침한다.

```ts
document.cookie = `${DEMO_COOKIE}=1; path=/; max-age=86400`;
```

그러면 `getSiteContext()`가 `DEMO_SUMMARY`를 끼워 넣어 My 화면이 채워진다:
말씀카드 · 비전관 203호 · 룸메이트 4명 · 오렌지조 · 체크인 QR.

`?demo=1` 쿼리로도 된다. 쿠키를 굽지 않고 **그 요청에만** 적용된다 —
캐시된 결과 위에 메모리에서 덧씌우므로 DB 왕복이 추가되지 않는다.

```ts
export async function getSiteContext(demoOverride = false) {
  const ctx = await loadContext();
  if (demoOverride && !isSupabaseConfigured() && !ctx.demoMode) {
    return { ...ctx, demoMode: true, authed: true, summary: DEMO_SUMMARY, galleryOpen: true };
  }
  return ctx;
}
```

---

## 3. 관리자 미리보기

`/admin`에 그냥 들어가면 7개 탭이 전부 데모 데이터로 렌더된다.

```
대시보드   120명 / 87 체크인 / 3 대기 / 28개 방 · 최근 체크인 · 미도착자
승인       가입 요청 2건 (카카오·구글, 소셜 프로필 포함)
체크인     명단 5명 (체크인 여부·숙소·조 섞여 있음)
숙소       방 3개 · 조 2개 · 인원 10명
찬양       SONG_SETS_FALLBACK
게시판     방명록 3건 (숨김 1건 포함)
설정       기본값
```

상단에 초록 배너가 뜬다:

> 관리자 미리보기 모드 — 데모 데이터입니다. Supabase 연결 후 실데이터로 동작해요.

### 화면은 데모여도 변경은 절대 안 된다

이게 핵심이다. **화면 렌더와 데이터 변경을 다른 함수로 갈랐다.**

```ts
requireAdmin()      // 페이지용 — 데모 허용
getAdminContext()   // 액션/API용 — 실제 admin 세션만, 아니면 null
```

모든 서버 액션의 첫 줄이 `getAdminContext()`이고 null이면 즉시 반환한다.
버튼을 누르면 UI가 "미리보기 모드 — 변경사항은 저장되지 않아요" 토스트를 띄운다.

DB 쪽도 마찬가지다. 우회 플래그로 화면을 열어도 RLS는 `auth.uid()` 기준이라
실데이터는 보이지 않는다. 그래서 우회 시에는 아예 데모 데이터를 보여준다.

---

## 4. 데모 데이터

[lib/demo.ts](../../src/lib/demo.ts)에 모여 있다. 목업 v10 / 관리자 목업과 같은 내용이라
**목업 HTML과 실제 화면을 나란히 놓고 비교**할 수 있다.

시각은 호출 시점 기준으로 만든다 — "2분 전"처럼 상대 시간이 자연스럽게 보이도록.

```ts
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
```

---

## 5. 폴백과는 다르다

혼동하기 쉬운데 둘은 별개다.

| | 데모 모드 | 폴백 |
|---|---|---|
| 목적 | 로그인/관리자 **화면**을 env 없이 보기 | DB에 데이터가 없을 때 **콘텐츠**를 채우기 |
| 위치 | `lib/demo.ts` | `lib/content.ts` (`SONG_SETS_FALLBACK`, `GUESTBOOK_FALLBACK`) |
| 조건 | Supabase 미설정 + 쿠키/쿼리 | Supabase 미설정 **또는** 조회 결과 0행 |
| env 설정 후 | 완전히 비활성 | DB가 비어 있으면 여전히 쓰임 |

즉 실서비스에서도 `song_sets`가 비어 있으면 폴백 송리스트가 보인다.
빈 화면보다는 낫다는 판단이다.

---

## 6. 데모 종료

로그아웃 라우트가 미리보기 쿠키도 함께 지운다.

```ts
response.cookies.delete(DEMO_COOKIE);
```

실제 로그인과 데모가 섞이지 않게 하기 위한 것이다.
