-- 교역자·멘토는 참석 인원이 아니다.
--
-- 섬기러 오는 분들이라 체크인 데스크를 지나지 않는다. 그런데 분모에 들어가
-- 있으면 행사 내내 "몇 명 안 왔다"가 실제보다 많게 잡히고, 미도착 명단에도
-- 계속 남아 확인 전화를 부른다.
--
-- 방 배정(rooms_used)은 그대로 둔다 -- 이분들도 방을 쓴다.
-- 승인 대기(pending)도 그대로 -- 로그인 승인은 참석 여부와 다른 이야기다.
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v_total int; v_in int; v_pending int;
  v_rooms_total int; v_rooms_used int; v_gb int; v_photos int;
  v_recent jsonb; v_missing jsonb;
begin
  if not is_admin() then
    return null;
  end if;

  select count(*), count(checked_in_at) into v_total, v_in
    from participants
    where status = 'approved'
      and coalesce(applicant_type, '') not in ('교역자', '멘토');
  select count(*) into v_pending from participants where status = 'pending';
  select count(*) into v_rooms_total from rooms;
  select count(distinct room_id) into v_rooms_used
    from participants where room_id is not null and status = 'approved';
  select count(*) into v_gb from guestbook where not hidden;
  select count(*) into v_photos from photos where not hidden;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_recent from (
    select p.name, p.checked_in_at, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is not null
    order by p.checked_in_at desc limit 8
  ) x;

  select coalesce(jsonb_agg(x), '[]'::jsonb) into v_missing from (
    select p.name, p.phone, r.building || ' ' || r.room_no as room
    from participants p left join rooms r on r.id = p.room_id
    where p.checked_in_at is null and p.status = 'approved'
      and coalesce(p.applicant_type, '') not in ('교역자', '멘토')
    order by p.name limit 60
  ) x;

  return jsonb_build_object(
    'total', v_total, 'checked_in', v_in, 'pending', v_pending,
    'rooms_total', v_rooms_total, 'rooms_used', v_rooms_used,
    'guestbook', v_gb, 'photos', v_photos,
    'recent', v_recent, 'missing', v_missing
  );
end;
$fn$;
