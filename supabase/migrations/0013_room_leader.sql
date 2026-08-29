-- 방장.
--
-- 방마다 연락을 받고 인원을 챙길 사람이 하나 있어야 한다. 조(teams)는 leader를
-- 이름 문자열로 들고 있지만, 방은 그 방 사람 중 하나를 가리키게 한다 --
-- 이름을 따로 적어두면 명단에서 이름을 고친 뒤 둘이 어긋난다.
--
-- 그 사람이 명단에서 지워지면 방장 자리는 비운다(방을 지우지는 않는다).
alter table rooms
  add column if not exists leader_id uuid references participants(id) on delete set null;
