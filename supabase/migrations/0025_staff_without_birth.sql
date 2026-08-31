-- ════════════════════════════════════════════════════════════════
-- 교역자·멘토는 생년월일 없이
--
-- 그분들은 신청서를 쓰지 않는다. 명단에 넣는 것도 운영진이 직접 한다.
-- 생년월일을 필수로 두면 그걸 받으려고 따로 여쭤야 하는데, 명단에 넣는
-- 데도 로그인 때 맞춰 보는 데도 이름과 전화번호면 충분하다 — 우리가 손으로
-- 넣은 몇 사람이라 사이에 끼어들 자리가 없다.
--
-- 다만 생년월일 없는 대조는 교역자·멘토에게만 연다. 아무에게나 열면
-- 참가자 누구나 생년월일을 비워서 확인 한 단계를 건너뛸 수 있다.
-- ════════════════════════════════════════════════════════════════

alter table public.participants alter column birth_date drop not null;

-- (이름, 생년월일, 전화) 유니크는 생년월일이 null이면 걸리지 않는다.
-- 널끼리는 서로 다르다고 보기 때문이다. 그 자리를 부분 인덱스로 메운다.
create unique index if not exists participants_name_phone_no_birth_key
  on public.participants (name, phone)
  where birth_date is null;

-- ── 조회 ─────────────────────────────────────────────────────────
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
    and regexp_replace(phone, '\D', '', 'g') = v_digits
    -- 생년월일을 안 냈으면 교역자·멘토 줄만 본다
    and case
          when p_birth is not null then birth_date = p_birth
          else birth_date is null and applicant_type in ('교역자', '멘토')
        end;

  if v_free > 0 then
    return jsonb_build_object('status', 'found', 'name', v_name);
  end if;
  if v_bound > 0 then
    return jsonb_build_object('status', 'taken');
  end if;
  return jsonb_build_object('status', 'not_found');
end;
$fn$;

-- ── 요청 ─────────────────────────────────────────────────────────
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
    and regexp_replace(phone, '\D', '', 'g') = v_digits
    and case
          when p_birth is not null then birth_date = p_birth
          else birth_date is null and applicant_type in ('교역자', '멘토')
        end
    and auth_user_id is null
  limit 1
  for update;

  if not found then
    -- 같은 신원이 이미 연결돼 있으면 선점 충돌, 아니면 신청 이력 없음
    if exists (
      select 1 from participants
      where name = v_name
        and regexp_replace(phone, '\D', '', 'g') = v_digits
        and case
              when p_birth is not null then birth_date = p_birth
              else birth_date is null and applicant_type in ('교역자', '멘토')
            end
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
