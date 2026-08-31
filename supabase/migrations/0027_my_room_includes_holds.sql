-- 내 정보의 같은 방 사람에 '자리 채움'도 넣는다.
--
-- 계정 없이 방만 잡아 둔 사람(room_holds)이 빠져 있었다. 방에 가 보면 셋인데
-- 화면에는 둘만 있으니 "내 방이 맞나" 싶어진다. 정원과도 어긋난다.
--
-- room_holds는 0019에서 관리자만 읽게 막아 뒀다. 이 함수는 security definer라
-- 그 너머를 볼 수 있고, 내보내는 것은 같은 방 사람의 이름뿐이다 — 참가자
-- 이름과 똑같은 수준이라 새로 새는 정보가 없다.
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

    -- 명단에 있는 사람과 자리만 잡아 둔 사람을 한 줄로 세운다
    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from (
      select name from participants
        where room_id = v.room_id and status = 'approved'
      union all
      select name from room_holds where room_id = v.room_id
    ) x;
  end if;

  if v_rooms_open and v.team_id is not null then
    select jsonb_build_object(
      'name', name, 'leader', leader, 'note', note
    ) into v_team from teams where id = v.team_id;
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
