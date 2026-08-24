-- ════════════════════════════════════════════════════════════════
-- 가입 승인 절차
-- 소셜 로그인 후 이름·생년월일·전화번호를 입력하면 '가입 요청'이 되고,
-- 관리자가 승인해야 My·방명록·갤러리를 쓸 수 있다.
--
-- 흐름: ① 명단에서 매칭 시도 → 있으면 그 행에 연결
--       ② 없으면 새 요청 행 생성
--       어느 쪽이든 status='pending' → 관리자 승인 필요
-- ════════════════════════════════════════════════════════════════

alter table participants
  add column status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  add column requested_at timestamptz,
  add column approved_at timestamptz,
  add column approved_by uuid references participants(id) on delete set null,
  add column reject_reason text;

-- 이미 들어있던 행(첫 관리자 등)은 승인 상태로 둔다
update participants set status = 'approved', approved_at = now();

create index participants_status_idx on participants (status, created_at);

-- ── 헬퍼 갱신 — 쓰기 권한은 '승인된' 참가자에게만 ───────────────

create or replace function public.my_participant_id()
returns uuid
language sql stable security definer set search_path = public
as $fn$
  select id from participants
  where auth_user_id = auth.uid() and status = 'approved';
$fn$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from participants
    where auth_user_id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$fn$;

-- ── 가입 요청 ───────────────────────────────────────────────────
-- 반환 status:
--   pending            요청 접수 (matched=true면 명단에서 찾음)
--   already_requested  이 계정으로 이미 요청함 (state에 현재 상태)
--   taken              해당 신원이 다른 계정에 이미 연결됨
--   invalid            입력값 부족

-- 파라미터 이름이 바뀌어(p_phone_last4 -> p_phone) create or replace로는 교체할 수 없다
drop function if exists public.bind_participant(text, date, text);

create function public.bind_participant(
  p_name text,
  p_birth date,
  p_phone text
) returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_norm text;
  v_row participants%rowtype;
  v_existing participants%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;
  if v_name = '' or length(v_digits) < 10 then
    return jsonb_build_object('status', 'invalid');
  end if;

  -- 010-1234-5678 형태로 정규화
  v_norm := case
    when length(v_digits) = 11
      then substr(v_digits, 1, 3) || '-' || substr(v_digits, 4, 4) || '-' || substr(v_digits, 8, 4)
    when length(v_digits) = 10
      then substr(v_digits, 1, 3) || '-' || substr(v_digits, 4, 3) || '-' || substr(v_digits, 7, 4)
    else v_digits
  end;

  -- 이미 요청했거나 승인된 계정
  select * into v_existing from participants where auth_user_id = v_uid;
  if found then
    return jsonb_build_object(
      'status', 'already_requested',
      'state', v_existing.status,
      'name', v_existing.name
    );
  end if;

  -- ① 명단 매칭 — 이름+생년월일+전화번호가 모두 같고 아직 미연결인 행
  select * into v_row
  from participants
  where name = v_name
    and birth_date = p_birth
    and regexp_replace(phone, '\D', '', 'g') = v_digits
    and auth_user_id is null
  limit 1;

  if found then
    update participants
    set auth_user_id = v_uid,
        bound_at = now(),
        bound_provider = auth.jwt() -> 'app_metadata' ->> 'provider',
        requested_at = now(),
        phone = v_norm
    where id = v_row.id
    returning * into v_row;
    return jsonb_build_object('status', 'pending', 'state', v_row.status, 'matched', true);
  end if;

  -- 같은 신원이 이미 다른 계정에 연결돼 있으면 선점 충돌
  if exists (
    select 1 from participants
    where name = v_name
      and birth_date = p_birth
      and regexp_replace(phone, '\D', '', 'g') = v_digits
      and auth_user_id is not null
  ) then
    return jsonb_build_object('status', 'taken');
  end if;

  -- ② 명단에 없음 — 새 가입 요청 생성
  insert into participants (name, birth_date, phone, auth_user_id, bound_at,
                            bound_provider, requested_at, status)
  values (v_name, p_birth, v_norm, v_uid, now(),
          auth.jwt() -> 'app_metadata' ->> 'provider', now(), 'pending')
  returning * into v_row;

  return jsonb_build_object('status', 'pending', 'state', 'pending', 'matched', false);
end;
$fn$;

-- ── My 요약 — 승인 상태를 함께 내려준다 ─────────────────────────

create or replace function public.get_my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
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

  -- 승인 전에는 상태만 (숙소·조·QR은 승인 후 공개)
  if v.status <> 'approved' then
    return jsonb_build_object(
      'id', v.id, 'name', v.name, 'role', v.role,
      'status', v.status, 'reject_reason', v.reject_reason,
      'checked_in_at', null, 'checkin_token', null,
      'room', null, 'mates', '[]'::jsonb, 'team', null
    );
  end if;

  if v.room_id is not null then
    select jsonb_build_object(
      'building', building, 'room_no', room_no,
      'capacity', capacity, 'note', note
    ) into v_room from rooms where id = v.room_id;

    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from participants where room_id = v.room_id and status = 'approved';
  end if;

  if v.team_id is not null then
    select jsonb_build_object(
      'name', name, 'leader', leader, 'note', note
    ) into v_team from teams where id = v.team_id;
  end if;

  return jsonb_build_object(
    'id', v.id, 'name', v.name, 'role', v.role,
    'status', v.status, 'reject_reason', null,
    'checked_in_at', v.checked_in_at, 'checkin_token', v.checkin_token,
    'room', v_room, 'mates', v_mates, 'team', v_team
  );
