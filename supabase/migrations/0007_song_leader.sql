-- ════════════════════════════════════════════════════════════════
-- 찬양 인도자 + 확정된 집회 구성
--
-- 일정이 확정되면서 집회가 MIRACLE 1~6으로 정리됐고, 그중 예배는 셋이다.
--   MIRACLE 1 (금 21:00) · MIRACLE 4 (토 20:00) · MIRACLE 6 (주일 14:00)
-- 나머지(2·3·5)는 프로그램이라 송리스트를 두지 않는다.
-- ════════════════════════════════════════════════════════════════

alter table song_sets add column if not exists leader text;

-- 0002에서 넣은 임시 세트를 실제 구성으로 교체한다.
-- 운영진이 이미 이름을 바꿨다면 그 세트는 건드리지 않도록,
-- 임시 이름과 정확히 일치하는 행만 지운다.
delete from song_sets
where name in (
  '개회 예배 — CALL',
  '오전 집회 — FAITH',
  '저녁 집회 — MIRACLE',
  '주일 예배 — SENT'
);

insert into song_sets (name, day_label, time_label, leader, sort_order) values
  ('MIRACLE 1 — 저녁 예배', '금 11',   '21:00', '조영찬 전도사', 1),
  ('MIRACLE 4 — 저녁 예배', '토 12',   '20:00', '최재윤 목사',   2),
  ('MIRACLE 6 — 주일 예배', '주일 13', '14:00', '박민희 자매',   3)
on conflict do nothing;

-- 곡은 확정되는 대로 관리자 '찬양' 탭에서 집회별 6~7곡씩 추가한다.
