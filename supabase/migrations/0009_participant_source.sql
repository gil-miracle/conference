-- 사람이 어디서 왔는지 남긴다.
--
-- 교역자·멘토처럼 신청서를 쓰지 않는 분들은 관리자가 화면에서 직접 넣는다.
-- 이분들은 시트에 없으므로, 표시가 없으면 동기화가 매번 "시트에서 사라진
-- 사람"으로 잡아 지우라고 권하게 된다.
alter table participants
  add column if not exists source text not null default 'sheet';

comment on column participants.source is
  'sheet = 구글 시트 동기화로 들어온 사람, manual = 관리자가 화면에서 넣은 사람';
