-- 숙박하지 않는 사람.
--
-- 통학하거나 하루만 오는 사람은 방이 없는 것이 정상인데, 지금은 "아직 방을
-- 못 정한 사람"과 한 덩어리로 보인다. 미배정 숫자가 끝까지 0이 되지 않아
-- 무엇이 남았는지 알 수 없다.
--
-- 시트의 '숙박일'과 따로 둔다. 그건 며칠 자느냐는 신청 답변이고, 이건
-- 방을 줄 것이냐는 운영 판단이다. 동기화가 덮어써서도 안 된다.
--
-- 정책은 0001의 participants_admin_all(for all)이 그대로 덮는다.
alter table public.participants
  add column if not exists no_stay boolean not null default false;

comment on column public.participants.no_stay is
  '숙박하지 않음 — 방 배정 대상에서 제외한다';
