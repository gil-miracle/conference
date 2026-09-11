-- 말씀카드 44장과 「누구의 카드인가」.
--
-- 카드는 미리 그려 둔 그림이다(public/wordcards/<slug>.jpg). 여기에는 그 그림에
-- 무엇이 적혀 있는지와, 누가 어느 장을 뽑았는지만 둔다.
--
-- 뽑기는 한 번뿐이다. 다시 누르면 같은 장이 나온다 — 마음에 드는 구절이
-- 나올 때까지 다시 뽑으면 「내게 주신 말씀」이 아니라 고른 말씀이 된다.
--
-- 아직 아무도 안 뽑은 장을 먼저 준다. 44장을 다 나눠 가진 뒤부터는
-- 가장 적게 나간 장부터 다시 돌린다 — 80명이면 한 말씀을 둘이 받는다.

create table if not exists wordcards (
  id text primary key,                  -- 그림 파일 이름과 같다 (사43_19)
  sort int not null,
  slug text not null unique,            -- 그림 주소 (/wordcards/<slug>.jpg)
  ref_en text not null,                 -- ISAIAH 43:19
  body text not null,
  bold text not null default ''         -- body 안에서 굵게 뽑는 구간
);

insert into wordcards (id, sort, slug, ref_en, body, bold) values
  ('출14_14', 1, 'exodus-14-14', 'EXODUS 14:14', '여호와께서 너희를 위하여 싸우시리니 너희는 가만히 있을지니라', '너희를 위하여 싸우시리니'),
  ('대하20_15', 2, '2-chronicles-20-15', '2 CHRONICLES 20:15', '이 전쟁은 너희에게 속한 것이 아니요 하나님께 속한 것이니라', '하나님께 속한 것이니라'),
  ('욥23_10', 3, 'job-23-10', 'JOB 23:10', '내가 가는 길을 그가 아시나니 그가 나를 단련하신 후에는 내가 순금 같이 되어 나오리라', '순금 같이 되어 나오리라'),
  ('시37_4', 4, 'psalm-37-4', 'PSALM 37:4', '또 여호와를 기뻐하라 그가 네 마음의 소원을 네게 이루어 주시리로다', '네 마음의 소원을'),
  ('시73_26', 5, 'psalm-73-26', 'PSALM 73:26', '내 육체와 마음은 쇠약하나 하나님은 내 마음의 반석이시요 영원한 분깃이시라', '내 마음의 반석이시요'),
  ('시103_2', 6, 'psalm-103-2', 'PSALM 103:2', '내 영혼아 여호와를 송축하며 그의 모든 은택을 잊지 말지어다', '그의 모든 은택을'),
  ('시118_23', 7, 'psalm-118-23', 'PSALM 118:23', '이는 여호와께서 행하신 것이요 우리 눈에 기이한 바로다', '우리 눈에 기이한 바로다'),
  ('시126_3', 8, 'psalm-126-3', 'PSALM 126:3', '여호와께서 우리를 위하여 큰 일을 행하셨으니 우리는 기쁘도다', '큰 일을 행하셨으니'),
  ('잠3_5', 9, 'proverbs-3-5', 'PROVERBS 3:5', '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라', '여호와를 신뢰하고'),
  ('사43_19', 10, 'isaiah-43-19', 'ISAIAH 43:19', '보라 내가 새 일을 행하리니 이제 나타낼 것이라 너희가 그것을 알지 못하겠느냐', '내가 새 일을'),
  ('렘32_27', 11, 'jeremiah-32-27', 'JEREMIAH 32:27', '나는 여호와요 모든 육체의 하나님이라 내게 할 수 없는 일이 있겠느냐', '할 수 없는 일이 있겠느냐'),
  ('슥4_6', 12, 'zechariah-4-6', 'ZECHARIAH 4:6', '이는 힘으로 되지 아니하며 능력으로 되지 아니하고 오직 나의 영으로 되느니라', '오직 나의 영으로 되느니라'),
  ('요14_6', 13, 'john-14-6', 'JOHN 14:6', '내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라', '길이요 진리요 생명이니'),
  ('요14_27', 14, 'john-14-27', 'JOHN 14:27', '평안을 너희에게 끼치노니 곧 나의 평안을 너희에게 주노라', '나의 평안을 너희에게'),
  ('요16_33', 15, 'john-16-33', 'JOHN 16:33', '세상에서는 너희가 환난을 당하나 담대하라 내가 세상을 이기었노라', '내가 세상을 이기었노라'),
  ('고전15_58', 16, '1-corinthians-15-58', '1 CORINTHIANS 15:58', '견실하며 흔들리지 말고 항상 주의 일에 더욱 힘쓰는 자들이 되라', '흔들리지 말고'),
  ('고후12_9', 17, '2-corinthians-12-9', '2 CORINTHIANS 12:9', '내 은혜가 네게 족하도다 이는 내 능력이 약한 데서 온전하여짐이라 하신지라', '내 은혜가 네게 족하도다'),
  ('빌4_13', 18, 'philippians-4-13', 'PHILIPPIANS 4:13', '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라', '내가 모든 것을 할 수 있느니라'),
  ('골3_23', 19, 'colossians-3-23', 'COLOSSIANS 3:23', '무슨 일을 하든지 마음을 다하여 주께 하듯 하고 사람에게 하듯 하지 말라', '주께 하듯 하고'),
  ('출34_6', 20, 'exodus-34-6', 'EXODUS 34:6', '여호와라 여호와라 자비롭고 은혜롭고 노하기를 더디하고 인자와 진실이 많은 하나님이라', '인자와 진실이 많은'),
  ('레26_12', 21, 'leviticus-26-12', 'LEVITICUS 26:12', '나는 너희 중에 행하여 너희의 하나님이 되고 너희는 내 백성이 될 것이니라', '너희는 내 백성이 될 것이니라'),
  ('신6_5', 22, 'deuteronomy-6-5', 'DEUTERONOMY 6:5', '너는 마음을 다하고 뜻을 다하고 힘을 다하여 네 하나님 여호와를 사랑하라', '마음을 다하고 뜻을 다하고'),
  ('시9_9', 23, 'psalm-9-9', 'PSALM 9:9', '여호와는 압제를 당하는 자의 요새이시요 환난 때의 요새이시로다', '환난 때의 요새이시로다'),
  ('시32_8', 24, 'psalm-32-8', 'PSALM 32:8', '내가 네 갈 길을 가르쳐 보이고 너를 주목하여 훈계하리로다', '네 갈 길을 가르쳐 보이고'),
  ('시33_4', 25, 'psalm-33-4', 'PSALM 33:4', '여호와의 말씀은 정직하며 그가 행하시는 일은 다 진실하시도다', '그가 행하시는 일은'),
  ('시33_11', 26, 'psalm-33-11', 'PSALM 33:11', '여호와의 계획은 영원히 서고 그의 생각은 대대에 이르리로다', '여호와의 계획은 영원히 서고'),
  ('시40_1', 27, 'psalm-40-1', 'PSALM 40:1', '내가 여호와를 기다리고 기다렸더니 귀를 기울이사 나의 부르짖음을 들으셨도다', '나의 부르짖음을 들으셨도다'),
  ('시50_15', 28, 'psalm-50-15', 'PSALM 50:15', '환난 날에 나를 부르라 내가 너를 건지리니 네가 나를 영화롭게 하리로다', '내가 너를 건지리니'),
  ('시107_1', 29, 'psalm-107-1', 'PSALM 107:1', '여호와께 감사하라 그는 선하시며 그 인자하심이 영원함이로다', '그 인자하심이 영원함이로다'),
  ('시116_1', 30, 'psalm-116-1', 'PSALM 116:1', '여호와께서 내 음성과 내 간구를 들으시므로 내가 그를 사랑하는도다', '내 간구를 들으시므로'),
  ('시125_1', 31, 'psalm-125-1', 'PSALM 125:1', '여호와를 의지하는 자는 시온 산이 흔들리지 아니하고 영원히 있음 같도다', '흔들리지 아니하고'),
  ('시130_5', 32, 'psalm-130-5', 'PSALM 130:5', '나 곧 내 영혼은 여호와를 기다리며 나는 주의 말씀을 바라는도다', '주의 말씀을 바라는도다'),
  ('시147_5', 33, 'psalm-147-5', 'PSALM 147:5', '우리 주는 위대하시며 능력이 많으시며 그의 지혜가 무궁하시도다', '그의 지혜가 무궁하시도다'),
  ('잠4_23', 34, 'proverbs-4-23', 'PROVERBS 4:23', '모든 지킬 만한 것 중에 더욱 네 마음을 지키라 생명의 근원이 이에서 남이니라', '네 마음을 지키라'),
  ('잠18_10', 35, 'proverbs-18-10', 'PROVERBS 18:10', '여호와의 이름은 견고한 망대라 의인은 그리로 달려가서 안전함을 얻느니라', '견고한 망대라'),
  ('사32_17', 36, 'isaiah-32-17', 'ISAIAH 32:17', '공의의 열매는 화평이요 공의의 결과는 영원한 평안과 안전이라', '공의의 열매는 화평이요'),
  ('사40_8', 37, 'isaiah-40-8', 'ISAIAH 40:8', '풀은 마르고 꽃은 시드나 우리 하나님의 말씀은 영원히 서리라 하라', '말씀은 영원히 서리라'),
  ('애3_26', 38, 'lamentations-3-26', 'LAMENTATIONS 3:26', '사람이 여호와의 구원을 바라고 잠잠히 기다림이 좋도다', '잠잠히 기다림이 좋도다'),
  ('마22_37', 39, 'matthew-22-37', 'MATTHEW 22:37', '네 마음을 다하고 목숨을 다하고 뜻을 다하여 주 너의 하나님을 사랑하라', '주 너의 하나님을 사랑하라'),
  ('막1_17', 40, 'mark-1-17', 'MARK 1:17', '나를 따라오라 내가 너희로 사람을 낚는 어부가 되게 하리라', '사람을 낚는 어부가'),
  ('요10_10', 41, 'john-10-10', 'JOHN 10:10', '내가 온 것은 양으로 생명을 얻게 하고 더 풍성히 얻게 하려는 것이라', '더 풍성히 얻게 하려는'),
  ('빌4_4', 42, 'philippians-4-4', 'PHILIPPIANS 4:4', '주 안에서 항상 기뻐하라 내가 다시 말하노니 기뻐하라', '주 안에서 항상 기뻐하라'),
  ('살전5_11', 43, '1-thessalonians-5-11', '1 THESSALONIANS 5:11', '그러므로 피차 권면하고 서로 덕을 세우기를 너희가 하는 것 같이 하라', '서로 덕을 세우기를'),
  ('살후3_3', 44, '2-thessalonians-3-3', '2 THESSALONIANS 3:3', '주는 미쁘사 너희를 굳건하게 하시고 악한 자에게서 지키시리라', '너희를 굳건하게 하시고')
