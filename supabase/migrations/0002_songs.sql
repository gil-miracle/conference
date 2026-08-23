-- ════════════════════════════════════════════════════════════════
-- 송리스트 — 집회(세트)별 곡 목록. 관리자 '찬양' 탭에서 관리한다.
-- 0001_init.sql 실행 후 이어서 실행.
-- ════════════════════════════════════════════════════════════════

-- 집회 세트 (개회 예배 / 오전 집회 / 저녁 집회 / 주일 예배 …)
create table song_sets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_label text,                       -- 예: 금 11
  time_label text,                      -- 예: 19:30
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- 곡 (집회당 6~7곡)
create table songs (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references song_sets(id) on delete cascade,
  title text not null,
  song_key text,                        -- 원키 (G, A, D …)
  youtube_id text,                      -- YouTube 영상 ID (URL 아님)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index songs_set_idx on songs (set_id, sort_order);

alter table song_sets enable row level security;
alter table songs     enable row level security;

-- 읽기는 공개(비로그인 포함), 쓰기는 admin만
create policy "song_sets_select" on song_sets for select using (true);
create policy "song_sets_admin"  on song_sets for all
  using (is_admin()) with check (is_admin());

create policy "songs_select" on songs for select using (true);
create policy "songs_admin"  on songs for all
  using (is_admin()) with check (is_admin());

-- ── 초기 데이터 (임시 곡명 — 확정되면 관리자 화면에서 수정) ──────

insert into song_sets (name, day_label, time_label, sort_order) values
  ('개회 예배 — CALL',    '금 11',   '19:30', 1),
  ('오전 집회 — FAITH',   '토 12',   '09:30', 2),
  ('저녁 집회 — MIRACLE', '토 12',   '19:30', 3),
  ('주일 예배 — SENT',    '주일 13', '10:30', 4);

insert into songs (set_id, title, song_key, sort_order)
select s.id, v.title, v.k, v.ord
from song_sets s
join (values
  ('개회 예배 — CALL',    '은혜의 강가로 (임시)',      'G', 1),
  ('개회 예배 — CALL',    '주 품에 (임시)',            'D', 2),
  ('개회 예배 — CALL',    '여기에 모인 우리 (임시)',   'A', 3),
  ('개회 예배 — CALL',    '성령이 오셨네 (임시)',      'E', 4),
  ('개회 예배 — CALL',    '부르신 곳에서 (임시)',      'C', 5),
  ('개회 예배 — CALL',    '나의 반석 (임시)',          'G', 6),
  ('오전 집회 — FAITH',   '믿음의 노래 (임시)',        'D', 1),
  ('오전 집회 — FAITH',   '주 없이 살 수 없네 (임시)', 'A', 2),
  ('오전 집회 — FAITH',   '약속하신 말씀 위에 (임시)', 'E', 3),
  ('오전 집회 — FAITH',   '내 영혼이 (임시)',          'G', 4),
  ('오전 집회 — FAITH',   '주만 바라볼지라 (임시)',    'C', 5),
  ('오전 집회 — FAITH',   '선한 능력으로 (임시)',      'F', 6),
  ('저녁 집회 — MIRACLE', '기적을 노래해 (임시)',      'A', 1),
  ('저녁 집회 — MIRACLE', '주가 일하시네 (임시)',      'D', 2),
  ('저녁 집회 — MIRACLE', '일어나 빛을 발하라 (임시)', 'E', 3),
  ('저녁 집회 — MIRACLE', '놀라운 은혜 (임시)',        'G', 4),
  ('저녁 집회 — MIRACLE', '성령의 불 (임시)',          'B', 5),
  ('저녁 집회 — MIRACLE', '우리의 하나님 (임시)',      'C', 6),
  ('저녁 집회 — MIRACLE', '다시 오실 왕 (임시)',       'D', 7),
  ('주일 예배 — SENT',    '보내소서 (임시)',           'E', 1),
  ('주일 예배 — SENT',    '복의 근원 (임시)',          'G', 2),
  ('주일 예배 — SENT',    '이 땅에 (임시)',            'A', 3),
  ('주일 예배 — SENT',    '다시 만날 때까지 (임시)',   'C', 4),
  ('주일 예배 — SENT',    '가서 전하라 (임시)',        'D', 5),
  ('주일 예배 — SENT',    '축복하노라 (임시)',         'F', 6)
) as v(set_name, title, k, ord) on v.set_name = s.name;
