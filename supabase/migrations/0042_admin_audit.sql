-- 누가 무엇을 했는지 남긴다.
--
-- 운영진이 여럿이라 「이 사람 승인 누가 했지」, 「이 사진 누가 지웠지」가
-- 행사 중에 반드시 나온다. 지금은 결과만 남고 손댄 사람은 안 남아서,
-- 물어보는 수밖에 없다 — 그마저 기억에 기댄다.
--
-- 되돌릴 수 없는 일(삭제·반려·연결 해제)과 사람의 판단이 들어간 일(승인·
-- 체크인·배정·공개 토글)을 적는다. 조회는 적지 않는다 — 그건 쌓이기만 하고
-- 찾을 때 방해가 된다.

create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  -- 사람은 지워질 수 있지만 기록은 남아야 한다. 이름을 그때 값 그대로 박는다
  actor_id uuid references public.participants(id) on delete set null,
  actor_name text not null,
  action text not null,
  target text,
  detail jsonb
);

create index if not exists admin_audit_at_idx on public.admin_audit (at desc);

alter table public.admin_audit enable row level security;

create policy "audit_admin_read" on public.admin_audit
  for select to authenticated using (is_admin());
create policy "audit_admin_write" on public.admin_audit
  for insert to authenticated with check (is_admin());
-- 고치거나 지우는 정책은 두지 않는다. 기록은 남는 것이 일이라, 지울 수 있으면
-- 지운 사람이 곧 안 남는다.
