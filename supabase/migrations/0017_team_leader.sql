-- 조장도 그 조 사람 중 하나를 가리키게 한다.
--
-- 지금까지는 이름을 문자열로 적어뒀다. 명단에서 이름을 고치면 조장 이름만
-- 옛것으로 남는다. 방장(0013)과 같은 방식으로 맞춘다.
--
-- 옛 leader 문자열은 지우지 않는다 -- 이미 적어둔 조가 있으면 그대로 보여야
-- 하고, leader_id가 정해지면 그쪽이 이긴다.
alter table teams
  add column if not exists leader_id uuid references participants(id) on delete set null;

-- participants ↔ teams 관계가 둘이 되었다(participants.team_id, teams.leader_id).
-- PostgREST가 `teams(...)`를 못 고르므로 힌트를 줄 이름을 못 박는다.
-- rooms에서 같은 일이 있었다(0015).
alter table participants drop constraint if exists participants_team_id_fkey;

alter table participants
  add constraint participants_team_id_fkey
  foreign key (team_id) references teams(id) on delete set null;

-- 내 정보의 조장 이름을 leader_id에서 끌어온다 (없으면 옛 문자열)
create or replace function public.my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v record;
  v_room jsonb;
  v_team jsonb;
  v_mates jsonb := '[]'::jsonb;
  v_rooms_open boolean;
begin
  select * into v from participants where auth_user_id = auth.uid();
  if not found then
    return null;
  end if;

  if v.status <> 'approved' then
    return jsonb_build_object(
      'id', v.id, 'name', v.name, 'role', v.role,
      'status', v.status, 'reject_reason', v.reject_reason,
      'checked_in_at', null, 'checkin_token', null,
      'room', null, 'mates', '[]'::jsonb, 'team', null,
      'rooms_open', false
    );
  end if;

  select coalesce((value ->> 'value')::boolean, false) into v_rooms_open
  from site_settings where key = 'rooms_open';
  v_rooms_open := coalesce(v_rooms_open, false);

  if v_rooms_open and v.room_id is not null then
    select jsonb_build_object(
      'building', building, 'room_no', room_no,
      'capacity', capacity, 'note', note
    ) into v_room from rooms where id = v.room_id;

    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from participants where room_id = v.room_id and status = 'approved';
  end if;

  if v_rooms_open and v.team_id is not null then
    select jsonb_build_object(
      'name', t.name,
      'leader', coalesce((select p.name from participants p where p.id = t.leader_id), t.leader),
      'note', t.note
    ) into v_team from teams t where t.id = v.team_id;
  end if;

  return jsonb_build_object(
    'id', v.id, 'name', v.name, 'role', v.role,
    'status', v.status, 'reject_reason', null,
    'checked_in_at', v.checked_in_at, 'checkin_token', v.checkin_token,
    'room', v_room, 'mates', v_mates, 'team', v_team,
    'rooms_open', v_rooms_open
  );
end;
$fn$;
