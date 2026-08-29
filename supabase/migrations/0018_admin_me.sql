-- 관리자 화면이 요청마다 세션을 확인하는 값.
--
-- 지금까지는 auth.getUser()로 한 번, 그 id로 participants를 한 번 -- 두 번
-- 다녀왔다. 명단은 5초마다 새로 받아오는 자리라 그 왕복이 그대로 쌓인다.
--
-- auth.uid()는 PostgREST가 검증한 JWT에서 나오므로, 한 번에 물어도 남의 행을
-- 가져올 수 없다.
create or replace function public.admin_me()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object('id', id, 'name', name, 'role', role)
  from participants
  where auth_user_id = auth.uid()
$$;

grant execute on function public.admin_me() to authenticated;
