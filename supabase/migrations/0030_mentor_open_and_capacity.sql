-- 멘토 세션 신청은 9월 6일 21시부터, 정원은 35명.
--
-- 처음 정한 20명은 자리를 잡으려고 넣은 값이었다. 실제로는 두 분을 모시고
-- 한 분당 35명을 받는다.
--
-- 신청 시작 시각은 세션마다 다를 이유가 없다 — 같은 시각에 함께 열어야
-- 먼저 본 사람이 유리해지지 않는다.
alter table public.mentor_sessions alter column capacity set default 35;

update public.mentor_sessions
set capacity = 35,
    -- 2026-09-06 21:00 (한국 시간)
    opens_at = timestamptz '2026-09-06 21:00:00+09'
where capacity <> 35
   or opens_at <> timestamptz '2026-09-06 21:00:00+09';
