-- 사진이 어느 날 것인가.
--
-- 지금까지는 올린 시각으로 갈랐다. 그런데 사진은 그날 밤이나 이튿날 몰아서
-- 올린다 — 금요일 사진이 토요일 칸에 선다. 올리는 사람이 날을 고르고, 잘못
-- 들어간 것은 옮긴다.

alter table photos
  add column if not exists day smallint check (day between 1 and 3);

-- 이미 올라온 것은 예전 규칙 그대로 — 올린 시각(한국 시간)으로
update photos
   set day = greatest(1, least(3,
         (date(created_at at time zone 'Asia/Seoul') - date '2026-09-11') + 1))
 where day is null;

-- 앞으로도 비워 두면 올린 날로 채운다. 옛 화면이 남아 있어도 빈 칸이 안 생긴다
create or replace function public.photos_default_day()
returns trigger language plpgsql as $fn$
begin
  if new.day is null then
    new.day := greatest(1, least(3,
      (date(now() at time zone 'Asia/Seoul') - date '2026-09-11') + 1));
  end if;
  return new;
end;
$fn$;

drop trigger if exists photos_day on photos;
create trigger photos_day before insert on photos
  for each row execute function public.photos_default_day();