on conflict (id) do update
  set sort = excluded.sort, slug = excluded.slug, ref_en = excluded.ref_en,
      body = excluded.body, bold = excluded.bold;

-- 목록에서 빠진 장은 지운다. 이미 뽑은 사람이 있으면 그 사람의 카드가
-- 비워지고(on delete set null) 다음에 열 때 다시 뽑게 된다 — 없는 그림을
-- 가리키고 있는 것보다 낫다.
delete from wordcards where id not in ('출14_14', '대하20_15', '욥23_10', '시37_4', '시73_26', '시103_2', '시118_23', '시126_3', '잠3_5', '사43_19', '렘32_27', '슥4_6', '요14_6', '요14_27', '요16_33', '고전15_58', '고후12_9', '빌4_13', '골3_23', '출34_6', '레26_12', '신6_5', '시9_9', '시32_8', '시33_4', '시33_11', '시40_1', '시50_15', '시107_1', '시116_1', '시125_1', '시130_5', '시147_5', '잠4_23', '잠18_10', '사32_17', '사40_8', '애3_26', '마22_37', '막1_17', '요10_10', '빌4_4', '살전5_11', '살후3_3');

alter table participants
  add column if not exists wordcard text references wordcards(id) on delete set null,
  add column if not exists wordcard_drawn_at timestamptz;

