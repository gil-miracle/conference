# 06. 방명록

`/guestbook` — **읽기는 누구나, 쓰기는 승인된 참가자만.**
메인 페이지에는 최근 3개가 요약으로 뜬다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [(site)/guestbook/page.tsx](../../src/app/%28site%29/guestbook/page.tsx) | 목록 (ISR 30초) |
| [guestbook/GuestbookForm.tsx](../../src/components/guestbook/GuestbookForm.tsx) | 작성 폼 |
| [guestbook/GuestbookWriteCta.tsx](../../src/components/guestbook/GuestbookWriteCta.tsx) | 상태별 작성 유도 |
| [guestbook/GuestbookDelete.tsx](../../src/components/guestbook/GuestbookDelete.tsx) | 본인 글 삭제 |
| [actions/guestbook.ts](../../src/app/actions/guestbook.ts) | 작성 · 삭제 서버 액션 |
| [admin/board/](../../src/app/admin/board/) | 모더레이션 |

---

## 1. 권한

```
읽기   비로그인 포함 전체 (hidden = false 인 글만)
작성   로그인 + 명단 연결 + 승인 완료 + guestbook_open 켜짐
삭제   본인 또는 admin
숨김   admin
```

RLS 정책이 이걸 그대로 표현한다:

```sql
create policy "guestbook_select" on guestbook
  for select using (not hidden or is_admin());

create policy "guestbook_insert" on guestbook
  for insert to authenticated
  with check (participant_id = my_participant_id() and setting_on('guestbook_open'));

create policy "guestbook_delete" on guestbook
  for delete to authenticated
  using (participant_id = my_participant_id() or is_admin());
```

`my_participant_id()`는 **승인된 참가자에게만** id를 돌려준다
(→ [02. 가입 승인](02-join-approval.md) §3). 그래서 승인 전에는
`participant_id = null`이 되어 insert 정책이 통과하지 못한다.

작성 토글(`guestbook_open`)도 **정책 안에서** 확인한다. UI에서 버튼을 감추는 것과
별개로, API를 직접 때려도 막힌다.

---

## 2. 작성

서버 액션 `addGuestbookEntry`가 `useActionState`와 함께 쓰인다.

```
getBoundParticipant()  ← 세션 + 명단 연결 확인 (없으면 안내 메시지)
   ↓
displayName 1–20자 / content 1–500자 검증
   ↓
insert { participant_id, display_name, content }
   ↓
revalidatePath("/")   ← 메인의 최근 3개도 갱신
```

길이 제한은 **DB에도 걸려 있다.** 서버 액션은 사용자 친화적 메시지를 위한 것이고,
실제 방어선은 컬럼 제약이다:

```sql
display_name text not null check (char_length(display_name) between 1 and 20),
content      text not null check (char_length(content) between 1 and 500),
```

`display_name`은 실명이 아니어도 된다 — 닉네임을 직접 적는다.
`participant_id`는 서버가 세션에서 채우므로 클라이언트가 남의 이름으로 쓸 수 없다.

### 상태별 작성 유도

`GuestbookWriteCta`가 사용자 상태에 맞는 다음 행동을 보여준다.
비로그인이면 로그인 시트를, 미연결이면 `/bind`를, 승인 대기면 대기 안내를 띄운다.

---

## 3. 삭제 vs 숨김

두 가지를 구분해 뒀다.

| | 누가 | 무엇을 하나 | 되돌리기 |
|---|---|---|---|
| **삭제** | 본인 · admin | 행 자체를 지운다 | 불가 |
| **숨김** | admin | `hidden = true` | 가능 (다시 표시) |

운영진이 부적절한 글을 처리할 때 **먼저 숨기고 나중에 판단**할 수 있게 한 것이다.
잘못 숨겼으면 되돌리면 되고, 작성자와 대화가 필요한 경우 내용이 남아 있다.

관리자 게시판 탭은 숨김 글도 함께 보여준다 (`not hidden or is_admin()` 정책 덕분).

### 삭제 버튼은 내 글에만 뜬다

소유자 판정에 `/api/session`의 `participantId`를 쓴다.

```tsx
if (!ownerId || !session.participantId || session.participantId !== ownerId)
  return null;
```

그리고 **RLS에 막히면 오류가 아니라 0행 삭제로 조용히 끝나므로**, 액션이
삭제된 행 수를 확인해 실패를 돌려준다. 안 그러면 "지웠는데 왜 남아 있지"가 된다.

```ts
const { data, error } = await supabase.from("guestbook").delete().eq("id", id).select("id");
if (error || !data || data.length === 0) return { ok: false };
```

---

## 4. 폴백

Supabase 미설정이면 [content.ts](../../src/lib/content.ts)의 `GUESTBOOK_FALLBACK`이
보인다. 목업 단계에서 레이아웃을 확인하기 위한 것이고, env가 붙으면 실데이터만 나온다.

---

## 5. 캐시

`/guestbook`은 **ISR 30초**다. 방명록은 실시간성이 크게 중요하지 않고,
정적 렌더로 두어야 prefetch가 동작해 메뉴 이동이 즉각적이다
(→ [11. 렌더링](11-rendering.md)).

글을 쓰면 `revalidatePath("/")`로 메인이 즉시 갱신되고,
`/guestbook` 자체는 다음 요청 때 30초 창이 만료되며 새로 그려진다.
