-- 레크리에이션 점수판.
--
-- 진행자는 사회를 보면서 한 손으로 점수를 넣는다. 관리자 화면은 명단·숙소·승인이
-- 들어차 있어 그 자리에선 방해만 되므로 화면을 따로 둔다.

-- ── 진행자 ──────────────────────────────────────────────────────
-- role에 넣지 않는다. role은 한 사람이 한 값만 갖는 칸이라, 거기 host를 넣으면
-- 관리자를 진행자로 쓸 수 없고 관리자를 올렸다 내리면 진행자 자격이 조용히
-- 사라진다. 칸을 따로 두면 둘이 독립이다.
alter table participants
  add column if not exists is_host boolean not null default false;

create or replace function public.is_host()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from participants
    where auth_user_id = auth.uid() and is_host
  );
$$;

grant execute on function public.is_host() to authenticated;

-- 진행자 여부도 같이 내려준다 — 화면 하나 여는 데 왕복을 더 늘리지 않는다
create or replace function public.admin_me()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id', id, 'name', name, 'role', role, 'is_host', is_host
  )
  from participants
  where auth_user_id = auth.uid()
$$;

-- ── 게임 ────────────────────────────────────────────────────────
-- host_id는 누가 진행하는지 적어두는 칸이지 자물쇠가 아니다. 권한을 게임별로
-- 쪼개면 현장에서 막힌다 -- 옆 게임이 먼저 끝나 대신 넣어주려는데 안 되고,
-- 배정을 깜빡하면 아무도 못 넣는다. 문은 is_host() 하나다.
create table games (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  host_id uuid references participants(id) on delete set null,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 게임 하나 × 조 하나 = 한 줄. 고쳐 쓰는 값이다.
create table game_scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  points int not null default 0,
  updated_at timestamptz not null default now(),
  unique (game_id, team_id)
);

-- 가산점은 사유와 함께 쌓이는 기록이다. game_scores에 섞으면 "총점이 왜 이렇지"를
-- 나중에 풀 수 없다.
--
-- 감점은 쓰지 않기로 했지만 제약을 걸지 않는다 -- 현장에서 필요해지는 날
-- 마이그레이션부터 해야 하는 상황을 만들지 않는다. 막는 건 화면에서 한다.
create table bonus_points (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  points int not null,
  reason text not null check (char_length(reason) between 1 and 60),
  given_by uuid references participants(id) on delete set null,
  created_at timestamptz not null default now()
);

create index game_scores_game_idx on game_scores (game_id);
create index bonus_points_team_idx on bonus_points (team_id);

alter table games        enable row level security;
alter table game_scores  enable row level security;
alter table bonus_points enable row level security;

-- 읽기는 로그인한 사람 전부(참가자 순위 화면이 쓴다).
-- 게임을 만들고 지우는 건 관리자, 점수를 넣는 건 진행자.
create policy "games_select" on games
  for select to authenticated using (true);
create policy "games_admin" on games
  for all using (is_admin()) with check (is_admin());

create policy "game_scores_select" on game_scores
  for select to authenticated using (true);
create policy "game_scores_host" on game_scores
  for all using (is_host()) with check (is_host());

create policy "bonus_points_select" on bonus_points
  for select to authenticated using (true);
create policy "bonus_points_host" on bonus_points
  for all using (is_host()) with check (is_host());

-- ── 순위 ────────────────────────────────────────────────────────
-- 뷰로 만들면 Supabase에서 기본이 security definer라 RLS를 통째로 우회한다.
-- 지금은 문제가 없어도 습관으로 남으면 다음에 다치므로 RPC로 둔다.
create or replace function public.team_standings()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x.total desc, x.name), '[]'::jsonb)
  from (
    select t.id, t.name,
           coalesce(g.s, 0) as game_total,
           coalesce(b.s, 0) as bonus_total,
           coalesce(g.s, 0) + coalesce(b.s, 0) as total
    from teams t
    left join (select team_id, sum(points) s from game_scores  group by 1) g on g.team_id = t.id
    left join (select team_id, sum(points) s from bonus_points group by 1) b on b.team_id = t.id
  ) x;
$$;

grant execute on function public.team_standings() to authenticated;
