-- 멘토님들과의 시간 — 수강신청.
--
-- 멘토 서너 분이 같은 시간에 각자 자리를 열고, 참가자는 그중 하나를 골라 듣는다.
-- 세션 전날까지는 마음을 바꿀 수 있다.

create table mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  -- 멘토도 명단에 있지만(교역자·멘토), 명단에 없는 분을 모실 수도 있어
  -- 이름은 따로 적어둔다.
  mentor_id uuid references participants(id) on delete set null,
  mentor_name text not null check (char_length(mentor_name) between 1 and 30),
  title text not null check (char_length(title) between 1 and 60),
  place text,
  starts_at timestamptz not null,
  capacity int not null default 20 check (capacity > 0),
  opens_at timestamptz not null,
  -- 이 시각이 지나면 신청도 취소도 변경도 막힌다 (세션 전날 끝을 넣는다)
  closes_at timestamptz not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- participant_id가 기본키다. **이 한 줄이 「한 사람 한 세션」을 보장한다** --
-- 화면에서 막는 것과 달리 두 창을 띄워놓고 눌러도 뚫리지 않는다.
-- 세션이 한 타임에 다 열리는 구조라서 쓸 수 있는 제약이다. 나중에 시간대가
-- 갈리면 이 줄을 풀고 겹침 검사로 바꿔야 한다.
create table mentor_signups (
  participant_id uuid primary key references participants(id) on delete cascade,
  session_id uuid not null references mentor_sessions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index mentor_signups_session_idx on mentor_signups (session_id);

alter table mentor_sessions enable row level security;
alter table mentor_signups  enable row level security;

create policy "mentor_sessions_select" on mentor_sessions
  for select to authenticated using (true);
create policy "mentor_sessions_admin" on mentor_sessions
  for all using (is_admin()) with check (is_admin());

-- 누가 어느 멘토를 골랐는지는 신청 정보다. 본인과 관리자만 본다.
-- 정원 표시(12/20)는 아래 RPC가 숫자만 세어 내려준다.
create policy "mentor_signups_select" on mentor_signups
  for select to authenticated
  using (participant_id = my_participant_id() or is_admin());
create policy "mentor_signups_admin" on mentor_signups
  for all using (is_admin()) with check (is_admin());
-- 참가자용 insert/update 정책은 두지 않는다. 아래 RPC로만 들어온다.

-- ── 목록 — 세션 + 정원 + 내가 고른 것 ───────────────────────────
create or replace function public.mentor_board()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'mine', (select session_id from mentor_signups where participant_id = my_participant_id()),
    'sessions', coalesce(
      (select jsonb_agg(to_jsonb(x) order by x.starts_at, x.sort_order, x.mentor_name)
       from (
         select s.id, s.mentor_name, s.title, s.place, s.starts_at,
                s.capacity, s.opens_at, s.closes_at, s.sort_order,
                (select count(*) from mentor_signups g where g.session_id = s.id) as taken
         from mentor_sessions s
       ) x),
      '[]'::jsonb)
  );
$$;

-- ── 신청과 변경은 같은 함수 하나 ────────────────────────────────
-- 「취소하고 다시 신청」으로 만들면, 옮기려던 자리가 그 사이에 차는 순간
-- 원래 자리도 잃는다. 새 세션을 먼저 잠그고, 자리가 있을 때만 옮긴다.
create or replace function public.set_mentor_session(p_session uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_me uuid := my_participant_id();
  v record;
  v_taken int;
begin
  if v_me is null then
    return jsonb_build_object('status', 'unbound');
  end if;

  select * into v from mentor_sessions where id = p_session for update;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if now() < v.opens_at then
    return jsonb_build_object('status', 'not_open');
  end if;
  if now() > v.closes_at then
    return jsonb_build_object('status', 'closed');
  end if;

  -- 나를 뺀 인원으로 센다. 이미 이 세션이면 자리를 두 번 세지 않고,
  -- 다른 세션에서 옮겨오는 경우 그 자리는 아래 upsert가 비운다.
  select count(*) into v_taken
  from mentor_signups
  where session_id = p_session and participant_id <> v_me;

  if v_taken >= v.capacity then
    return jsonb_build_object('status', 'full');
  end if;

  insert into mentor_signups (participant_id, session_id)
  values (v_me, p_session)
  on conflict (participant_id)
  do update set session_id = excluded.session_id, created_at = now();

  return jsonb_build_object('status', 'ok');
end;
$fn$;

create or replace function public.leave_mentor_session()
returns jsonb
language plpgsql security definer set search_path = public
as $fn$
declare
  v_me uuid := my_participant_id();
  v_closes timestamptz;
begin
  if v_me is null then
    return jsonb_build_object('status', 'unbound');
  end if;

  select s.closes_at into v_closes
  from mentor_signups g join mentor_sessions s on s.id = g.session_id
  where g.participant_id = v_me;

  if not found then
    return jsonb_build_object('status', 'none');
  end if;
  if now() > v_closes then
    return jsonb_build_object('status', 'closed');
  end if;

  delete from mentor_signups where participant_id = v_me;
  return jsonb_build_object('status', 'ok');
end;
$fn$;

grant execute on function public.mentor_board() to authenticated;
grant execute on function public.set_mentor_session(uuid) to authenticated;
grant execute on function public.leave_mentor_session() to authenticated;
