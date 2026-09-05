-- 연결을 끊으면 승인도 함께 풀린다.
--
-- 지금까지는 연결해제가 auth_user_id만 지웠다. status는 'approved'로 남았고,
-- bind_participant에는 "이미 approved면 approved를 유지한다"는 줄이 있었다.
-- 둘이 겹치면서 **연결해제한 명단은 다음에 연결하는 사람이 승인 없이 바로
-- 들어오는 자리**가 됐다.
--
-- 연결해제를 쓰는 상황이 대개 "엉뚱한 사람이 연결했다"인데, 바로 그 상황에서
-- 엉뚱한 사람이 다시 들어올 수 있었다.
--
-- 승인은 사람이 아니라 **그 연결**에 붙은 것이다. 연결이 끊기면 같이 풀린다.

-- ── 이미 그렇게 남아 있는 줄부터 되돌린다 ────────────────
-- 연결이 없는데 승인돼 있는 줄 = 지금 이 구멍이 열려 있는 줄이다.
-- (0003이 옛 참가자를 일괄 승인해 둔 흔적도 여기서 정리된다)
update public.participants
set status = 'pending',
    approved_at = null
where auth_user_id is null
  and status = 'approved';

-- ── 연결이 없던 줄은 승인을 물려받지 않는다 ──────────────
-- 나머지는 0004와 같다. 바뀐 것은 마지막 update의 status 한 줄뿐이다.
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

  -- 여기 오는 줄은 auth_user_id가 비어 있던 줄이다. 거기 남아 있던 승인은
  -- 지난 연결의 것이므로 물려받지 않는다 — 새로 연결하면 새로 승인받는다.
  update participants
  set auth_user_id = v_uid,
      bound_at = now(),
      bound_provider = auth.jwt() -> 'app_metadata' ->> 'provider',
      requested_at = now(),
      phone = v_norm,
      status = 'pending',
      approved_at = null
  where id = v_row.id
  returning * into v_row;

  return jsonb_build_object('status', 'requested', 'state', v_row.status);
end;
$fn$;
