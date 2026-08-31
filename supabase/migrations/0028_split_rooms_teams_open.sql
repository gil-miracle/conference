-- 숙소 공개와 조 공개를 가른다.
--
-- 스위치 하나가 둘을 함께 열고 닫았다. 숙소는 며칠 전에 확정되는데 조는
-- 당일까지 바뀌곤 해서, 조 하나 때문에 다 끝난 숙소까지 붙들고 있어야 했다.
--
-- 새 키는 지금 rooms_open 값을 그대로 물려받는다 — 배포한다고 해서 보이던
-- 것이 사라지거나 안 보이던 것이 열려서는 안 된다.
insert into site_settings (key, value)
select
  'teams_open',
  coalesce(
    (select value from site_settings where key = 'rooms_open'),
    '{"value": false}'::jsonb
  )
where not exists (select 1 from site_settings where key = 'teams_open');

-- 0027에서 이 함수를 0006 기준으로 다시 썼다가 0017이 넣은 조장 조회를
-- 되돌려 버렸다. 여기서 되살린다 — teams.leader_id가 가리키는 사람 이름을
-- 쓰고, 없을 때만 손으로 적은 leader로 물러선다.
create or replace function public.get_my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v participants%rowtype;
  v_room jsonb;
  v_team jsonb;
  v_mates jsonb := '[]'::jsonb;
  v_rooms_open boolean;
  v_teams_open boolean;
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
    ) into v_room from rooms where id = v.room_id;

    -- 명단에 있는 사람과 자리만 잡아 둔 사람을 한 줄로 세운다
    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from (
      select name from participants
        where room_id = v.room_id and status = 'approved'
      union all
      select name from room_holds where room_id = v.room_id
    ) x;
  end if;

  if v_teams_open and v.team_id is not null then
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
    'rooms_open', v_rooms_open, 'teams_open', v_teams_open
  );
end;
$fn$;