end;
$fn$;

-- ── 관리자: 승인 / 거절 / 일괄 승인 ─────────────────────────────

create or replace function public.admin_set_status(
  p_participant_id uuid,
  p_status text,
  p_reason text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_admin uuid;
  v_row participants%rowtype;
begin
  if not is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  if p_status not in ('pending', 'approved', 'rejected') then
    return jsonb_build_object('status', 'invalid');
  end if;

  select id into v_admin from participants where auth_user_id = auth.uid();

  update participants
  set status = p_status,
      approved_at = case when p_status = 'approved' then now() else null end,
      approved_by = case when p_status = 'approved' then v_admin else null end,
      reject_reason = case when p_status = 'rejected' then p_reason else null end
  where id = p_participant_id
  returning * into v_row;

  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  return jsonb_build_object('status', 'ok', 'name', v_row.name, 'state', v_row.status);
end;
$fn$;

-- 명단을 일괄 등록한 뒤 한 번에 승인할 때 사용
create or replace function public.admin_approve_all()
returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_admin uuid;
  v_count int;
begin
  if not is_admin() then
    return jsonb_build_object('status', 'forbidden');
  end if;
  select id into v_admin from participants where auth_user_id = auth.uid();

  with updated as (
    update participants
    set status = 'approved', approved_at = now(), approved_by = v_admin
    where status = 'pending'
    returning 1
  )
  select count(*) into v_count from updated;

  return jsonb_build_object('status', 'ok', 'approved', v_count);
end;
$fn$;

-- 체크인은 승인된 참가자만
create or replace function public.admin_checkin_by_token(p_token uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $fn$
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
  if v.status <> 'approved' then
    return jsonb_build_object('status', 'not_approved', 'name', v.name);
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
$fn$;

-- 통계에 승인 대기 수 추가
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_total int; v_in int; v_pending int;
  v_rooms_total int; v_rooms_used int; v_gb int; v_photos int;
  v_recent jsonb; v_missing jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  select count(*), count(checked_in_at) into v_total, v_in
    from participants where status = 'approved';
  select count(*) into v_pending from participants where status = 'pending';
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used
    from participants where room_id is not null and status = 'approved';
  select count(*) into v_gb from guestbook where not hidden;
  select count(*) into v_photos from photos where not hidden;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_recent from (
    select p.name, p.checked_in_at, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is not null
    order by p.checked_in_at desc limit 8
  ) x;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_missing from (
    select p.name, p.phone, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is null and p.status = 'approved'
    order by p.name limit 60
  ) x;

  return jsonb_build_object(
    'total', v_total, 'checked_in', v_in, 'pending', v_pending,
    'rooms_total', v_rooms_total, 'rooms_used', v_rooms_used,
    'guestbook', v_gb, 'photos', v_photos,
    'recent', v_recent, 'missing', v_missing
  );
end;
$fn$;

grant execute on function public.bind_participant(text, date, text) to authenticated;
grant execute on function public.admin_set_status(uuid, text, text) to authenticated;
grant execute on function public.admin_approve_all() to authenticated;

-- ── 관리자: 승인 대기 목록 (소셜 프로필 포함) ───────────────────
-- 사칭 판별 근거를 함께 내려준다.
--   · 소셜 닉네임·프로필 사진·이메일·로그인 수단
--   · 명단 일치 여부(matched) — 신청 명단에 원래 있던 사람인지
-- auth.users는 PostgREST로 직접 못 읽으므로 security definer로 조인한다.

create or replace function public.admin_join_requests(p_status text default 'pending')
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_rows jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  select coalesce(jsonb_agg(x order by x.requested_at desc), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id,
      p.name,
      p.birth_date,
      p.phone,
      p.status,
      p.requested_at,
      p.bound_provider,
      -- 명단에 원래 있던 사람인지(관리자가 CSV로 올린 행이면 created_at < requested_at)
      (p.requested_at is null or p.created_at < p.requested_at - interval '1 second') as matched,
      u.raw_user_meta_data ->> 'name'        as social_name,
      u.raw_user_meta_data ->> 'full_name'   as social_full_name,
      u.raw_user_meta_data ->> 'avatar_url'  as social_avatar,
      u.raw_user_meta_data ->> 'picture'     as social_picture,
      u.email                                as social_email
    from participants p
    left join auth.users u on u.id = p.auth_user_id
    where p.status = p_status
      and p.auth_user_id is not null
  ) x;

  return v_rows;
end;
$fn$;

grant execute on function public.admin_join_requests(text) to authenticated;
