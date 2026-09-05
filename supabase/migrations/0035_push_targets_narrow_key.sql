-- 알림을 보내려면 남의 구독을 읽어야 한다 — 그런데 service_role은 과하다.
--
-- 가입 요청을 넣는 사람은 이제 막 로그인한 미승인 계정이라, 그 세션으로는
-- RLS가 관리자 구독을 보여주지 않는다. 그래서 특별한 권한이 필요하긴 하다.
--
-- 다만 필요한 것은 「관리자들의 푸시 주소를 읽는 일」 하나뿐인데, service_role은
-- 그 데이터베이스 전체를 여는 열쇠다. 새면 명단·연락처·체크인이 통째로 나간다.
-- 그 하나만 하는 열쇠를 따로 만든다 — 새더라도 남에게 알림을 보내는 정도로
-- 그친다.
--
-- 열쇠 자체는 여기 적지 않는다. 마이그레이션은 저장소에 남으므로 해시만 둔다.
create extension if not exists pgcrypto;

/** 관리자들의 푸시 구독 — 열쇠를 아는 서버만 */
create or replace function public.admin_push_targets(p_secret text)
returns table (endpoint text, p256dh text, auth text)
language plpgsql stable security definer set search_path = public, extensions
as $fn$
begin
  if p_secret is null
     or encode(digest(p_secret, 'sha256'), 'hex')
        <> '4e880bdeb5bd6eb544a4b7c3746a04e18b9b732fbd50fb0c2bfb44115a7b5e50' then
    raise exception 'forbidden';
  end if;

  return query
    select s.endpoint, s.p256dh, s.auth
    from push_subscriptions s
    join participants p on p.id = s.participant_id
    where p.role = 'admin';
end;
$fn$;

/**
 * 죽은 구독 지우기.
 *
 * 기기를 바꾸거나 알림을 끄면 주소가 죽는다(404·410). 안 지우면 보낼 때마다
 * 실패를 되풀이하는데, 지우는 것도 남의 행이라 같은 열쇠가 필요하다.
 */
create or replace function public.admin_push_drop(p_secret text, p_endpoints text[])
returns int
language plpgsql security definer set search_path = public, extensions
as $fn$
declare
  v_count int;
begin
  if p_secret is null
     or encode(digest(p_secret, 'sha256'), 'hex')
        <> '4e880bdeb5bd6eb544a4b7c3746a04e18b9b732fbd50fb0c2bfb44115a7b5e50' then
    raise exception 'forbidden';
  end if;

  delete from push_subscriptions where endpoint = any(p_endpoints);
  get diagnostics v_count = row_count;
  return v_count;
end;
$fn$;

-- 열쇠가 문지기다. 열쇠 없이 부르면 예외로 끝난다.
grant execute on function public.admin_push_targets(text) to anon, authenticated;
grant execute on function public.admin_push_drop(text, text[]) to anon, authenticated;
