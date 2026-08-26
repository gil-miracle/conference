# 02. 가입 승인 — 명단 연결

소셜 로그인은 "이 브라우저가 어떤 카카오 계정인가"까지만 알려준다.
그 계정이 **참가 신청한 누구인지**는 별도로 확인해야 한다. 그 절차가 이 문서다.

핵심 우려는 **사칭**이다. 이름과 생년월일은 지인끼리 대체로 아는 정보라,
입력만으로 남의 숙소·조·체크인 QR을 열 수 있으면 안 된다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [bind/page.tsx](../../src/app/bind/page.tsx) | 연결 페이지 (로그인 필수) |
| [bind/BindForm.tsx](../../src/app/bind/BindForm.tsx) | 2단계 폼 UI |
| [bind/actions.ts](../../src/app/bind/actions.ts) | `lookupAction` / `requestAction` |
| [0004_join_lookup.sql](../../supabase/migrations/0004_join_lookup.sql) | `lookup_participant` / `bind_participant` RPC |
| [0003_approval.sql](../../supabase/migrations/0003_approval.sql) | `status` 컬럼 · 승인 RPC · 승인 대기 목록 |
| [admin/approvals/](../../src/app/admin/approvals/) | 관리자 승인 화면 |

---

## 1. 3중 방어

```
① 명단에 있어야 한다      ← 관리자가 올린 CSV에 이름+생년월일+전화번호가 있어야 요청 자체가 안 됨
② 선점은 1회뿐            ← 이미 연결된 신원은 taken. 두 번째 사람은 못 붙음
③ 관리자가 승인해야 한다   ← pending 상태에서는 숙소·조·QR이 내려오지 않음
```

①만 있으면 명단을 아는 사람이 사칭할 수 있고, ①+②만 있으면 **먼저 온 사칭자가 이긴다.**
③이 있어야 사람이 눈으로 걸러낼 수 있다.

---

## 2. 사용자 흐름

```
로그인 완료
   │
   ├─ get_my_summary() 가 null  ────────────▶  /bind 로 이동
   │
   ▼
[1단계] 이름 · 생년월일 8자리 · 전화번호 입력
   │      └─ lookupAction → lookup_participant RPC  (조회만, 아무것도 저장 안 함)
   │
   ├─ not_found          → "신청 이력을 찾지 못했어요" + 참가 신청 링크   ← 여기서 끝
   ├─ taken              → "이미 연결된 참가자예요. 운영진에 문의"        ← 여기서 끝
   ├─ already_requested  → /my 로 리다이렉트
   └─ found              → [2단계]로
                              │
                              ▼
[2단계] "OOO 님 — 신청 명단에서 확인했어요. 본인이 맞다면 요청을 보내주세요"
   │      └─ requestAction → bind_participant RPC
   │
   ▼
status = pending  →  /my 는 "승인 대기" 카드만 표시
   │
   ▼
관리자가 /admin/approvals 에서 승인
   │
   ▼
status = approved  →  숙소 · 조 · 체크인 QR 공개
```

### 왜 조회와 요청을 나눴나

한 번에 처리하면 **명단에 없는 사람도 요청 행이 생긴다.** 그러면 관리자 승인 큐가
무단 가입 시도로 오염되고, 운영진이 "이 사람 누구지"를 매번 판단해야 한다.

조회를 분리하면 명단에 없는 사람은 **DB에 아무 흔적도 남기지 않고** 돌아간다.
동시에 사용자에게는 "본인이 맞는지" 한 번 더 확인시키는 화면이 생겨,
실수로 남의 정보를 넣는 것도 줄어든다.

2단계 화면 하단의 문구가 그 역할을 한다:

> 내 정보가 아니라면 보내지 마세요. 잘못 연결되면 본인이 가입할 수 없게 됩니다.

---

## 3. DB 함수

둘 다 `security definer`다. **RLS상 미연결 참가자 행은 아무에게도 안 보이기 때문에**
일반 쿼리로는 명단 조회 자체가 불가능하다.

### `lookup_participant(p_name, p_birth, p_phone)` — 조회 전용

`stable`로 선언해 쓰기가 원천 차단된다.

| 반환 status | 의미 |
|---|---|
| `found` | 명단에 있고 아직 미연결 → 요청 가능 |
| `taken` | 일치하는 신원이 이미 다른 계정에 연결됨 |
| `not_found` | 신청 이력 없음 |
| `already_requested` | 이 소셜 계정이 이미 요청·승인됨 (`state`에 현재 상태) |
| `invalid` | 입력값 부족 (이름 빈값 / 전화 10자리 미만) |
| `unauthenticated` | `auth.uid()`가 null |

