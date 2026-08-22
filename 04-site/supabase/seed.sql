-- 개발용 데모 데이터 (운영 DB에는 실행하지 말 것)

insert into rooms (building, room_no, capacity) values
  ('비전관', '203', 4),
  ('은혜관', '102', 4),
  ('은혜관', '103', 4);

insert into teams (name, color, leader) values
  ('오렌지조', '#EF9A47', '이요셉'),
  ('그린조',   '#2E5638', '김한나');

insert into participants (name, birth_date, phone, room_id, team_id, role)
select '김예찬', '1994-01-01', '010-1234-3456', r.id, t.id, 'admin'
from rooms r, teams t
where r.building = '비전관' and r.room_no = '203' and t.name = '오렌지조';

insert into participants (name, birth_date, phone, room_id, team_id)
select v.name, v.birth::date, v.phone, r.id, t.id
from (values
  ('이요셉',   '1992-03-02', '010-2222-1234', '비전관', '203', '오렌지조'),
  ('박다윗',   '1996-07-11', '010-3333-7890', '비전관', '203', '그린조'),
  ('정사무엘', '1998-11-23', '010-4444-2345', '비전관', '203', '그린조'),
  ('김한나',   '1995-05-05', '010-5555-6789', '은혜관', '102', '그린조'),
  ('이레베카', '1997-09-14', '010-6666-3456', '은혜관', '102', '오렌지조'),
  ('최마리아', '1995-12-25', '010-7777-5678', '은혜관', '103', '오렌지조'),
  ('강바울',   '1998-02-17', '010-8888-9012', null,     null,  null)
) as v(name, birth, phone, bld, rno, team)
left join rooms r on r.building = v.bld and r.room_no = v.rno
left join teams t on t.name = v.team;

insert into guestbook (display_name, content, created_at) values
  ('은혜', '벌써 기대돼요! 올해도 기적을 경험하길 바라요.', now() - interval '2 days'),
  ('요셉', '작년에 은혜 받고 올해 또 갑니다. 다들 만나요!', now() - interval '3 days'),
  ('한나', '송리스트 미리 듣고 있어요. 현장에서 같이 불러요.', now() - interval '4 days');
