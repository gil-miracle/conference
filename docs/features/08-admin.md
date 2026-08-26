# 08. 관리자 화면

`/admin/*` — 운영진 전용. 탭 7개.

| 탭 | 경로 | 내용 |
|---|---|---|
| 대시보드 | `/admin` | 실시간 체크인 현황 · 미도착자 |
| 승인 | `/admin/approvals` | 가입 요청 승인·반려 → [02](02-join-approval.md) |
| 체크인 | `/admin/checkin` | QR 스캔 · 수동 체크인 → [04](04-checkin.md) |
| 숙소 | `/admin/rooms` | 방·조 생성 및 배정 |
| 찬양 | `/admin/songs` | 송리스트 편집 → [05](05-songs.md) |
| 게시판 | `/admin/board` | 방명록·사진 모더레이션 |
| 설정 | `/admin/settings` | 배너 · 노출 토글 · 명단 CSV → [09](09-visibility.md) |

---

## 1. 접근 통제 — 2단 구조

**화면 진입**과 **데이터 변경**을 다른 함수로 검사한다.

```ts
requireAdmin()      // 페이지/레이아웃용. 데모 모드를 허용한다
getAdminContext()   // 서버 액션·API용. 실제 admin 세션만. 아니면 null
```

이유: 목업 단계에서 관리자 화면을 **보여줄 수는 있어야 하지만**,
그 화면에서 누른 버튼이 실제 DB를 건드리면 안 된다.

```
/admin 접속
   │
   ├─ isAdminPreview() 또는 Supabase 미설정
   │     → { demo: true } — 데모 데이터로 렌더, 모든 변경은 무시
   │
   └─ 실제 세션
         → getAdminContext()
              participants 에서 auth_user_id 매칭 + role='admin' + status='approved'
              아니면 redirect("/")
```

화면 쪽에서는 이 값이 **컨텍스트로 내려간다.** 관리자 컨트롤 대부분이
"데모면 비활성"이라 `demo` prop이 컴포넌트 8곳을 타고 흘렀는데,
화면 전체에 걸린 하나의 상태이므로 [AdminMode](../../src/app/admin/AdminMode.tsx)가 맞다.

```tsx
// layout.tsx
<AdminModeProvider demo={ctx.demo}> … </AdminModeProvider>

// 아무 클라이언트 컴포넌트에서
const demo = useAdminDemo();
```

`isAdminPreview()`는 **프로덕션에서 무조건 꺼진다.**

```ts
process.env.NODE_ENV !== "production" && process.env.ADMIN_DEV_PREVIEW === "1"
```

모든 서버 액션의 첫 줄이 `getAdminContext()`이고 null이면 즉시 반환한다.
화면이 데모여도 **변경 경로는 언제나 실세션을 재확인한다.**

### 버튼 하나의 공통 모양

관리자 버튼은 거의 전부 "액션 호출 → `router.refresh()` → 그동안 disabled"였다.
그 보일러플레이트는 [`useServerAction`](../../src/hooks/useServerAction.ts) 하나로 모았다.

```tsx
const { pending, run } = useServerAction();

<button disabled={pending}
        onClick={() => run(() => deleteRoom(id), { confirm: "삭제할까요?" })} />
```

DB 쪽 방어선은 별도다 → [13. 보안 모델](13-security.md)

---

## 2. 대시보드

SWR 5초 폴링. `admin_stats()` RPC 한 번으로 필요한 걸 다 받는다.

```
┌────────┬────────┬────────┬────────┐
│  120   │   87   │   3    │ 28/30  │
│  총원   │ 체크인  │ 승인대기 │  숙소   │
└────────┴────────┴────────┴────────┘

최근 체크인            미도착 (33명)
박다윗   2분 전         강바울   010-8888-9012   —
정사무엘 3분 전         이요셉   010-2222-1234   비전관 203
...                    ...
```

**미도착자 명단에 전화번호가 들어간다.** 행사 당일 "아직 안 온 사람에게 연락"이
가장 자주 하는 일이라, 화면에서 바로 걸 수 있게 했다(최대 60명).

통계는 전부 **승인된 참가자 기준**이다 — 대기·반려 건이 총원에 섞이면 숫자가 왜곡된다.

