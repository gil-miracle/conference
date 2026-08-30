-- 방명록은 로그인해야 읽는다.
--
-- 처음에는 누구나 읽게 뒀는데, 여기 올라오는 글이 인사만이 아니다 -- 기도제목이
-- 오간다. 게다가 작성자 이름은 명단의 실명이라, 주소를 아는 사람이면 참가자
-- 실명과 기도제목을 함께 보게 된다.
--
-- 검색 노출은 robots로 막고 있지만 그건 예의지 잠금장치가 아니다.
drop policy if exists "guestbook_select" on guestbook;

create policy "guestbook_select" on guestbook
  for select to authenticated using (not hidden or is_admin());
