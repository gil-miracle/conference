-- 자리 채움.
--
-- 방 한 칸을 차지하지만 명단에 올릴 사람은 아니다. 자리만 채우자고
-- participants에 넣으면 생년월일·전화번호를 지어내야 하는데, 그렇게 들어간
-- 가짜 값은 나중에 시트 동기화에서 중복으로 되돌아온다.
--
-- 명단·체크인·참석 인원 집계·QR 어디에도 나오지 않는다. 방 정원 계산에만 든다.
-- 방을 지우면 같이 사라진다 -- 방 없는 자리는 뜻이 없다.
create table room_holds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  gender text check (gender is null or gender in ('남', '여')),
  created_at timestamptz not null default now()
);

create index room_holds_room_idx on room_holds (room_id);

alter table room_holds enable row level security;

-- rooms와 같은 규칙 — 로그인 사용자는 보고, 관리자만 고친다
create policy "room_holds_select" on room_holds
  for select to authenticated using (true);
create policy "room_holds_admin" on room_holds
  for all using (is_admin()) with check (is_admin());
