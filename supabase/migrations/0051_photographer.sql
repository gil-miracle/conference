-- 사진 담당 — 갤러리에 올리기만 할 수 있는 사람.
--
-- 사진은 운영진이 올린다(0038). 그런데 현장에서 사진을 찍는 사람이 곧
-- 운영진은 아니다 — 올리게 하려고 관리자 권한을 주면 명단·설정까지 열린다.
-- 진행자(is_host)와 같은 꼴로, 역할과 독립인 플래그 하나를 둔다.
--
-- 올리기만이다. 내리고 지우는 일은 여전히 운영진 몫이다 — 올린 사람이
-- 지우면 남들이 이미 본 것이 말없이 사라진다.

alter table participants
  add column if not exists is_photographer boolean not null default false;

create or replace function public.is_photographer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from participants
    where auth_user_id = auth.uid() and is_photographer and status = 'approved'
  );
$$;

grant execute on function public.is_photographer() to authenticated;

-- 관리자 화면이 한 번에 읽는 「나」에 같이 실어 보낸다
create or replace function public.admin_me()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', id, 'name', name, 'role', role,
    'is_host', is_host, 'is_photographer', is_photographer
  )
  from participants
  where auth_user_id = auth.uid()
$$;

-- 올리기는 운영진 + 사진 담당. 지우기(photos_delete)는 0038 그대로 운영진만.
drop policy if exists "photos_insert" on public.photos;
create policy "photos_insert" on public.photos
  for insert to authenticated
  with check (is_photographer());