alter table wordcards enable row level security;

-- 카드에 적힌 말씀은 숨길 것이 없다. 다만 로그인한 사람만 본다 —
-- 뽑기 화면이 로그인 뒤에 있는데 목록만 밖에서 읽히면 앞뒤가 안 맞는다.
drop policy if exists wordcards_select on wordcards;
create policy wordcards_select on wordcards for select to authenticated using (true);

/**
 * 내 말씀카드를 뽑는다.
 *
 * 이미 뽑았으면 그 장을 그대로 돌려준다. 처음이면 아직 아무도 안 뽑은 장
 * 가운데 하나를 무작위로 준다(다 나갔으면 가장 적게 나간 장 중에서).
 *
 * 승인된 사람만 뽑는다. 승인 전에는 「내 것」이라 할 자리가 없다.
 */
create or replace function public.draw_my_wordcard()
returns jsonb
language plpgsql volatile security definer set search_path = public
as $fn$
declare
  v participants%rowtype;
  v_id text;
begin
  select * into v from participants where auth_user_id = auth.uid() for update;
  if not found or v.status <> 'approved' then
    return null;
  end if;

  if v.wordcard is null then
    -- 두 사람이 같은 순간에 누르면 「아직 아무도 안 뽑은 장」을 둘 다 같은
    -- 것으로 읽는다. 뽑는 동안만 줄을 세운다 — 몇 밀리초짜리 대기다.
    perform pg_advisory_xact_lock(hashtext('wordcard_draw'));

    select w.id into v_id
    from wordcards w
    left join participants p on p.wordcard = w.id
    group by w.id
    order by count(p.id), random()
    limit 1;

    update participants
      set wordcard = v_id, wordcard_drawn_at = now()
      where id = v.id;
    v.wordcard := v_id;
  elsif v.wordcard_drawn_at is null then
    update participants set wordcard_drawn_at = now() where id = v.id;
  end if;

  return (
    select jsonb_build_object(
      'id', w.id, 'slug', w.slug, 'ref_en', w.ref_en,
      'body', w.body, 'bold', w.bold
    ) from wordcards w where w.id = v.wordcard
  );
