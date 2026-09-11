-- 사진 담당은 갤러리를 통째로 관리한다 — 올리고, 차례를 바꾸고, 날을 옮기고,
-- 숨기고, 지운다.
--
-- 0051 에서는 올리기만 열었다. 그런데 올리는 사람이 곧 정리하는 사람이다 —
-- 잘못 올린 것을 운영진에게 부탁해 지우게 두면 결국 운영진이 다 하게 된다.
-- 사진 담당에게 닫힌 것은 갤러리 밖(명단·설정)뿐이다.
--
-- is_photographer() 는 운영진을 포함하므로(0051) 운영진 쪽은 달라지지 않는다.

-- 보기 — 갤러리가 열리기 전에도, 숨긴 것도 본다. 정리하는 자리라 안 보이면
-- 못 고친다. 참가자 화면은 hidden=false 를 따로 걸러 그린다
drop policy if exists "photos_select" on public.photos;
create policy "photos_select" on public.photos
  for select to authenticated
  using ((setting_on('gallery_open') and not hidden) or is_photographer());

-- 숨기기·날 옮기기 (update)
drop policy if exists "photos_admin_update" on public.photos;
create policy "photos_admin_update" on public.photos
  for update to authenticated
  using (is_photographer()) with check (is_photographer());

-- 지우기
drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete" on public.photos
  for delete to authenticated
  using (is_photographer());

-- 차례 매기기 — 함수 안의 문도 같은 문으로
create or replace function public.admin_reorder_photos(p_ids uuid[])
returns int
language plpgsql security definer set search_path = public
as $fn$
declare
  v_count int;
begin
  if not is_photographer() then
    raise exception 'forbidden';
  end if;

  update photos p
  set sort_order = t.n * 10
  from (select u.pid, u.n from unnest(p_ids) with ordinality as u(pid, n)) t
  where p.id = t.pid;

  get diagnostics v_count = row_count;
  return v_count;
end;
$fn$;

grant execute on function public.admin_reorder_photos(uuid[]) to authenticated;
