-- 사진은 운영진이 올리고, 운영진만 지운다.
--
-- 처음에는 참가자 누구나 올리고 자기 사진은 자기가 지우게 두었다. 그런데
-- 갤러리는 「우리의 순간들」 한 곳뿐이라 아무나 올린 것이 곧 공식 기록이
-- 된다. 지우는 쪽도 마찬가지다 — 올린 사람이 지우면 남들이 이미 본 것이
-- 말없이 사라지고, 잘못 지운 것을 되돌릴 방법도 없다.
--
-- 올리는 일과 내리는 일을 운영진 한 곳으로 모은다. 참가자 화면은 보는
-- 자리로만 남는다.

drop policy if exists "photos_insert" on public.photos;
-- 갤러리 오픈 여부는 묻지 않는다. 참가자에게 보이는 조건일 뿐이고(select
-- 정책), 운영진은 열기 전에 미리 채워 둘 수 있어야 한다.
create policy "photos_insert" on public.photos
  for insert to authenticated
  with check (is_admin());

drop policy if exists "photos_delete" on public.photos;
create policy "photos_delete" on public.photos
  for delete to authenticated
  using (is_admin());
