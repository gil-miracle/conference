-- 자리 채움은 관리자만 본다.
--
-- 0016에서 rooms와 같은 규칙(로그인 사용자 조회)을 줬는데, 방·조와 달리
-- 자리 채움을 읽는 참가자 화면이 없다. 명단 밖 사람 이름이라 참가자가 볼
-- 이유도 없다 -- 쓰지 않는 문은 닫아둔다.
drop policy if exists "room_holds_select" on room_holds;

create policy "room_holds_select" on room_holds
  for select using (is_admin());
