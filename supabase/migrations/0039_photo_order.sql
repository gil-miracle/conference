-- 사진 차례를 손으로 정한다.
--
-- 지금까지는 올린 시각 순이었다. 그런데 사진은 여러 사람 폰에서 모여 오고,
-- 시각은 찍은 때가 아니라 올린 때라 순서가 뒤죽박죽이다 — 저녁 사진이
-- 아침 사진 앞에 서는 일이 생긴다. 보여 줄 차례는 사람이 정하는 게 맞다.
--
-- 기존 사진에는 올린 순서대로 번호를 매겨 둔다. 지금 보이는 차례가 그대로
-- 유지되고, 거기서부터 손으로 고치면 된다.

alter table public.photos
  add column if not exists sort_order bigint;

update public.photos p
set sort_order = t.n
from (
  select id, row_number() over (order by created_at) * 10 as n
  from public.photos
) t
where t.id = p.id and p.sort_order is null;

create index if not exists photos_sort_idx on public.photos (sort_order);

/*
 * 새로 올린 사진은 맨 뒤에 선다.
 *
 * 클라이언트에서 「지금 최댓값 + 1」을 계산해 넣으면 두 사람이 동시에 올릴 때
 * 같은 번호가 된다. 넣는 자리에서 한 번에 정하는 편이 어긋날 데가 없다.
 */
create or replace function public.photos_set_order()
returns trigger
language plpgsql security definer set search_path = public
as $fn$
begin
  if new.sort_order is null then
    select coalesce(max(sort_order), 0) + 10 into new.sort_order from photos;
  end if;
  return new;
end;
$fn$;

drop trigger if exists photos_set_order_trg on public.photos;
create trigger photos_set_order_trg
  before insert on public.photos
  for each row execute function public.photos_set_order();

/*
 * 차례 다시 매기기.
 *
 * 한 장씩 예순 번 고치면 그만큼 왕복이 생기고, 중간에 끊기면 반만 바뀐
 * 차례가 남는다. 목록을 통째로 넘겨 한 번에 매긴다.
 */
create or replace function public.admin_reorder_photos(p_ids uuid[])
returns int
language plpgsql security definer set search_path = public
as $fn$
declare
  v_count int;
begin
  if not is_admin() then
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
