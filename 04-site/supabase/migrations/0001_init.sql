-- ════════════════════════════════════════════════════════════════
-- MIRACLE 2026 — 초기 스키마 + RLS + RPC
-- 실행: Supabase 대시보드 SQL Editor에 붙여넣기 (또는 supabase db push)
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── 테이블 ──────────────────────────────────────────────────────

-- 숙소
create table rooms (
  id uuid primary key default gen_random_uuid(),
  building text not null,
  room_no text not null,
  capacity int not null default 4,
  note text,
  unique (building, room_no)
);

-- 조 (게임 조, 옵션)
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text,
  leader text,
  note text
);

-- 참가자 (사전 업로드 명단)
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  phone text not null,                        -- 010-xxxx-xxxx, 동명이인 구분용
  auth_user_id uuid unique references auth.users(id) on delete set null,
  bound_at timestamptz,                       -- 바인딩 시각 (분쟁 확인용)
  bound_provider text,                        -- kakao | google
  role text not null default 'member' check (role in ('member', 'admin')),
  checked_in_at timestamptz,
  checkin_token uuid not null unique default gen_random_uuid(),  -- QR용
  room_id uuid references rooms(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (name, birth_date, phone)
);

-- 방명록
create table guestbook (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 20),
  content text not null check (char_length(content) between 1 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- 갤러리 사진 (파일은 Cloudinary, 메타데이터만 저장)
create table photos (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  -- unique: 숨김 처리된 사진을 같은 public_id로 재등록해 되살리는 것 차단
  cloudinary_public_id text not null unique,
  width int,
  height int,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- 사이트 설정 (공지 배너, 갤러리 오픈 등)
create table site_settings (
  key text primary key,
  value jsonb not null
);

insert into site_settings (key, value) values
  ('banner',         '{"text": "", "visible": false}'),
  ('gallery_open',   '{"value": false}'),
  ('guestbook_open', '{"value": true}');

-- ── 헬퍼 함수 (RLS 내부용) ──────────────────────────────────────
-- security definer: participants 정책 안에서 participants를 다시 읽는
-- 재귀를 피하고, 미로그인/타인 row 접근 없이 판별만 한다.

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from participants
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_participant_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from participants where auth_user_id = auth.uid();
$$;

create or replace function public.setting_on(k text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((value ->> 'value')::boolean, false)
  from site_settings where key = k;
$$;

-- ── RLS ─────────────────────────────────────────────────────────

alter table participants  enable row level security;
alter table rooms         enable row level security;
alter table teams         enable row level security;
alter table guestbook     enable row level security;
alter table photos        enable row level security;
alter table site_settings enable row level security;

-- participants: 본인 row만 조회, admin은 전체 관리
create policy "participants_select_own" on participants
  for select using (auth_user_id = auth.uid() or is_admin());
create policy "participants_admin_all" on participants
  for all using (is_admin()) with check (is_admin());

-- rooms / teams: 로그인 사용자 조회, admin 관리
create policy "rooms_select" on rooms
  for select to authenticated using (true);
create policy "rooms_admin" on rooms
  for all using (is_admin()) with check (is_admin());
create policy "teams_select" on teams
  for select to authenticated using (true);
create policy "teams_admin" on teams
  for all using (is_admin()) with check (is_admin());

-- guestbook: 읽기 공개(숨김 제외), 작성은 바인딩된 참가자
create policy "guestbook_select" on guestbook
  for select using (not hidden or is_admin());
create policy "guestbook_insert" on guestbook
  for insert to authenticated
  with check (participant_id = my_participant_id() and setting_on('guestbook_open'));
create policy "guestbook_delete" on guestbook
  for delete to authenticated
  using (participant_id = my_participant_id() or is_admin());
create policy "guestbook_admin_update" on guestbook
  for update using (is_admin()) with check (is_admin());

-- photos: 갤러리 오픈 시 로그인 조회, 업로드 본인, 숨김 admin, 삭제 본인+admin
create policy "photos_select" on photos
  for select to authenticated
  using ((setting_on('gallery_open') and not hidden) or is_admin());
create policy "photos_insert" on photos
  for insert to authenticated
  with check (participant_id = my_participant_id() and setting_on('gallery_open'));
create policy "photos_delete" on photos
  for delete to authenticated
  using (participant_id = my_participant_id() or is_admin());
create policy "photos_admin_update" on photos
  for update using (is_admin()) with check (is_admin());

-- site_settings: 공개 조회(배너 노출용), 수정은 admin
create policy "settings_select" on site_settings
  for select using (true);
create policy "settings_admin_write" on site_settings
  for all using (is_admin()) with check (is_admin());

-- ── RPC: 소셜 계정 ↔ 신청 명단 바인딩 ───────────────────────────
-- 미바인딩 row는 RLS로 보이지 않으므로 security definer 함수로 처리.
-- 반환 status:
--   ok             바인딩 완료
--   already_bound_self  이 소셜 계정이 이미 다른 명단에 연결됨
--   not_found      이름+생년월일 일치 없음
--   taken          일치하는 명단이 전부 이미 다른 계정과 연결됨
--   need_phone     동명이인 → 전화번호 뒷 4자리 필요
--   phone_mismatch 전화번호 뒷자리 불일치
--   ambiguous      뒷 4자리로도 구분 불가 → 데스크 문의

create or replace function public.bind_participant(
  p_name text,
  p_birth date,
  p_phone_last4 text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_last4 text := nullif(trim(coalesce(p_phone_last4, '')), '');
  v_total int;
  v_free int;
  v_row participants%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  if exists (select 1 from participants where auth_user_id = v_uid) then
    return jsonb_build_object('status', 'already_bound_self');
  end if;

  select count(*) into v_total
  from participants
  where name = v_name and birth_date = p_birth;

  if v_total = 0 then
    return jsonb_build_object('status', 'not_found');
  end if;

  select count(*) into v_free
  from participants
  where name = v_name and birth_date = p_birth and auth_user_id is null;

  if v_free = 0 then
    return jsonb_build_object('status', 'taken');
  end if;

  if v_free > 1 and v_last4 is null then
    return jsonb_build_object('status', 'need_phone');
  end if;

  if v_last4 is not null then
    select count(*) into v_free
    from participants
    where name = v_name and birth_date = p_birth and auth_user_id is null
      and right(regexp_replace(phone, '\D', '', 'g'), 4) = v_last4;

    if v_free = 0 then
      return jsonb_build_object('status', 'phone_mismatch');
    end if;
    if v_free > 1 then
      return jsonb_build_object('status', 'ambiguous');
    end if;

    select * into v_row
    from participants
    where name = v_name and birth_date = p_birth and auth_user_id is null
      and right(regexp_replace(phone, '\D', '', 'g'), 4) = v_last4
    limit 1;
  else
    select * into v_row
    from participants
    where name = v_name and birth_date = p_birth and auth_user_id is null
    limit 1;
  end if;

  update participants
  set auth_user_id = v_uid,
      bound_at = now(),
      bound_provider = coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', null)
  where id = v_row.id;

  return jsonb_build_object('status', 'ok', 'name', v_row.name);
end;
$$;

-- ── RPC: My 페이지 요약 (본인 + 숙소 + 룸메이트 + 조) ───────────
-- 룸메이트 이름은 본인 RLS 범위 밖이므로 security definer로 모아서 반환.

create or replace function public.get_my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v participants%rowtype;
  v_room jsonb;
  v_team jsonb;
  v_mates jsonb := '[]'::jsonb;
begin
  select * into v from participants where auth_user_id = auth.uid();
  if not found then
    return null;
  end if;

  if v.room_id is not null then
    select jsonb_build_object(
      'building', building, 'room_no', room_no,
      'capacity', capacity, 'note', note
    ) into v_room from rooms where id = v.room_id;

    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from participants where room_id = v.room_id;
  end if;

  if v.team_id is not null then
    select jsonb_build_object(
      'name', name, 'leader', leader, 'note', note
    ) into v_team from teams where id = v.team_id;
  end if;

  return jsonb_build_object(
    'id', v.id,
    'name', v.name,
    'role', v.role,
    'checked_in_at', v.checked_in_at,
    'checkin_token', v.checkin_token,
    'room', v_room,
    'mates', v_mates,
    'team', v_team
  );
end;
$$;

-- ── RPC: QR 체크인 (관리자) ─────────────────────────────────────

create or replace function public.admin_checkin_by_token(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v participants%rowtype;
  v_room text;
begin
  if not is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select * into v from participants where checkin_token = p_token;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  select building || ' ' || room_no into v_room from rooms where id = v.room_id;

  if v.checked_in_at is not null then
    return jsonb_build_object(
      'status', 'already', 'name', v.name,
      'room', v_room, 'checked_in_at', v.checked_in_at
    );
  end if;

  update participants set checked_in_at = now() where id = v.id;
  return jsonb_build_object('status', 'ok', 'name', v.name, 'room', v_room);
end;
$$;

-- ── RPC: 관리자 대시보드 통계 ───────────────────────────────────

create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_total int;
  v_in int;
  v_rooms_total int;
  v_rooms_used int;
  v_gb int;
  v_photos int;
  v_recent jsonb;
  v_missing jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  select count(*), count(checked_in_at) into v_total, v_in from participants;
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used from participants where room_id is not null;
  select count(*) into v_gb from guestbook where not hidden;
  select count(*) into v_photos from photos where not hidden;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_recent from (
    select p.name, p.checked_in_at, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is not null
    order by p.checked_in_at desc
    limit 8
  ) x;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_missing from (
    select p.name, p.phone, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is null
    order by p.name
    limit 60
  ) x;

  return jsonb_build_object(
    'total', v_total,
    'checked_in', v_in,
    'rooms_total', v_rooms_total,
    'rooms_used', v_rooms_used,
    'guestbook', v_gb,
    'photos', v_photos,
    'recent', v_recent,
    'missing', v_missing
  );
end;
$$;

-- ── 권한 ────────────────────────────────────────────────────────

grant execute on function public.bind_participant(text, date, text) to authenticated;
grant execute on function public.get_my_summary() to authenticated;
grant execute on function public.admin_checkin_by_token(uuid) to authenticated;
grant execute on function public.admin_stats() to authenticated;