end;
$fn$;

revoke all on function public.draw_my_wordcard() from public;
grant execute on function public.draw_my_wordcard() to authenticated;

-- 내 정보에 「뽑았는가」를 함께 실어 보낸다. 뽑기 단추를 그릴지 카드를 그릴지
-- 정하려고 왕복을 한 번 더 도는 것은 아깝다 (0041에 한 줄 더한 것뿐이다).
create or replace function public.get_my_summary()
returns jsonb
language plpgsql stable security definer set search_path = public
as $fn$
declare
  v participants%rowtype;
  v_room jsonb;
  v_team jsonb;
  v_mates jsonb := '[]'::jsonb;
  v_members jsonb := '[]'::jsonb;
  v_rooms_open boolean;
  v_teams_open boolean;
  v_room_leader uuid;
  v_team_leader uuid;
begin
  select * into v from participants where auth_user_id = auth.uid();
  if not found then
    return null;
  end if;

  if v.status <> 'approved' then
    return jsonb_build_object(
      'id', v.id, 'name', v.name, 'role', v.role,
      'status', v.status, 'reject_reason', v.reject_reason,
      'checked_in_at', null, 'checkin_token', null,
      'room', null, 'mates', '[]'::jsonb, 'team', null,
      'rooms_open', false, 'teams_open', false, 'wordcard', null
    );
  end if;

  select coalesce((value ->> 'value')::boolean, false) into v_rooms_open
  from site_settings where key = 'rooms_open';
  v_rooms_open := coalesce(v_rooms_open, false);

  select coalesce((value ->> 'value')::boolean, false) into v_teams_open
  from site_settings where key = 'teams_open';
  v_teams_open := coalesce(v_teams_open, false);

  if v_rooms_open and v.room_id is not null then
    select jsonb_build_object(
      'building', building, 'room_no', room_no,
      'capacity', capacity, 'note', note
    ), leader_id
    into v_room, v_room_leader
    from rooms where id = v.room_id;

    select coalesce(jsonb_agg(jsonb_build_object(
             'name', x.name, 'gender', x.gender, 'leader', x.leader
           ) order by x.leader desc, x.name), '[]'::jsonb)
    into v_mates
    from (
      select name, gender, (id = v_room_leader) as leader
        from participants
        where room_id = v.room_id and status = 'approved'
      union all
      select name, gender, false from room_holds where room_id = v.room_id
    ) x;
  end if;

  if v_teams_open and v.team_id is not null then
    select jsonb_build_object(
      'name', t.name,
      'leader', coalesce((select p.name from participants p where p.id = t.leader_id), t.leader),
      'note', t.note
    ), t.leader_id
    into v_team, v_team_leader
    from teams t where t.id = v.team_id;

    select coalesce(jsonb_agg(jsonb_build_object(
             'name', p.name, 'gender', p.gender, 'leader', (p.id = v_team_leader)
           ) order by (p.id = v_team_leader) desc, p.name), '[]'::jsonb)
    into v_members
    from participants p
    where p.team_id = v.team_id and p.status = 'approved';

    v_team := v_team || jsonb_build_object('members', v_members);
  end if;

  return jsonb_build_object(
    'id', v.id, 'name', v.name, 'role', v.role,
    'status', v.status, 'reject_reason', null,
    'checked_in_at', v.checked_in_at, 'checkin_token', v.checkin_token,
    'room', v_room, 'mates', v_mates, 'team', v_team,
    'rooms_open', v_rooms_open, 'teams_open', v_teams_open,
    'wordcard', (select w.slug from wordcards w where w.id = v.wordcard)
  );
end;
$fn$;