**행 내용을 돌려주지 않는다.** 존재 여부만 알려주므로, 조회를 반복해도
명단의 다른 정보(숙소·조·체크인 여부)는 새어나가지 않는다.

### `bind_participant(p_name, p_birth, p_phone)` — 요청

```sql
select * from participants
where name = v_name
  and birth_date = p_birth
  and regexp_replace(phone, '\D', '', 'g') = v_digits
  and auth_user_id is null
limit 1
for update;          -- ← 동시 요청 시 선점 경쟁 방지
```

- `for update`로 행을 잠근다. 두 사람이 같은 신원으로 동시에 요청해도 하나만 통과한다.
- 매칭되면 `auth_user_id` · `bound_at` · `bound_provider` · `requested_at`을 채우고
  `status`를 `pending`으로 둔다(이미 `approved`면 유지).
- **못 찾으면 행을 만들지 않는다** — `taken` 또는 `not_found`를 돌려주고 끝.

전화번호는 입력 형태와 무관하게 비교한다(숫자만 추출해 대조), 저장할 때만
`010-1234-5678` 형태로 정규화한다. 엑셀에서 온 명단은 하이픈 유무가 제각각이다.

### 승인 상태와 권한의 연결

`status`는 단순 표시용이 아니다. **RLS 헬퍼가 승인 여부를 본다.**

```sql
-- 0003_approval.sql
create or replace function public.my_participant_id() ... as $$
  select id from participants
  where auth_user_id = auth.uid() and status = 'approved';   -- ← approved만
$$;

create or replace function public.is_admin() ... as $$
  select exists (select 1 from participants
    where auth_user_id = auth.uid() and role = 'admin' and status = 'approved');
$$;
```

`my_participant_id()`가 null이면 방명록 작성·사진 업로드 정책이 전부 막힌다.
즉 **승인 전에는 아무것도 쓸 수 없다.**

`get_my_summary()`도 승인 전에는 상태만 내려주고 `checkin_token`·숙소·조를 null로 만든다.
서버에서 잘라내므로 클라이언트를 조작해도 나오지 않는다.

---

## 4. 관리자 승인 화면

`/admin/approvals` — 사칭 판별에 필요한 근거를 한 카드에 모았다.

```
┌─────────────────────────────────────────────┐
│ [프로필사진] 이요셉                [명단 일치] │
│             1992-03-02 · 010-****-1234      │
├─────────────────────────────────────────────┤
│ 소셜 이름   요셉                              │
│ 로그인      kakao                            │
│ 이메일      ...                              │
│ 요청 시각   8/26 14:20                        │
├─────────────────────────────────────────────┤
│              [ 승인 ]  [ 반려 ]               │
└─────────────────────────────────────────────┘
```

- **소셜 프로필** (닉네임·사진·이메일) — 운영진이 아는 얼굴인지 눈으로 확인
- **명단 일치 배지** — `created_at < requested_at`이면 관리자가 미리 올린 명단 행
- **전화번호 마스킹** — 화면에 전체를 띄우지 않는다

데이터는 `admin_join_requests(p_status)` RPC가 만든다.
`auth.users`는 PostgREST로 직접 못 읽으므로 `security definer`로 조인한다.

명단 CSV를 통째로 올린 직후처럼 대기 건이 많을 때는 **일괄 승인**(`admin_approve_all`)을 쓴다.

승인/반려 후 `revalidatePath("/admin/approvals")` + `revalidatePath("/admin")`으로
목록과 대시보드 카운트를 함께 갱신한다.

---

## 5. 반려

`admin_set_status(id, 'rejected', reason)`. 참가자 My 화면에는
[MyPendingCard](../../src/components/my/MyPendingCard.tsx)가 사유와 함께
"착오라고 생각되시면 운영진에 문의해주세요"를 띄운다.

반려해도 행은 남는다 — 같은 사람이 다시 시도하면 `already_requested`로 걸리므로,
정말 다시 열어주려면 관리자가 `pending`이나 `approved`로 되돌리거나
체크인 탭에서 연결을 해제한다.

---

## 6. 검증 방법

실제로 막히는지 확인하려면 JWT 클레임을 흉내내 RPC를 직접 호출한다.

```sql
-- 임의 유저인 척하고 조회
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);

select lookup_participant('없는사람', '1990-01-01', '01000000000');
-- → {"status": "not_found"}
```

비로그인 상태에서 명단이 안 보이는지도 확인해둘 것:

```bash
curl -s -I "$SUPABASE_URL/rest/v1/participants?select=id" \
  -H "apikey: $PUBLISHABLE_KEY" -H "Range: 0-0"
```

`Content-Range: */0` — RLS가 0행으로 막고 있다는 뜻이다.
