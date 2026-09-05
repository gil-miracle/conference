-- 멘토 두 분으로 확정 — 문경숙 멘토(관계) · 김유진 멘토(비전).
--
-- 그동안 들어 있던 것은 화면을 보려고 넣은 시험 세션이다. 신청이 아직
-- 열리지 않았으므로(9/6 21:00) 신청자가 있을 수 없다.
--
-- 그래도 지우기 전에 한 번 확인한다 — 사람이 붙은 줄을 조용히 날리는 것이
-- 제일 나쁘다. 하나라도 있으면 여기서 멈추고 아무것도 바꾸지 않는다.
do $$
begin
  if exists (select 1 from public.mentor_signups) then
    raise exception '신청이 이미 있습니다 — 세션을 갈아엎지 않습니다';
  end if;
end $$;

delete from public.mentor_sessions;

-- 시각은 일정표를 따른다. 멘토의 TMI는 9.12(토) 10:30~12:30.
insert into public.mentor_sessions
  (mentor_name, title, capacity, starts_at, opens_at, closes_at, sort_order)
values
  ('문경숙 멘토', '관계', 35,
   timestamptz '2026-09-12 10:30:00+09',
   timestamptz '2026-09-06 21:00:00+09',
   timestamptz '2026-09-12 12:30:00+09', 0),
  ('김유진 멘토', '비전', 35,
   timestamptz '2026-09-12 10:30:00+09',
   timestamptz '2026-09-06 21:00:00+09',
   timestamptz '2026-09-12 12:30:00+09', 1);
