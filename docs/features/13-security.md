# 13. 보안 모델

이 사이트가 다루는 민감 정보는 **참가자 명단(이름·생년월일·전화번호), 숙소 배정,
체크인 토큰**이다. 방어의 원칙은 하나다.

> **UI에서 감추는 것은 방어가 아니다. 데이터가 있는 곳에서 막는다.**

---

## 1. 계층

```
┌─ 브라우저 ─────────────────────────────────────┐
│  메뉴 숨김 · 버튼 비활성                          │  ← 편의. 우회 가능
├─ Next.js 서버 액션 / API ─────────────────────┤
│  getAdminContext() · getBoundParticipant()     │  ← 사용자 친화적 거부 메시지
├─ Postgres RLS ────────────────────────────────┤
│  auth.uid() 기반 행 단위 정책                    │  ← 진짜 방어선
└─ security definer 함수 ───────────────────────┘
   RLS로는 표현 못 하는 로직을 좁게 뚫음
```

아래 계층이 위 계층을 신뢰하지 않는다. 브라우저 콘솔에서 Supabase 클라이언트를
직접 호출해도 RLS를 넘지 못한다.

---

## 2. service_role 키를 쓰지 않는다

이 키는 **RLS를 통째로 우회**한다. 한 번이라도 서버 코드에 들이면
보안이 "그 코드가 실수하지 않는다"에 의존하게 된다.

그래서 아예 안 쓴다. 특권이 필요한 작업은 `security definer` 함수로 하나씩,
필요한 만큼만 뚫는다. 함수 안에서 권한을 다시 확인한다.

```sql
create or replace function public.admin_stats() ... security definer as $$
begin
  if not is_admin() then return null; end if;   -- ← 함수 안에서 재확인
  ...
```

`.env`에 들어가는 값은 전부 **공개 키**(`NEXT_PUBLIC_*`)와
Cloudinary 시크릿뿐이다. Cloudinary 시크릿만 진짜 비밀이다.

---

## 3. RLS 정책 전체

```sql
-- participants: 본인 행만. admin은 전체
participants_select_own   select using (auth_user_id = auth.uid() or is_admin())
participants_admin_all    all    using (is_admin())

-- rooms / teams: 로그인 사용자 조회, admin 관리
rooms_select   select to authenticated using (true)
rooms_admin    all using (is_admin())
teams_select   select to authenticated using (true)
teams_admin    all using (is_admin())

-- guestbook: 읽기 공개(숨김 제외), 작성은 승인된 참가자
guestbook_select       select using (not hidden or is_admin())
guestbook_insert       insert with check (participant_id = my_participant_id()
                                          and setting_on('guestbook_open'))
guestbook_delete       delete using (participant_id = my_participant_id() or is_admin())
guestbook_admin_update update using (is_admin())

-- photos: 오픈 시 로그인 조회, 업로드·삭제는 본인, 숨김은 admin
photos_select       select to authenticated
                      using ((setting_on('gallery_open') and not hidden) or is_admin())
photos_insert       insert with check (participant_id = my_participant_id()
                                       and setting_on('gallery_open'))
photos_delete       delete using (participant_id = my_participant_id() or is_admin())
photos_admin_update update using (is_admin())

-- site_settings: 공개 조회(배너용), 수정은 admin
settings_select     select using (true)
settings_admin_write all using (is_admin())

-- song_sets / songs: 읽기 공개, 쓰기 admin
```

### 재귀 회피

`participants` 정책 안에서 `participants`를 다시 읽으면 정책이 무한 재귀한다.
헬퍼를 `security definer`로 만들어 정책 평가를 우회시킨다.

```sql
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from participants
       where auth_user_id = auth.uid() and role='admin' and status='approved'); $$;
```

모든 함수에 `set search_path = public`을 붙였다. 검색 경로 조작으로
동명의 가짜 함수·테이블을 태우는 공격을 막는다.

### 승인 상태가 권한에 물려 있다

`my_participant_id()`는 **`status = 'approved'`인 경우에만** id를 돌려준다.
승인 전에는 null이 되어 방명록·사진 insert 정책이 전부 실패한다.
따로 검사 코드를 쓰지 않아도 "승인 전에는 아무것도 못 쓴다"가 보장된다.

---

## 4. security definer 함수 목록

| 함수 | 왜 필요한가 |
|---|---|
| `is_admin()` / `my_participant_id()` / `setting_on(k)` | RLS 정책 내부 헬퍼 (재귀 회피) |
| `lookup_participant` | 미연결 행은 RLS로 안 보임. **`stable`이라 쓰기 불가** |
| `bind_participant` | 위와 같음 + `for update` 잠금 |
| `get_my_summary` | 룸메이트 이름은 본인 RLS 범위 밖 |
| `admin_checkin_by_token` | 토큰만으로 참가자 조회 + 상태 전이를 한 곳에 |
| `admin_set_status` / `admin_approve_all` | 승인 처리 |
| `admin_join_requests` | `auth.users`는 PostgREST로 못 읽음 |
| `admin_stats` | 집계 |

