-- 멘토 세션에 사진과 강의 소개를 붙인다.
--
-- 지금 카드에는 이름과 한 줄 주제밖에 없어서, 참가자가 무엇을 고르는지
-- 모른 채 고른다. 한 번 고르면 세션 전날까지만 바꿀 수 있으므로, 고르기
-- 전에 알아야 할 것을 화면에 두어야 한다.
--
-- 사진은 주소만 담는다. 파일을 우리가 들고 있을 이유가 없고, 갤러리에
-- 쓰는 Cloudinary에 올려 그 주소를 넣으면 된다.
alter table public.mentor_sessions
  add column if not exists photo_url text,
  add column if not exists intro text;

comment on column public.mentor_sessions.photo_url is '멘토 사진 주소 (없으면 이름만 보인다)';
comment on column public.mentor_sessions.intro is '강의 소개 — 고르기 전에 읽을 몇 줄';

-- 두 칸을 참가자 화면에도 내려보낸다. 0022의 함수에 열 두 개만 더한 것이고
-- 언어·정렬·구조는 그대로다.
create or replace function public.mentor_board()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'mine', (select session_id from mentor_signups where participant_id = my_participant_id()),
    'sessions', coalesce(
      (select jsonb_agg(to_jsonb(x) order by x.starts_at, x.sort_order, x.mentor_name)
       from (
         select s.id, s.mentor_name, s.title, s.intro, s.photo_url,
                s.place, s.starts_at,
                s.capacity, s.opens_at, s.closes_at, s.sort_order,
                (select count(*) from mentor_signups g where g.session_id = s.id) as taken
         from mentor_sessions s
       ) x),
      '[]'::jsonb)
  );
$$;
