-- 대시보드 통계를 데스크 운영에 맞게 다시 짠다.
--
-- 행사 당일 데스크에서 보고 싶은 것은 「누가 안 왔나」가 아니라 「지금
-- 몇 명 들어왔고, 그 사람이 어느 방·어느 조인가」다. 미도착 명단은 참가자
-- 탭에서 걸러 보면 되므로 여기서 뺀다.
--
-- 새로 세는 것:
--   · 지체 / 교역자·멘토 — applicant_type이 '교역자'·'멘토'면 섬기는 쪽
--   · 시스템 가입 — 소셜 계정을 연결한 사람(auth_user_id)
--   · 금·토 도착 — arrive_day에 '(금)'·'(토)'가 들어 있는 사람. 신청서를
--     안 쓴 교역자·멘토·수동 추가 인원은 어느 쪽에도 안 든다 (2026-09-11 결정)
--
-- 체크인 이력은 따로 쌓지 않는다. checked_in_at 하나로 충분하다 — 취소하면
-- 피드에서 빠지는 것이 오히려 맞다. 대신 피드 한 줄에 방·조·티셔츠·멘토
-- 신청을 붙여, 데스크에서 그 사람에게 바로 안내할 수 있게 한다.
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_total int; v_members int; v_staff int; v_in int; v_pending int;
  v_rooms_total int; v_rooms_used int;
  v_joined int;
  v_fri_total int; v_fri_in int; v_sat_total int; v_sat_in int;
  v_recent jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  select
    count(*),
    count(*) filter (where coalesce(applicant_type, '') not in ('교역자', '멘토')),
    count(*) filter (where applicant_type in ('교역자', '멘토')),
    count(checked_in_at),
    count(auth_user_id),
    count(*) filter (where arrive_day like '%(금)%'),
    count(checked_in_at) filter (where arrive_day like '%(금)%'),
    count(*) filter (where arrive_day like '%(토)%'),
    count(checked_in_at) filter (where arrive_day like '%(토)%')
  into v_total, v_members, v_staff, v_in, v_joined,
       v_fri_total, v_fri_in, v_sat_total, v_sat_in
  from participants
  where status = 'approved';

  select count(*) into v_pending from participants where status = 'pending';
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used
    from participants where room_id is not null and status = 'approved';

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_recent from (
    select
      p.name,
      p.checked_in_at,
      r.building || ' ' || r.room_no as room,
      t.name as team,
      p.tshirt,
      (select s.mentor_name
         from mentor_signups g join mentor_sessions s on s.id = g.session_id
        where g.participant_id = p.id
        limit 1) as mentor
    from participants p
    left join rooms r on r.id = p.room_id
    left join teams t on t.id = p.team_id
    where p.checked_in_at is not null
    order by p.checked_in_at desc
    limit 60
  ) x;

  return jsonb_build_object(
    'total', v_total, 'members', v_members, 'staff', v_staff,
    'checked_in', v_in, 'pending', v_pending,
    'rooms_total', v_rooms_total, 'rooms_used', v_rooms_used,
    'joined', v_joined, 'not_joined', v_total - v_joined,
    'fri_total', v_fri_total, 'fri_in', v_fri_in,
    'sat_total', v_sat_total, 'sat_in', v_sat_in,
    'recent', v_recent
  );
end;
$fn$;