`admin_*`은 전부 첫 줄이 `is_admin()` 확인이다. `grant execute ... to authenticated`가
되어 있어도 admin이 아니면 `forbidden`/`null`이 나온다.

---

## 5. 사칭 방지

가장 신경 쓴 부분 → 상세는 [02. 가입 승인](02-join-approval.md)

```
① 명단에 있어야 요청 가능      lookup 단계에서 not_found면 행을 만들지 않는다
② 신원당 1계정                for update 잠금 + auth_user_id is null 조건
③ 사람이 승인                 소셜 프로필(사진·닉네임·이메일)을 보고 판단
```

`lookup_participant`는 **존재 여부만** 돌려준다. 행 내용을 주지 않으므로
반복 조회해도 숙소·체크인 여부 같은 정보는 새지 않는다.

---

## 6. 애플리케이션 레벨 방어

| 대상 | 방어 |
|---|---|
| **오픈 리다이렉트** | `/auth/callback`의 `next`는 `/`로 시작해야만 허용 |
| **PostgREST 필터 인젝션** | 검색어에서 `,()\"` 제거 + 40자 절단 ([참가자 검색 API](../../src/app/api/admin/participants/route.ts)) |
| **CSV 수식 인젝션** | 내보내기 시 `=+-@`·탭으로 시작하는 셀 앞에 `'` ([export](../../src/app/api/admin/export/route.ts)) |
| **Cloudinary 업로드 남용** | unsigned preset 금지. 서명을 참가자별 `public_id`에 스코프 |
| **타인 사진 도용** | `savePhoto`가 `public_id` 접두사 검증 + DB unique 제약 |
| **QR 오탐** | 스캐너가 UUID 형식만 수락, 3초 중복 방지 |
| **로그아웃 CSRF** | GET 링크가 아니라 `<form method="post">` |
| **서비스 워커 캐시 유출** | `/my` `/gallery` `/admin` `/api` `/auth` `/bind` 캐시 금지 ([12](12-pwa.md)) |
| **XSS** | QR SVG만 `dangerouslySetInnerHTML` — 입력은 UUID, 출력은 라이브러리 생성 |
| **개인정보 노출 최소화** | `/api/session`은 불리언만. 승인 화면은 전화번호 마스킹 |

---

## 7. 개발용 우회 장치

관리자 화면을 로그인 없이 훑어보기 위한 플래그가 있다.

```ts
export function isAdminPreview() {
  return process.env.NODE_ENV !== "production"
      && process.env.ADMIN_DEV_PREVIEW === "1";
}
```

두 조건이 **AND**다. 프로덕션 빌드에서는 환경변수를 켜도 동작하지 않는다.
게다가 우회해도 RLS는 `auth.uid()` 기준이라 실데이터가 안 보이고 데모 데이터만 나온다.

→ [14. 데모 모드](14-demo-mode.md)

---

## 8. 검증 방법

### 비로그인 상태에서 명단이 안 보이는가

```bash
curl -s -I "$SUPABASE_URL/rest/v1/participants?select=id" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Range: 0-0"
```

`Content-Range: */0` — RLS가 0행으로 막고 있다.

### 명단에 없는 사람이 가입 요청을 만들 수 있는가

```sql
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select lookup_participant('없는사람', '1990-01-01', '01000000000');
-- {"status": "not_found"}
select bind_participant('없는사람', '1990-01-01', '01000000000');
-- {"status": "not_found"}   ← 행이 생기지 않는다
```

### 개인화 페이지가 캐시되지 않는가

```bash
curl -sI https://<도메인>/my | grep -i cache-control
# private, no-cache, no-store, max-age=0, must-revalidate
```

---

## 9. 운영 주의

- **DB 비밀번호**는 Supabase 대시보드 → Project Settings → Database에서
  재설정할 수 있다. 어딘가에 노출됐다면 즉시 교체할 것.
- **참가자 명단은 채팅·이슈에 붙여넣지 않는다.** 관리자 CSV 업로드로만 처리.
- **관리자 지정은 마이그레이션 파일이 아니라 DB에 직접** — 개인정보가 git에 남지 않게.
- **Cloudinary 시크릿**은 서버 전용 변수(`CLOUDINARY_API_SECRET`)로만 둔다.
  `NEXT_PUBLIC_` 접두사를 붙이면 번들에 박혀 공개된다.

---

## 10. 아직 안 한 것

- [ ] **개인정보처리방침 + 14세 미만 동의** — 참가 신청 폼과 사이트 양쪽에 필요
- [ ] 업로드 후 Cloudinary Admin API로 asset 실존 검증 (현재는 서명 스코프 + `public_id` 검증)
- [ ] 가입 요청 rate limit — 현재는 명단 매칭이 사실상 제한 역할
