-- 반려는 막다른 길이 아니다.
--
-- 반려하면 그 줄은 status='rejected'로 바뀌지만 auth_user_id는 그대로 남았다.
-- 그래서 그 계정으로 다시 들어오면
--   · get_my_summary가 값을 내주니 /connect는 /profile로 되돌려보내고
--   · lookup·bind는 "이미 요청했다"고만 답한다
-- 어느 쪽으로도 못 간다. 로그인은 되는데 할 수 있는 게 없다.
--
-- 반려의 대부분은 「이름을 잘못 적었다」, 「다른 사람 줄에 붙었다」 같은
-- 고치면 되는 일이다. 그런데 정작 고칠 자리를 없애 두었다.
--
-- 반려된 연결은 놓아 준다 — 다시 입력해서 새로 붙을 수 있게.
-- 이름·전화를 고쳐 다른 줄로 갈 수도 있으니, 붙잡아 두지 않고 풀었다가
-- 아래에서 처음부터 다시 맞춘다.
--
-- 사칭이라서 반려한 경우엔 다시 들어오는데, 그건 반려로 막을 수 있는 일이
-- 아니었다(연결을 풀면 명단이 비고, 이름·생년월일·전화를 아는 사람은 언제든
-- 다시 잡는다). 그건 승인 화면에서 사람이 판단할 일이고, 여기서 할 일은
-- 실수한 사람이 스스로 고칠 길을 남기는 것이다.

-- ── 조회 ─────────────────────────────────────────────────────────
-- 반려된 사람에게는 자기 자신에게 묶인 줄이 「다시 잡을 수 있는 줄」이다.
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
  if found and v_existing.status <> 'rejected' then
    return jsonb_build_object(
      'status', 'already_requested',
      'state', v_existing.status,
      'name', v_existing.name
    );
  end if;

  select
    -- 내게 묶인 줄은 비어 있는 것으로 친다 (여기까지 왔다면 반려된 연결이다)
    count(*) filter (where auth_user_id is null or auth_user_id = v_uid),
    count(*) filter (where auth_user_id is not null and auth_user_id <> v_uid)
  into v_free, v_bound
  from participants
  where name = v_name
    and regexp_replace(phone, '\D', '', 'g') = v_digits
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
-- 나머지는 0036과 같다. 바뀐 것은 기존 연결을 만났을 때의 처리다.
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
  if found and v_existing.status <> 'rejected' then
    return jsonb_build_object(
      'status', 'already_requested',
      'state', v_existing.status,
      'name', v_existing.name
    );
  end if;

  if found then
    -- 반려된 연결을 놓아 준다. 명단 줄은 아무도 잡지 않은 상태로 되돌리고,
    -- 반려 사유도 지운다 — 다음에 이 줄을 잡는 사람의 사유가 아니다.
    update participants
    set auth_user_id = null,
        bound_at = null,
        bound_provider = null,
        requested_at = null,
        status = 'pending',
        approved_at = null,
        approved_by = null,
        reject_reason = null
    where id = v_existing.id;
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
    -- 같은 신원이 이미 연결돼 있으면 선점 충돌, 아니면 신청 이력 없음.
    -- (방금 놓아 준 줄과 안 맞는 이름을 넣었다는 뜻이라 연결 없는 상태로
    --  남는데, 그 화면에서 다시 입력하면 된다 — 막히지 않는다)
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
