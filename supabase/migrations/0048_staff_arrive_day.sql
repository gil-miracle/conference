-- 도착 요일: 교역자는 금요일, 멘토는 토요일로 센다 (0047 보완, 2026-09-11 결정).
--
-- 두 분류는 신청서를 안 써서 arrive_day가 없다. 실제로는 교역자가 금요일
-- 저녁부터, 멘토는 토요일 강의에 맞춰 오시므로 그 요일에 넣는다.
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
      -- 유형이 비어 있으면 지체다
      case applicant_type when '교역자' then 'pastor' when '멘토' then 'mentor' else 'member' end as kind,
      checked_in_at is not null           as ci,
      auth_user_id is not null            as joined,
      -- 교역자는 금요일, 멘토는 토요일에 온다 — 신청서가 없어 arrive_day가 비어 있다
      (arrive_day like '%(금)%' or applicant_type = '교역자') as fri,
      (arrive_day like '%(토)%' or applicant_type = '멘토')   as sat
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
           'all', t.n_all, 'members', t.n_members,
           'pastors', t.n_pastors, 'mentors', t.n_mentors))
    into v_counts
  from (
    select keys.k,
           count(m.k)                                  as n_all,
           count(m.k) filter (where m.kind = 'member') as n_members,
           count(m.k) filter (where m.kind = 'pastor') as n_pastors,
           count(m.k) filter (where m.kind = 'mentor') as n_mentors
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
      -- 방장·조장 — rooms.leader_id / teams.leader_id가 본인이면
      (r.leader_id = p.id) as room_leader,
      (t.leader_id = p.id) as team_leader,
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