```sql
select count(*), count(checked_in_at) into v_total, v_in
  from participants where status = 'approved';
select count(*) into v_pending from participants where status = 'pending';
```

> Realtime이 아니라 폴링인 이유: 데스크 몇 대가 5초 간격으로 도는 건 비용이 없고,
> Realtime은 연결 관리·재접속 처리가 붙는다. 규모가 커지면 교체하면 된다.

---

## 3. 숙소 · 조

두 패널이 같은 구조다. 방/조를 만들고, 참가자를 드롭다운으로 배정한다.

```
RoomsPanel                        TeamsPanel
├─ 방 추가 (건물·호실·정원)          ├─ 조 추가 (이름·조장)
├─ 방별 인원 목록                   ├─ 조별 인원 목록
└─ AssignSelect 로 개별 배정        ├─ AssignSelect 로 개별 배정
                                  └─ [자동 배정] 버튼
```

### 자동 배정

미배정 인원을 **인원수가 적은 조부터** 채운다.

```
① 조별 현재 인원(load) 집계
② 미배정 인원을 하나씩 꺼내 load가 가장 적은 조에 넣고 load += 1
③ 조별로 모아 in(...) 으로 한 번씩만 UPDATE
```

한 명씩 UPDATE하면 100명이면 쿼리 100번이다. 버킷에 모아 **조 개수만큼만** 날린다.

`rooms_open` 토글이 꺼져 있으면 배정 결과가 참가자에게 안 보이므로,
작업 중에도 마음 놓고 만질 수 있다 → [09. 노출 제어](09-visibility.md)

---

## 4. 게시판 모더레이션

방명록(최근 200) + 사진(최근 60)을 한 화면에서 처리한다.

- 방명록: **숨김 토글**(되돌릴 수 있음) / **삭제**(영구)
- 사진: **숨김 토글**

숨김 처리 시 `revalidatePath("/admin/board")` + `revalidatePath("/")`로
참가자 화면에서 즉시 사라진다.

---

## 5. 명단 CSV

### 업로드

형식은 `이름,생년월일,전화번호`. 파일 업로드와 직접 붙여넣기 둘 다 된다.

[parseParticipantsCsv](../../src/lib/csv.ts)가 관대하게 받는다:

- 구분자 `,` 와 탭 모두 허용 (엑셀에서 복사하면 탭이다)
- 생년월일 `19940101` / `1994-01-01` / `1994.01.01` 모두 인식
- 헤더 행(`이름` / `name`) 자동 무시
- 큰따옴표 감싸기 제거
- 형식이 깨진 행은 세어서 `N행 건너뜀`으로 알려준다 — **조용히 버리지 않는다**

저장 전에 미리보기를 보여준다: `120명 인식 · 2행 건너뜀 — 김예찬, 이요셉, 박다윗 …`

업서트 키는 `(이름, 생년월일, 전화번호)`다. 같은 조합은 갱신, 새 조합은 추가되므로
**여러 번 올려도 안전**하고 기존 체크인·연결 정보가 보존된다.
200행씩 잘라 보낸다(요청 크기 제한 회피).

### 다운로드

`/api/admin/export` — UTF-8 BOM을 붙여 엑셀에서 한글이 깨지지 않는다.

**CSV 수식 인젝션을 막는다.** 셀이 `=` `+` `-` `@` 탭으로 시작하면 엑셀이 수식으로
해석하므로, 앞에 `'`를 붙여 무력화한다.

```ts
if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
```

---

## 6. 관리자 지정

명단에 이미 있는 사람을 승격시킨다. SQL Editor에서:

```sql
update participants set role = 'admin'
where name = '홍길동' and birth_date = '1990-01-01';
```

개인정보이므로 **마이그레이션 파일에 넣지 않는다** — git에 커밋되면 지우기 어렵다.
`supabase db query`나 대시보드로 DB에만 직접 넣는다.

해당 참가자가 소셜 로그인 + 명단 연결 + 승인을 마치면 `/admin`에 들어갈 수 있고,
상단 내비에 코랄색 `Admin` 링크가 나타난다.
