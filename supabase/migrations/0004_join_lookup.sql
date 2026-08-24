-- ════════════════════════════════════════════════════════════════
-- 가입 절차 확정
--   ① 조회(lookup)  — 신청 명단에 있는지 확인만 한다. 없으면 거기서 끝.
--   ② 요청(request) — 본인이 맞다고 확인하면 그때 가입 요청을 보낸다.
--
-- 명단에 없는 사람은 요청 자체를 만들 수 없다(사칭·무단 가입 차단).
-- 요청은 pending 상태이며 관리자 승인 후에만 활동할 수 있다.
-- ════════════════════════════════════════════════════════════════

-- ── ① 조회 — 명단 확인만, 아무것도 바꾸지 않는다 ────────────────
-- 반환 status:
--   found              명단에 있고 아직 아무도 연결하지 않음 → 요청 가능
--   taken              이미 다른 계정이 연결함 (사칭 의심 시 운영진 문의 유도)
--   not_found          신청 이력 없음
--   already_requested  이 계정이 이미 요청·승인됨
--   invalid            입력값 부족

create or replace function public.lookup_participant(
  p_name text,
  p_birth date,
  p_phone text
) returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_name text := trim(p_name);
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_existing participants%rowtype;
  v_free int;
  v_bound int;
begin
  if v_uid is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;
  if v_name = '' or length(v_digits) < 10 then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_existing from participants where auth_user_id = v_uid;
  if found then
    return jsonb_build_object(
      'status', 'already_requested',
      'state', v_existing.status,
      'name', v_existing.name
    );
  end if;

  select
    count(*) filter (where auth_user_id is null),
    count(*) filter (where auth_user_id is not null)
  into v_free, v_bound
  from participants
  where name = v_name
    and birth_date = p_birth
    and regexp_replace(phone, '\D', '', 'g') = v_digits;

  if v_free > 0 then
    return jsonb_build_object('status', 'found', 'name', v_name);
  end if;
  if v_bound > 0 then
    return jsonb_build_object('status', 'taken');
  end if;
  return jsonb_build_object('status', 'not_found');
end;
$fn$;

-- ── ② 요청 — 명단에 있을 때만 연결하고 승인 대기로 둔다 ─────────
-- 반환 status:
--   requested          가입 요청 접수 (승인 대기)
--   not_found          신청 이력 없음 — 요청을 만들지 않는다
--   taken / already_requested / invalid  (조회와 동일)

create or replace function public.bind_participant(
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

  v_norm := case
    when length(v_digits) = 11
      then substr(v_digits, 1, 3) || '-' || substr(v_digits, 4, 4) || '-' || substr(v_digits, 8, 4)
    when length(v_digits) = 10
      then substr(v_digits, 1, 3) || '-' || substr(v_digits, 4, 3) || '-' || substr(v_digits, 7, 4)
    else v_digits
  end;

  select * into v_existing from participants where auth_user_id = v_uid;
  if found then
    return jsonb_build_object(
      'status', 'already_requested',
      'state', v_existing.status,
      'name', v_existing.name
    );
  end if;

  -- 명단에서 아직 연결되지 않은 행을 잠그고 가져온다 (동시 요청 시 선점 방지)
  select * into v_row
  from participants
  where name = v_name
    and birth_date = p_birth
    and regexp_replace(phone, '\D', '', 'g') = v_digits
    and auth_user_id is null
  limit 1
  for update;

  if not found then
    -- 같은 신원이 이미 연결돼 있으면 선점 충돌, 아니면 신청 이력 없음
    if exists (
      select 1 from participants
      where name = v_name
        and birth_date = p_birth
        and regexp_replace(phone, '\D', '', 'g') = v_digits
    ) then
      return jsonb_build_object('status', 'taken');
    end if;
    return jsonb_build_object('status', 'not_found');
  end if;

  update participants
  set auth_user_id = v_uid,
      bound_at = now(),
      bound_provider = auth.jwt() -> 'app_metadata' ->> 'provider',
      requested_at = now(),
      phone = v_norm,
      status = case when status = 'approved' then 'approved' else 'pending' end
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('status', 'requested', 'state', v_row.status);
end;
$fn$;

grant execute on function public.lookup_participant(text, date, text) to authenticated;
grant execute on function public.bind_participant(text, date, text) to authenticated;
