# 04. 체크인

행사 당일 데스크에서 쓰는 기능. **QR 스캔이 기본이고 이름 검색 수동 체크인이 백업**이다.
소셜 계정이 없거나 QR을 못 여는 참가자가 반드시 나오기 때문에 둘 다 필요하다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [admin/checkin/CheckinPanel.tsx](../../src/app/admin/checkin/CheckinPanel.tsx) | 검색 · 명단 · 액션 |
| [admin/checkin/QrScanner.tsx](../../src/app/admin/checkin/QrScanner.tsx) | 카메라 스캐너 |
| [admin/checkin/ParticipantRow.tsx](../../src/app/admin/checkin/ParticipantRow.tsx) | 명단 한 줄 |
| [admin/actions/checkin.ts](../../src/app/admin/actions/checkin.ts) | 서버 액션 3종 |
| [api/admin/participants/route.ts](../../src/app/api/admin/participants/route.ts) | 명단 검색 API |

---

## 1. QR 스캔

```
관리자가 [QR 스캔] 클릭
   │
   ▼
html5-qrcode 를 동적 import → 후면 카메라 시작 (fps 8, qrbox 230)
   │
   ▼
프레임에서 텍스트 검출
   │
   ├─ UUID 형식이 아니면 무시           ← 다른 QR(명함·와이파이)을 걸러낸다
   ├─ 직전 3초 내 같은 토큰이면 무시     ← 카메라에 계속 잡혀 중복 호출되는 것 방지
   ├─ 처리 중(busyRef)이면 무시
   │
   ▼
checkinByToken(token) 서버 액션 → admin_checkin_by_token RPC
   │
   ├─ ok         → "✓ 박다윗 체크인 완료 — 비전관 203"
   ├─ already    → "박다윗 이미 체크인됨"
   ├─ not_approved → 승인 전 참가자
   ├─ not_found  → "등록되지 않은 QR"
   └─ forbidden  → admin 세션 아님
   │
   ▼
스캐너는 닫지 않는다 — 다음 사람을 바로 비추면 된다 (연속 스캔)
```

### 카메라 수명 관리

카메라는 놓아주지 않으면 다른 앱이 못 쓴다. 세 가지를 신경 썼다:

- **언마운트 시 `stop()` → `clear()`** — cleanup에서 반드시 반납
- **시작 대기 중 언마운트** — `await start()`가 끝난 뒤 `cancelled`를 다시 확인하고,
  이미 닫혔으면 즉시 teardown (안 하면 스트림이 붙잡힌 채 남는다)
- **`onResult`를 ref로 유지** — 부모가 리렌더될 때마다 effect가 재실행되어
  카메라가 껐다 켜지는 것을 막는다

```tsx
const onResultRef = useRef(onResult);
onResultRef.current = onResult;   // effect 의존성에서 제외
```

카메라 권한이 거부되면 "이름 검색으로 체크인하세요"로 안내한다 — 막다른 길을 만들지 않는다.

---

## 2. 수동 체크인

상단 검색창에 이름이나 전화번호 뒷자리를 넣으면 명단이 필터된다.
SWR이 5초마다 갱신하므로 여러 데스크에서 동시에 처리해도 서로의 결과가 곧 보인다.

```ts
useSWR(`/api/admin/participants?q=${q}`, jsonFetcher, {
  refreshInterval: 5000,
  keepPreviousData: true,   // 검색어 바꿀 때 목록이 깜빡이지 않게
});
```

체크인 **취소**도 같은 버튼으로 한다(확인 다이얼로그 있음). 잘못 스캔한 경우를 위해서다.

### 검색어 인젝션 차단

PostgREST의 `or()` 필터는 문자열을 그대로 해석하므로, 사용자 입력에
`,` `(` `)` `"` `\`가 섞이면 필터 구조를 바꿀 수 있다. 제거 후 길이도 자른다.

```ts
const safe = q.replace(/[,()\\"]/g, "").slice(0, 40);
if (safe) query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
```

---

## 3. `admin_checkin_by_token` RPC

```sql
if not is_admin() then return 'forbidden'; end if;
select * into v from participants where checkin_token = p_token;
if not found        then return 'not_found';    end if;
if v.status <> 'approved' then return 'not_approved'; end if;
if v.checked_in_at is not null then return 'already' (+ 시각·숙소); end if;
update participants set checked_in_at = now() where id = v.id;
return 'ok' (+ 이름·숙소);
```

`security definer`인 이유는 **토큰만으로 참가자를 찾아야 하기 때문**이다.
관리자 RLS로도 가능하지만, 권한 검사(`is_admin()`)와 상태 전이를 한 함수 안에 묶어두면
호출부가 어디든 규칙이 같다.

`already`일 때 이름과 시각을 함께 돌려주는 게 실무적으로 중요하다 —
데스크에서 "아까 하셨어요, 16:32에"라고 바로 말할 수 있다.

---

## 4. 계정 연결 해제

명단 연결이 잘못됐을 때(동명이인 오입력, 가족이 대신 로그인 등) 쓰는 복구 수단.

```ts
unbindParticipant(id)
  → participants: auth_user_id = null, bound_at = null, bound_provider = null
```

행 자체는 남으므로 **숙소·조·체크인 기록이 보존**되고, 본인이 다시 로그인해
`/bind`로 재연결하면 된다. 잘못 붙은 소셜 계정은 다시 `/bind`를 만나게 된다.

---

## 5. 대시보드와의 연결

체크인 액션은 모두 `revalidatePath("/admin")`을 호출한다.
대시보드는 SWR 5초 폴링이라 어차피 곧 갱신되지만, 탭을 옮겼을 때 즉시 최신이 보인다.

대시보드가 보여주는 것 → [08. 관리자 화면](08-admin.md)

- 총원 / 체크인 / 승인 대기
- 최근 체크인 8명
- **미도착자 명단**(승인됐지만 아직 체크인 안 한 사람, 전화번호 포함) — 연락용
