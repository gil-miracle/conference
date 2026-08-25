-- ════════════════════════════════════════════════════════════════
-- 노출 제어
--   · menu_visibility : 사이트 메뉴를 항목별로 보였다 숨겼다
--   · rooms_open      : 숙소·조 배정 공개 여부 (배정 작업 중에는 숨김)
-- 관리자 설정 탭에서 토글한다.
-- ════════════════════════════════════════════════════════════════

insert into site_settings (key, value) values
  ('menu_visibility', '{"about": true, "speakers": true, "timetable": true, "songs": true, "guestbook": true, "gallery": true}'),
  ('rooms_open', '{"value": false}')
on conflict (key) do nothing;

-- 숙소·조는 rooms_open이 켜졌을 때만 내려준다.
-- 배정이 끝나기 전에 참가자가 어중간한 정보를 보지 않게 하려는 것.
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

    select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
    from participants where room_id = v.room_id and status = 'approved';
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
