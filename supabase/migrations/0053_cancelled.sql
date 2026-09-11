-- 참가 취소 (2026-09-11 결정).
--
-- 신청했다가 못 오게 된 사람을 명단에서 지우면 「원래 몇 명이었나」가 사라진다.
-- 지우지 않고 취소로 표시한다. 대시보드는 취소를 모든 수에서 빼고, 취소 수를
-- 따로 보인다 — 그래야 전체와 도착·미가입이 맞아떨어진다.

alter table public.participants
  add column if not exists cancelled_at timestamptz;

comment on column public.participants.cancelled_at is
  '참가 취소 시각 — 있으면 집계에서 빠진다. 명단에는 남는다';

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
      cancelled_at is not null            as cx,
      checked_in_at is not null           as ci,
      auth_user_id is not null            as joined,
      -- 교역자는 금요일, 멘토는 토요일에 온다 — 신청서가 없어 arrive_day가 비어 있다
      (arrive_day like '%(금)%' or applicant_type = '교역자') as fri,
      (arrive_day like '%(토)%' or applicant_type = '멘토')   as sat
    from participants
  ), m as (
    select 'total'      as k, * from p where not cx
    union all select 'checked_in', * from p where not cx and ci
    union all select 'joined',     * from p where not cx and joined
    union all select 'not_joined', * from p where not cx and not joined
    union all select 'fri_total',  * from p where not cx and fri
    union all select 'fri_in',     * from p where not cx and fri and ci
    union all select 'sat_total',  * from p where not cx and sat
    union all select 'sat_in',     * from p where not cx and sat and ci
    union all select 'cancelled',  * from p where cx
  ), keys as (
    select unnest(array['total','checked_in','joined','not_joined',
                        'fri_total','fri_in','sat_total','sat_in','cancelled']) as k
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

  select count(*) into v_pending from participants where status = 'pending' and cancelled_at is null;
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used
    from participants where room_id is not null and cancelled_at is null;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_recent from (
    select
      p.name,
      p.checked_in_at,
      r.building || ' ' || r.room_no as room,
      t.name as team,
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
    where p.checked_in_at is not null and p.cancelled_at is null
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
