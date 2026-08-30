-- 집회 번호가 다섯으로 정리됐다.
--
-- 프로그램이 배지를 떼면서 선교 특강이 MIRACLE 3, 주일 예배가 MIRACLE 5가 됐다.
-- 찬양 집회 이름도 따라간다 -- 시간표와 찬양리스트가 다른 번호를 부르면
-- "그 집회가 어느 집회지"를 매번 맞춰봐야 한다.
update song_sets
set name = 'MIRACLE 5 — 주일 예배'
where name = 'MIRACLE 6 — 주일 예배';
