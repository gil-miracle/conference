-- 방 성별은 반드시 셋 중 하나다.
--
-- "미지정"으로 둘 수 있게 하면 배정할 때 아무 정보도 주지 못하는 방이 생긴다.
-- 방을 만들 때 정하고 넘어가는 편이 낫다.
--
-- 기존 방이 있으면 기타로 두고 관리자가 고치게 한다 -- 남/여를 코드가
-- 짐작할 수는 없다.
update rooms set gender = '기타' where gender is null;

alter table rooms alter column gender set not null;
