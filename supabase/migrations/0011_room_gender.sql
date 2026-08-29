-- 방마다 남/여를 정해둔다.
--
-- 배정할 때 사람 이름만 보고 남자 방에 여자를 넣는 사고가 나기 쉽다.
-- 방 자체에 적어두면 배정 화면에서 고를 때부터 보인다.
--
-- 값은 우리가 정하는 셋뿐이라 제약을 건다. 신청서 문구처럼 나중에 바뀔
-- 말이 아니다. 기존 방은 null로 남아 "미지정"으로 보인다.
alter table rooms
  add column if not exists gender text
  check (gender is null or gender in ('남', '여', '기타'));
