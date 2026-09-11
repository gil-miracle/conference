-- 대시보드는 명단 전체를 세고, 칸마다 지체·교역자를 나눠 보인다 (0044 보완, 2026-09-11 결정).
--
-- 0044까지는 승인된 사람만 셌다. 그러면 「전체 인원」이 명단이 아니라
-- 「가입까지 마친 사람」이 되고, 시스템 가입 칸은 늘 n/n이라 아무것도
-- 말해 주지 않았다 — 승인은 곧 계정이 연결됐다는 뜻이기 때문이다.
--
-- 명단에 있는 사람은 전부 센다. 가입 여부는 「시스템 가입/미가입」 칸이
-- 따로 말한다: 계정을 연결한 사람(auth_user_id)과 아직 안 한 사람.
--
-- 모든 수는 {all, members, staff} 세 값이다. 교역자·멘토는 신청서를 안
-- 써서 도착 요일·티셔츠 같은 것이 비어 있고, 데스크에서도 지체와 따로
-- 챙기므로 어느 칸이든 「지체 몇, 교역자 몇」이 함께 보여야 한다.
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_counts jsonb; v_pending int;
  v_rooms_total int; v_rooms_used int;
  v_recent jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  with p as (
    select
      -- 유형이 비어 있으면 지체다. null in (...)은 null이라 coalesce가 필요하다
      coalesce(applicant_type in ('교역자', '멘토'), false) as staff,
      checked_in_at is not null           as ci,
      auth_user_id is not null            as joined,
      arrive_day like '%(금)%'            as fri,
      arrive_day like '%(토)%'            as sat
    from participants
  ), m as (
    select 'total'      as k, * from p
    union all select 'checked_in', * from p where ci
    union all select 'joined',     * from p where joined
    union all select 'not_joined', * from p where not joined
    union all select 'fri_total',  * from p where fri
    union all select 'fri_in',     * from p where fri and ci
    union all select 'sat_total',  * from p where sat
    union all select 'sat_in',     * from p where sat and ci
  ), keys as (
    select unnest(array['total','checked_in','joined','not_joined',
                        'fri_total','fri_in','sat_total','sat_in']) as k
  )
  select jsonb_object_agg(t.k, jsonb_build_object(
           'all', t.n_all, 'members', t.n_members, 'staff', t.n_staff))
    into v_counts
  from (
    select keys.k,
           count(m.k)                            as n_all,
           count(m.k) filter (where not m.staff) as n_members,
           count(m.k) filter (where m.staff)     as n_staff
    from keys left join m on m.k = keys.k
    group by keys.k
  ) t;

  select count(*) into v_pending from participants where status = 'pending';
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used
    from participants where room_id is not null;

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

  return v_counts || jsonb_build_object(
    'pending', v_pending,
    'rooms_total', v_rooms_total, 'rooms_used', v_rooms_used,
    'recent', v_recent
  );
end;
$fn$;
