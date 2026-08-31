-- 교역자·멘토도 참석 인원으로 센다 (0010을 되돌린다).
--
-- 0010에서는 "섬기러 오는 분들이라 체크인 데스크를 지나지 않는다"고 보고
-- 분모에서 뺐다. 실제로는 그분들도 오시고, 오신 걸 확인해야 한다. 빼 두면
-- 데스크에서 체크인을 눌러도 반영되지 않아 오히려 손이 더 간다.
--
-- 세는 규칙은 하나여야 한다 — 승인된 사람은 모두 센다.
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
    where status = 'approved';
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
