# -*- coding: utf-8 -*-
"""verses.py 하나를 원본 삼아 마이그레이션과 타입을 찍어 낸다.

구절 목록이 세 군데(그림·DB·화면)에 흩어지면 한 곳만 고치고 나머지를 잊는다.
고치는 데는 verses.py 한 곳이고, 나머지는 여기서 다시 뽑는다.

    python design/wordcards/emit.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from verses import VERSES  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]


def sq(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def slug(ref_en: str) -> str:
    """ISAIAH 43:19 → isaiah-43-19.

    파일 이름은 영문으로 둔다. 카드 id(사43_19)는 사람이 읽기 좋지만,
    주소에 들어가면 인코딩을 거치며 캐시·CDN마다 다르게 다뤄진다.
    """
    out = []
    for ch in ref_en.lower():
        out.append(ch if ch.isalnum() else "-")
    return "-".join(x for x in "".join(out).split("-") if x)


def copy_renders() -> dict[str, int]:
    """그려 둔 카드를 public/wordcards/ 로 옮긴다.

    정사각은 앱이 바로 내보이는 것이라 맨 위에 두고(/wordcards/<slug>.jpg),
    폰 배경과 인쇄용은 아래 칸에 둔다(/wordcards/phone/, /wordcards/5x7/).
    rendered/는 git에 넣지 않으므로 여기 옮겨 둔 것이 남는 사본이다.
    """
    root = Path(__file__).parent / "rendered"
    out = ROOT / "public" / "wordcards"
    made = {}
    for ratio, sub in (("square", ""), ("phone", "phone"), ("5x7", "5x7")):
        dst = out / sub if sub else out
        dst.mkdir(parents=True, exist_ok=True)
        for old in dst.glob("*.jpg"):
            old.unlink()
        n = 0
        for vid, ref, _t, _b in VERSES:
            f = root / ratio / f"{vid}.jpg"
            if not f.exists():
                continue
            (dst / f"{slug(ref)}.jpg").write_bytes(f.read_bytes())
            n += 1
        made[ratio] = n
    return made


def main() -> None:
    rows = ",\n".join(
        f"  ({sq(vid)}, {i + 1}, {sq(slug(ref))}, {sq(ref)}, {sq(text)}, {sq(bold)})"
        for i, (vid, ref, text, bold) in enumerate(VERSES)
    )
    ids = ", ".join(sq(vid) for vid, *_ in VERSES)
    sql = f"""-- 말씀카드 {len(VERSES)}장과 「누구의 카드인가」.
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
{rows}
on conflict (id) do update
  set sort = excluded.sort, slug = excluded.slug, ref_en = excluded.ref_en,
      body = excluded.body, bold = excluded.bold;

-- 목록에서 빠진 장은 지운다. 이미 뽑은 사람이 있으면 그 사람의 카드가
-- 비워지고(on delete set null) 다음에 열 때 다시 뽑게 된다 — 없는 그림을
-- 가리키고 있는 것보다 낫다.
delete from wordcards where id not in ({ids});

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
"""
    out = ROOT / "supabase" / "migrations" / "0043_wordcards.sql"
    out.write_text(sql, encoding="utf-8", newline="\n")
    print("wrote", out, len(VERSES), "cards")
    print("copied to public/wordcards/:", copy_renders())


if __name__ == "__main__":
    main()
