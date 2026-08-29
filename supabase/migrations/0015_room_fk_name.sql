-- participants ↔ rooms 관계가 둘이 되었다.
--
--   participants.room_id  → rooms.id   (그 사람이 묵는 방)
--   rooms.leader_id       → participants.id  (그 방의 방장, 0013)
--
-- PostgREST는 `rooms(...)`가 둘 중 어느 쪽인지 고르지 못해 참가자 목록 API가
-- 통째로 실패했다. 힌트를 주려면 제약 이름이 확실해야 하는데, 0001에서 이름
-- 없이 만들어 기본 이름에 기대고 있었다 -- 여기서 못 박는다.
alter table participants drop constraint if exists participants_room_id_fkey;

alter table participants
  add constraint participants_room_id_fkey
  foreign key (room_id) references rooms(id) on delete set null;
