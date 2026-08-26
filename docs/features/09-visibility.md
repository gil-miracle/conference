# 09. 노출 제어

준비가 덜 된 내용을 참가자에게 보이지 않게 하는 스위치들.
전부 `site_settings` 테이블 한 곳에 모여 있고, 관리자 **설정** 탭에서 토글한다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [lib/settings.ts](../../src/lib/settings.ts) | 설정 행 → 타입 있는 객체 (기본값 포함) |
| [admin/settings/page.tsx](../../src/app/admin/settings/page.tsx) | 설정 화면 |
| [admin/settings/MenuVisibilityCard.tsx](../../src/app/admin/settings/MenuVisibilityCard.tsx) | 메뉴 6개 토글 |
| [admin/settings/ToggleSettingCard.tsx](../../src/app/admin/settings/ToggleSettingCard.tsx) | 단일 on/off 토글 |
| [admin/settings/BannerSettingCard.tsx](../../src/app/admin/settings/BannerSettingCard.tsx) | 공지 배너 |
| [0006_visibility.sql](../../supabase/migrations/0006_visibility.sql) | `menu_visibility` · `rooms_open` |

---

## 1. site_settings 스키마

```sql
create table site_settings (
  key   text primary key,
  value jsonb not null
);
```

| key | value | 효과 |
|---|---|---|
| `banner` | `{"text": "...", "visible": true}` | 상단 공지 배너 |
| `menu_visibility` | `{"about": true, "speakers": true, ...}` | 메뉴 항목별 노출 |
| `rooms_open` | `{"value": false}` | 숙소·조 배정 공개 |
| `gallery_open` | `{"value": false}` | 갤러리 오픈 |
| `guestbook_open` | `{"value": true}` | 방명록 작성 허용 |

컬럼을 늘리지 않고 key-value + jsonb로 둔 이유는 **설정이 늘어날 때마다
마이그레이션을 쓰고 싶지 않아서**다. 대신 타입 안전성은 코드에서 잡는다:

```ts
// lib/settings.ts — 없는 설정은 기본값으로 채운다
menus: { ...DEFAULT_MENUS, ...rawMenus }
guestbookOpen: map.guestbook_open?.value !== false   // 기본 true
galleryOpen:   map.gallery_open?.value === true      // 기본 false
```

읽기는 공개(`settings_select ... using (true)`), 쓰기는 admin만.
배너를 비로그인 방문자에게도 보여야 하므로 읽기를 열어둔 것이다.

---

## 2. 메뉴 노출

6개 항목을 개별로 켜고 끈다: About / Speakers / Timetable / Songs / 방명록 / 갤러리.

끄면 세 곳에서 동시에 사라진다:

```
상단 내비 (NavLinks)     ← session.menus[key] 필터
하단 탭바 (BottomTabs)   ← session.menus[key] 필터
메인 페이지 섹션          ← {menus.about && <section>...}
```

라우트 정의와 토글 키가 한 파일에서 묶여 있어 어긋날 수 없다:

```ts
// components/nav/routes.ts
export const NAV_ROUTES = [
  { href: "/about", label: "About", short: "소개", key: "about" },
  ...
] as const satisfies readonly { href: string; label: string; short: string; key: MenuKey }[];
```

`satisfies`가 컴파일 타임에 `key`가 `MenuKey`인지 확인한다. 오타가 나면 빌드가 깨진다.

> **주소를 직접 입력하면 열린다.** 이건 의도한 동작이다 —
> 운영진이 준비 중인 페이지를 미리 확인할 수 있어야 하고, 메뉴 숨김은
> 보안 기능이 아니라 "아직 완성 안 됐으니 안내하지 말자"는 뜻이다.
> 진짜 감춰야 하는 데이터(숙소·개인정보)는 DB 단계에서 막는다.

---

## 3. 숙소·조 공개 (`rooms_open`)

이건 UI 필터가 아니라 **DB 함수 안에서 막는다.**

```sql
-- 0006_visibility.sql, get_my_summary()
select coalesce((value ->> 'value')::boolean, false) into v_rooms_open
from site_settings where key = 'rooms_open';

if v_rooms_open and v.room_id is not null then
  -- 숙소·룸메이트 조회
end if;
if v_rooms_open and v.team_id is not null then
  -- 조 조회
end if;
```

꺼져 있으면 서버가 애초에 값을 안 내려주므로, 브라우저를 조작해도 나오지 않는다.

배정 작업 중에 참가자가 반쯤 채워진 방 배정을 보고 문의하는 상황을 막는 게 목적이다.
배정이 끝나면 켜고, 그때 [RoomCard](../../src/components/my/RoomCard.tsx)와
[TeamCard](../../src/components/my/TeamCard.tsx)가 함께 나타난다.

기본값은 `false` — 켜는 걸 잊어도 잘못된 정보가 나가지는 않는다.

---

## 4. 갤러리 / 방명록 토글

둘 다 **RLS 정책 안에서** 확인한다. UI만 막는 게 아니다.

```sql
create or replace function public.setting_on(k text)
returns boolean language sql stable security definer as $$
  select coalesce((value ->> 'value')::boolean, false)
  from site_settings where key = k;
$$;

create policy "photos_insert" on photos for insert to authenticated
  with check (participant_id = my_participant_id() and setting_on('gallery_open'));
```

갤러리는 추가로 **조회**까지 막는다 — 행사 전에 미리 올려둔 사진이 새면 안 되니까.

```sql
create policy "photos_select" on photos for select to authenticated
  using ((setting_on('gallery_open') and not hidden) or is_admin());
```

갤러리 업로드 서명 발급도 서버 액션에서 한 번 더 확인한다
(→ [07. 갤러리](07-gallery.md) §2). 정책이 이미 막지만, 사용자에게
"갤러리가 아직 열리지 않았어요"라는 이유를 알려주기 위해서다.

---

## 5. 공지 배너

`{text, visible}`. 텍스트가 비어 있으면 `visible`이 켜져 있어도 안 뜬다.

```ts
banner: {
  text: map.banner?.text ?? "",
  visible: map.banner?.visible === true && Boolean(map.banner?.text),
}
```

빈 배너가 레이아웃만 밀어내는 사고를 막는다.

배너는 `SessionProvider`를 통해 클라이언트로 온다 — 레이아웃이 서버에서
설정을 읽으면 전 페이지가 동적이 되기 때문이다 (→ [11. 렌더링](11-rendering.md)).

---

## 6. 반영 경로

```
관리자가 토글 클릭
   ↓
saveSetting(key, value)  — upsert on conflict (key)
   ↓
revalidatePath("/admin/settings") + revalidatePath("/")
   ↓
router.refresh()          — 관리자 화면 즉시 갱신
   ↓
참가자 쪽: SessionProvider 의 SWR 이 /api/session 재조회
           (dedupingInterval 30초, 포커스 재검증은 끔)
```

즉 참가자 화면에는 **최대 30초 안에** 반영된다.
새로고침하면 바로 보인다. 실시간이 필요한 종류의 설정이 아니라 이 정도로 충분하다.
