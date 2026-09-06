-- 내 정보에서도 같은 사람이 같은 색으로 보이게.
--
-- 숙소·조 카드는 이름만 늘어놓았다. 운영진 화면에서는 성별로 색이 갈리고
-- 방장·조장에 표가 붙는데, 참가자 화면에서는 그 정보가 아예 안 내려왔다 —
-- 같은 방을 두 화면에서 다르게 읽게 된다.
--
-- 조 카드에는 조원 목록 자체가 없었다. 조장 이름만 한 줄 적혀 있어서
-- 「우리 조가 누구인지」를 볼 데가 없다.
--
-- mates를 이름 배열에서 {name, gender, leader} 배열로 바꾸고, team에 members를
-- 같은 모양으로 붙인다.

create or replace function public.get_my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v participants%rowtype;
  v_room jsonb;
  v_team jsonb;
  v_mates jsonb := '[]'::jsonb;
  v_members jsonb := '[]'::jsonb;
  v_rooms_open boolean;
  v_teams_open boolean;
  v_room_leader uuid;
  v_team_leader uuid;
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
      'room', null, 'mates', '[]'::jsonb, 'team', null,
      'rooms_open', false, 'teams_open', false
    );
  end if;

  select coalesce((value ->> 'value')::boolean, false) into v_rooms_open
  from site_settings where key = 'rooms_open';
  v_rooms_open := coalesce(v_rooms_open, false);

  select coalesce((value ->> 'value')::boolean, false) into v_teams_open
  from site_settings where key = 'teams_open';
  v_teams_open := coalesce(v_teams_open, false);

  if v_rooms_open and v.room_id is not null then
    select jsonb_build_object(
      'building', building, 'room_no', room_no,
      'capacity', capacity, 'note', note
    ), leader_id
    into v_room, v_room_leader
    from rooms where id = v.room_id;

    -- 명단에 있는 사람과 자리만 잡아 둔 사람을 한 줄로 세운다.
    -- 자리만 잡아 둔 사람은 방장이 될 수 없다(계정이 없다).
    select coalesce(jsonb_agg(jsonb_build_object(
             'name', x.name, 'gender', x.gender, 'leader', x.leader
           ) order by x.leader desc, x.name), '[]'::jsonb)
    into v_mates
    from (
      select name, gender, (id = v_room_leader) as leader
        from participants
        where room_id = v.room_id and status = 'approved'
      union all
      select name, gender, false from room_holds where room_id = v.room_id
    ) x;
  end if;

  if v_teams_open and v.team_id is not null then
    select jsonb_build_object(
      'name', t.name,
      'leader', coalesce((select p.name from participants p where p.id = t.leader_id), t.leader),
      'note', t.note
    ), t.leader_id
    into v_team, v_team_leader
    from teams t where t.id = v.team_id;

    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.name, 'gender', p.gender, 'leader', (p.id = v_team_leader)
           ) order by (p.id = v_team_leader) desc, p.name), '[]'::jsonb)
    into v_members
    from participants p
    where p.team_id = v.team_id and p.status = 'approved';

    v_team := v_team || jsonb_build_object('members', v_members);
  end if;

  return jsonb_build_object(
    'id', v.id, 'name', v.name, 'role', v.role,
    'status', v.status, 'reject_reason', null,
    'checked_in_at', v.checked_in_at, 'checkin_token', v.checkin_token,
    'room', v_room, 'mates', v_mates, 'team', v_team,
    'rooms_open', v_rooms_open, 'teams_open', v_teams_open
  );
end;
$fn$;
