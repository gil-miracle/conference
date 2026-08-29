-- 참가자 성별.
--
-- 방 배정에 필요하다. 방에 남/여를 적어둬도 사람 쪽을 모르면 결국 이름을 보고
-- 짐작하게 된다.
--
-- 시트는 1/2로 받지만 여기에는 사람이 읽는 값으로 넣는다 -- DB를 직접 들여다볼
-- 때 1이 남자인지 여자인지 다시 찾아봐야 하는 값은 두지 않는다.
alter table participants
  add column if not exists gender text
  check (gender is null or gender in ('남', '여'));
